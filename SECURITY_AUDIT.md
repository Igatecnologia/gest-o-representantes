# Auditoria de Segurança — 2026-04-26

## Sumário

**Stack:** Next.js 15 (App Router) + React 19 + Drizzle ORM (SQLite/Turso) + JWT (jose) + bcrypt-ts
**Escopo:** 11 server actions, 6 API routes, 1 middleware, auth system, schema, configs, dependências
**Findings:** 🔴 1 Crítica | 🟠 3 Altas | 🟡 3 Médias | 🟢 2 Baixas

**Top 3 riscos:**
1. IDOR na busca global — qualquer rep vê clientes/propostas de outros reps
2. Falta de validação de ownership na criação de deals/vendas — rep pode registrar venda para cliente de outro rep
3. Token JWT não é revogável — sessão comprometida não pode ser invalidada até expirar

---

## Vulnerabilidades

### [VULN-001] IDOR na API de busca global (Command Palette)

- Severidade: 🔴 Crítica
- OWASP: API1:2023 — Broken Object Level Authorization
- CWE: CWE-639
- Local: `src/app/api/search/route.ts:20-39`
- Fonte: revisão manual

**Como explorar**
```bash
# Rep autenticado busca clientes de TODOS os representantes
curl -b "session=<token-rep-A>" \
  "https://app.example.com/api/search?q=silva"
# Retorna IDs e nomes de clientes de Rep B, C, D...
```

**Impacto**
Qualquer representante autenticado pode descobrir toda a base de clientes do sistema (nomes, IDs), incluindo clientes de concorrentes internos. Com os IDs, pode tentar acessar detalhes via outras rotas.

**Código vulnerável**
```typescript
// src/app/api/search/route.ts:20-25
const [customers, products, proposals] = await Promise.all([
  db
    .select({ id: schema.customers.id, name: schema.customers.name })
    .from(schema.customers)
    .where(sql`${schema.customers.name} LIKE ${pattern}`) // SEM FILTRO POR REP
    .limit(5),
```

**Fix**
```typescript
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql, and, eq } from "drizzle-orm";
import { getSession, getCurrentRep, isAdmin as checkAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;
  const admin = checkAdmin(session);
  const rep = !admin ? await getCurrentRep(session) : null;

  const customerWhere = admin
    ? sql`${schema.customers.name} LIKE ${pattern}`
    : sql`${schema.customers.name} LIKE ${pattern} AND ${schema.customers.representativeId} = ${rep?.id}`;

  const proposalWhere = admin
    ? sql`${schema.customers.name} LIKE ${pattern}`
    : sql`${schema.customers.name} LIKE ${pattern} AND ${schema.proposals.representativeId} = ${rep?.id}`;

  const [customers, products, proposals] = await Promise.all([
    db
      .select({ id: schema.customers.id, name: schema.customers.name })
      .from(schema.customers)
      .where(customerWhere)
      .limit(5),
    db
      .select({ id: schema.products.id, name: schema.products.name })
      .from(schema.products)
      .where(sql`${schema.products.name} LIKE ${pattern}`)
      .limit(5),
    db
      .select({
        id: schema.proposals.id,
        customerName: schema.customers.name,
      })
      .from(schema.proposals)
      .leftJoin(schema.customers, sql`${schema.customers.id} = ${schema.proposals.customerId}`)
      .where(proposalWhere)
      .limit(5),
  ]);

  return NextResponse.json({
    results: [
      ...customers.map((c) => ({ type: "cliente", id: c.id, label: c.name, href: `/clientes/${c.id}` })),
      ...products.map((p) => ({ type: "produto", id: p.id, label: p.name, href: `/produtos/${p.id}/editar` })),
      ...proposals.map((p) => ({ type: "proposta", id: p.id, label: p.customerName ?? p.id, href: `/propostas/${p.id}` })),
    ],
  });
}
```

**Defesa em camadas**
1. Adicionar o mesmo filtro na query de propostas
2. Considerar rate-limit na busca (atualmente sem)
3. Log de auditoria para buscas que retornam dados de outros reps

---

### [VULN-002] Falta de validação de ownership de cliente ao criar deal

- Severidade: 🟠 Alta
- OWASP: API1:2023 — Broken Object Level Authorization
- CWE: CWE-639
- Local: `src/lib/actions/deals.ts:50-60`
- Fonte: revisão manual

**Como explorar**
```javascript
// Rep A conhece o ID de um cliente de Rep B (via VULN-001 ou adivinhando)
// No form de novo deal, manipula o customerId no FormData
const formData = new FormData();
formData.set("title", "Meu deal");
formData.set("customerId", "id-do-cliente-do-rep-B"); // IDOR
formData.set("value", "5000");
```

**Impacto**
Rep pode criar deals associados a clientes de outros representantes, gerando confusão operacional, possibilidade de "roubar" leads e comissões.

**Código vulnerável**
```typescript
// src/lib/actions/deals.ts:48-60
const d = parsed.data;
await db.insert(schema.deals).values({
  title: d.title,
  customerId: d.customerId,  // NENHUMA VALIDAÇÃO DE OWNERSHIP
  representativeId: d.representativeId,
  // ...
});
```

**Fix**
```typescript
const d = parsed.data;

// Validar que o cliente pertence ao rep (ou é admin)
if (!isAdmin) {
  const [customer] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(and(
      eq(schema.customers.id, d.customerId),
      eq(schema.customers.representativeId, repId)
    ))
    .limit(1);
  if (!customer) return { error: "Cliente não encontrado." };
}

await db.insert(schema.deals).values({
  title: d.title,
  customerId: d.customerId,
  representativeId: d.representativeId,
  // ...
});
```

**Defesa em camadas**
1. Aplicar mesma validação no `updateDealAction`
2. Na UI, listar apenas clientes do próprio rep no select (já feito em várias pages, verificar completude)

---

### [VULN-003] Falta de validação de ownership de cliente ao criar venda

- Severidade: 🟠 Alta
- OWASP: API1:2023 — Broken Object Level Authorization
- CWE: CWE-639
- Local: `src/lib/actions/sales.ts:39-82`
- Fonte: revisão manual

**Como explorar**
```javascript
// Mesmo cenário: Rep manipula customerId no form de nova venda
const formData = new FormData();
formData.set("customerId", "id-do-cliente-do-rep-B");
formData.set("productId", "prod-valido");
formData.set("quantity", "1");
formData.set("unitPrice", "1000");
```

**Impacto**
Rep pode registrar vendas para clientes de outros reps. A comissão é calculada e atribuída ao rep que criou a venda, gerando **impacto financeiro direto** (comissão indevida).

**Código vulnerável**
```typescript
// src/lib/actions/sales.ts:39-82
const { representativeId, customerId, productId, quantity, unitPrice, discount, notes } =
  parsed.data;
// Nenhuma verificação se customerId pertence ao rep
const totalCents = Math.max(0, quantity * unitPriceCents - discountCents);
```

**Fix**
```typescript
const { representativeId, customerId, productId, quantity, unitPrice, discount, notes } =
  parsed.data;

// Validar ownership do cliente
if (!isAdmin) {
  const [customer] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(and(
      eq(schema.customers.id, customerId),
      eq(schema.customers.representativeId, repId)
    ))
    .limit(1);
  if (!customer) return { error: "Cliente não encontrado." };
}
```

**Defesa em camadas**
1. Audit log já registra criação de vendas — monitorar vendas para clientes de outros reps
2. Report mensal de vendas por rep vs. clientes do rep (anomalia = alerta)

---

### [VULN-004] Falta de validação de ownership de cliente ao criar proposta

- Severidade: 🟠 Alta
- OWASP: API1:2023 — Broken Object Level Authorization
- CWE: CWE-639
- Local: `src/lib/actions/proposals.ts:62-86`
- Fonte: revisão manual

**Como explorar**
```javascript
// Rep cria proposta para cliente de outro rep
await createProposalAction({
  customerId: "id-do-cliente-do-rep-B",
  productId: "prod-valido",
  items: [{ label: "Item", type: "one_time", defaultValue: 100, value: 100 }],
});
```

**Impacto**
Rep pode gerar propostas em nome do sistema para clientes de outros representantes, interferindo no relacionamento comercial.

**Código vulnerável**
```typescript
// src/lib/actions/proposals.ts:62-73
const proposal = await db.transaction(async (tx) => {
  const [p] = await tx
    .insert(schema.proposals)
    .values({
      customerId: d.customerId, // SEM VALIDAÇÃO DE OWNERSHIP
      representativeId: finalRepId!,
      productId: d.productId,
      // ...
    })
    .returning();
```

**Fix**
```typescript
// Antes da transação, adicionar:
if (!isAdmin) {
  const [customer] = await db
    .select({ id: schema.customers.id })
    .from(schema.customers)
    .where(and(
      eq(schema.customers.id, d.customerId),
      eq(schema.customers.representativeId, finalRepId!)
    ))
    .limit(1);
  if (!customer) return { error: "Cliente não encontrado." };
}
```

**Defesa em camadas**
1. Mesma validação no `updateProposalAction`
2. Frontend já filtra clientes por rep no select — mas não pode confiar apenas no frontend

---

### [VULN-005] JWT sem mecanismo de revogação

- Severidade: 🟡 Média
- OWASP: A07:2021 — Identification and Authentication Failures
- CWE: CWE-613
- Local: `src/lib/auth.ts:27-41`
- Fonte: revisão manual

**Como explorar**
```bash
# Cenário: Admin desativa um rep ou altera role
# O token existente do rep continua válido por até 24h
# Rep demitido mantém acesso ao sistema até o token expirar
```

**Impacto**
Se um representante é desligado ou tem conta desativada, ele mantém acesso por até 24 horas. Em caso de comprometimento de conta, não há forma de forçar logout.

**Código vulnerável**
```typescript
// auth.ts - JWT é stateless, não há blocklist
export async function getSession(): Promise<SessionPayload | null> {
  // Apenas valida assinatura e expiração
  const { payload } = await jwtVerify(token, secret());
  return payload as unknown as SessionPayload;
}
```

**Fix**
```typescript
// Opção 1: Verificar flag "active" do usuário a cada request sensível
export async function requireScope() {
  const session = await requireUser();

  // Verificar se usuário ainda está ativo (query leve, pode cachear por 5min)
  const [user] = await db
    .select({ active: schema.users.active, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, session.sub))
    .limit(1);

  if (!user || !user.active) {
    const jar = await cookies();
    jar.delete("session");
    redirect("/login");
  }

  // Se role mudou, forçar novo login
  if (user.role !== session.role) {
    const jar = await cookies();
    jar.delete("session");
    redirect("/login");
  }

  if (isAdmin(session)) {
    return { session, isAdmin: true as const, repId: null };
  }
  // ...
}
```

**Defesa em camadas**
1. Reduzir TTL do token para 4 horas em produção
2. Adicionar campo `tokenVersion` no user — incrementar ao desativar — rejeitar tokens antigos
3. No middleware, verificar `user.active` periodicamente (a cada 5 min via header timestamp)

---

### [VULN-006] Rate limit baseado em user ID — bypassável antes do login

- Severidade: 🟡 Média
- OWASP: A07:2021 — Identification and Authentication Failures
- CWE: CWE-307
- Local: `src/lib/rate-limit.ts` + `src/lib/actions/auth.ts`
- Fonte: revisão manual

**Como explorar**
```bash
# O rate limit de login usa o email como chave
# Mas um atacante pode testar MUITOS emails diferentes sem limite global
# Brute-force distribuído: 5 tentativas por email × N emails = N×5 tentativas
for email in lista_emails.txt; do
  curl -X POST https://app.example.com/login \
    -d "email=$email&password=SenhaComum123"
done
```

**Impacto**
Credential stuffing attack: atacante com lista de emails pode testar senhas comuns em todos os emails sem ser bloqueado (cada email tem quota independente de 5 tentativas).

**Código vulnerável**
```typescript
// src/lib/actions/auth.ts — rate limit por email
const { blocked } = await checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
```

**Fix**
```typescript
// Adicionar rate limit por IP (via header) além do email
export async function loginAction(_prev: unknown, formData: FormData) {
  // ... validação ...

  // Rate limit por IP (limite global)
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { blocked: ipBlocked } = await checkRateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000);
  if (ipBlocked) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  // Rate limit por email (limite específico)
  const { blocked } = await checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000);
  if (blocked) {
    return { error: "Muitas tentativas para este e-mail. Aguarde 15 minutos." };
  }
  // ...
}
```

**Defesa em camadas**
1. Adicionar CAPTCHA após 3 falhas consecutivas
2. Notificar admin sobre padrões suspeitos (>50 tentativas/hora de IPs distintos)
3. Considerar account lockout temporário após 10 falhas por email

---

### [VULN-007] unsafe-inline no CSP enfraquece proteção contra XSS

- Severidade: 🟡 Média
- OWASP: A03:2021 — Injection
- CWE: CWE-79
- Local: `next.config.ts` (headers)
- Fonte: revisão manual

**Como explorar**
Se existir um vetor de XSS stored (ex: campo `notes` renderizado sem sanitização), o CSP com `unsafe-inline` não bloqueia execução do script injetado.

**Impacto**
A diretiva `script-src 'self' 'unsafe-inline'` permite que qualquer script inline seja executado, anulando grande parte da proteção que o CSP deveria fornecer contra XSS.

**Código vulnerável**
```typescript
// next.config.ts
`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`
```

**Fix**
```typescript
// Usar nonces para scripts inline (Next.js 15 suporta nativamente)
// next.config.ts — remover unsafe-inline e usar nonce
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`, // CSS inline ok (menor risco)
  // ...
].join("; ");
```

Nota: Next.js 15 com App Router exige `unsafe-inline` para scripts internos do framework se não usar o [middleware de nonce](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy). Avaliar viabilidade com a versão atual.

**Defesa em camadas**
1. Garantir que todos os campos user-input são escaped pelo React (já padrão)
2. Nunca usar `dangerouslySetInnerHTML` com dados do usuário
3. Adicionar `Trusted Types` quando o browser support amadurecer

---

### [VULN-008] Exposição parcial de informação no health endpoint

- Severidade: 🟢 Baixa
- OWASP: A01:2021 — Broken Access Control
- CWE: CWE-200
- Local: `src/app/api/health/route.ts`
- Fonte: revisão manual

**Como explorar**
```bash
curl https://app.example.com/api/health
# Sem auth: {"status":"ok","time":"..."}
# Com auth: {"status":"ok","time":"...","db":"connected"} ou 503 com detalhes
```

**Impacto**
Atacante pode verificar se o serviço está no ar e inferir estado do banco. Risco baixo, mas desnecessário expor sem auth.

**Fix**
Retornar apenas `200 OK` sem body para requests não autenticados, ou exigir auth para o endpoint completo.

---

### [VULN-009] Dependências com vulnerabilidades conhecidas (npm audit)

- Severidade: 🟢 Baixa
- OWASP: A06:2021 — Vulnerable and Outdated Components
- CWE: CWE-1395
- Local: `package-lock.json`
- Fonte: npm audit

**Detalhes**
8 vulnerabilidades moderadas encontradas:

| Pacote | CVE/Advisory | Descrição |
|--------|------|-----------|
| esbuild ≤0.24.2 | GHSA-67mh-4wv8-2f99 | Dev server permite requests de qualquer site |
| postcss <8.5.10 | GHSA-qx2v-qp2m-jg93 | XSS via `</style>` não-escaped no stringify |

**Impacto**
- **esbuild**: Afeta apenas dev server (não produção). Risco: se dev server exposto na rede, sites maliciosos podem ler arquivos.
- **postcss**: Bundled dentro do Next.js. Risco teórico de XSS se CSS gerado contiver input do usuário (improvável nesta app).

**Fix**
```bash
# postcss: aguardar update do Next.js (dependência interna)
# esbuild: via drizzle-kit (dev dependency) — atualizar quando disponível
# Para monitorar:
npm audit --production  # verificar apenas dependências de produção
```

**Defesa em camadas**
1. Não expor dev server na rede (apenas localhost)
2. Monitorar dependabot/renovate para patches

---

## Hardening recomendado

1. **Adicionar rate-limit por IP na busca global** (`/api/search`) — atualmente sem nenhum rate limit
2. **Implementar logout forçado** — campo `token_version` na tabela users, verificar no middleware
3. **Adicionar `Permissions-Policy: interest-cohort=()`** para bloquear FLoC/Topics API
4. **Configurar `SameSite=Strict`** no cookie de sessão (atualmente `Lax` — permite CSRF via GET com navegação top-level)
5. **Senha mínima 12 chars** — atualmente 8 chars é insuficiente para 2026
6. **Adicionar audit log para login/logout** — atualmente não registrado

## Gaps de tooling

| Ferramenta | Status | Impacto |
|-----------|--------|---------|
| gitleaks | Não instalada | Sem varredura automatizada de secrets em histórico git |
| semgrep | Não instalada | Sem SAST para padrões de vulnerabilidade em código |
| trivy | Não instalada | Sem scan de vulnerabilidades em containers/configs |
| DAST (ZAP/nuclei) | N/A | Sem teste dinâmico de endpoints em runtime |

Classes de bug sem cobertura automatizada: secrets em commits antigos, vulnerabilidades em configs Docker (não há Dockerfile), prototype pollution em dependências.

## Tabela consolidada

| ID | Título | Severidade | OWASP | Esforço |
|----|--------|-----------|-------|---------|
| VULN-001 | IDOR na busca global | 🔴 Crítica | API1:2023 | 30min |
| VULN-002 | Ownership não validado em deals | 🟠 Alta | API1:2023 | 20min |
| VULN-003 | Ownership não validado em vendas | 🟠 Alta | API1:2023 | 20min |
| VULN-004 | Ownership não validado em propostas | 🟠 Alta | API1:2023 | 20min |
| VULN-005 | JWT sem revogação | 🟡 Média | A07:2021 | 2h |
| VULN-006 | Rate limit bypassável (login) | 🟡 Média | A07:2021 | 1h |
| VULN-007 | unsafe-inline no CSP | 🟡 Média | A03:2021 | 4h |
| VULN-008 | Info exposure em /health | 🟢 Baixa | A01:2021 | 10min |
| VULN-009 | Deps vulneráveis (npm audit) | 🟢 Baixa | A06:2021 | Monitorar |

## Plano de ação

### 1. Imediato (24h) — Críticas
- [ ] VULN-001: Corrigir `/api/search` para filtrar por `representativeId`

### 2. Sprint (7d) — Altas
- [ ] VULN-002: Validar ownership de cliente em `createDealAction` e `updateDealAction`
- [ ] VULN-003: Validar ownership de cliente em `createSaleAction`
- [ ] VULN-004: Validar ownership de cliente em `createProposalAction` e `updateProposalAction`

### 3. Próximo sprint — Médias
- [ ] VULN-005: Implementar verificação de `user.active` no `requireScope()`
- [ ] VULN-006: Adicionar rate-limit por IP no login
- [ ] VULN-007: Avaliar viabilidade de nonces no CSP com Next.js 15

### 4. Backlog — Baixas + Hardening
- [ ] VULN-008: Restringir health endpoint
- [ ] VULN-009: Monitorar updates de Next.js e drizzle-kit
- [ ] Instalar gitleaks e semgrep no CI
- [ ] Aumentar senha mínima para 12 chars
- [ ] Audit log para login/logout

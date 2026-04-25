# IGA — Sistema de Gestao de Representantes

## Visao geral
Sistema web (PWA) para gestao de representantes comerciais. Controla clientes, propostas, vendas, comissoes e pipeline de negocios. Tema dark premium com cores vibrantes.

## Stack
- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **React**: 19 (useActionState, Compiler)
- **TypeScript**: 5.7+
- **CSS**: Tailwind v4 (CSS-first, sem tailwind.config)
- **ORM**: Drizzle ORM 0.45+ (SQLite local / Turso em prod)
- **Auth**: JWT HS256 via jose + bcrypt-ts (httpOnly cookie)
- **Animacoes**: Motion (Framer Motion) 12+
- **PDF**: jsPDF + jspdf-autotable (geracao de propostas)
- **Charts**: Recharts 3+
- **PWA**: Serwist (Service Worker)
- **Drag & Drop**: @dnd-kit

## Estrutura do projeto
```
src/
  app/
    (app)/           # Rotas protegidas (requerem auth)
      dashboard/     # KPIs, ranking, grafico receita
      clientes/      # CRUD clientes
      propostas/     # Propostas com itens + geracao PDF
      representantes/# CRUD reps (admin only)
      produtos/      # CRUD produtos (admin only)
      vendas/        # Registro de vendas + comissao automatica
      comissoes/     # Controle pagamento comissoes
      pipeline/      # Kanban de negocios (drag & drop)
      configuracoes/ # Senha, PWA install, gestao de usuarios
    api/             # CEP, CNPJ, exports CSV, health
    campo/           # Formulario mobile para campo
    login/           # Tela de login
  components/
    ui.tsx           # Biblioteca de componentes (Button, Input, Card, Table, Badge, etc.)
    sidebar.tsx      # Navegacao desktop + mobile tab bar
    topbar.tsx       # Barra superior
    motion.tsx       # Animacoes (FadeUp, StaggerContainer, HoverCard)
    stat-card.tsx    # Card de KPI com cores por tipo (emerald/amber/violet/cyan)
    command-palette.tsx # Busca global (Cmd+K)
  lib/
    actions/         # Server Actions (auth, customers, sales, proposals, etc.)
    db/
      index.ts       # Conexao Drizzle (libsql)
      schema.ts      # Schema completo (users, reps, customers, products, sales, commissions, deals, proposals, proposalItems)
    generate-proposal-pdf.ts # Gerador de PDF de proposta comercial
    auth.ts          # JWT, requireUser, requireAdmin, requireScope
    utils.ts         # brl(), dateShort(), masks (CEP, CNPJ, CPF, phone)
    rate-limit.ts    # Rate limiting para APIs
    env.ts           # Validacao de env vars
```

## Banco de dados
- **Dev**: SQLite local (`file:./data.db`)
- **Prod**: Turso (libsql remoto)
- Schema em `src/lib/db/schema.ts`
- Valores monetarios em **centavos** (integer)
- IDs: nanoid(16)

## Roles e permissoes
- `admin`: acesso total (representantes, produtos, gestao usuarios, todas vendas)
- `manager`: mesmas permissoes que admin
- `rep`: ve apenas seus proprios dados (clientes, vendas, comissoes, propostas)

## Deploy
- **Plataforma**: Vercel
- **Project ID**: prj_BBquUnSFJ3fjGOwomrBcSEUHpkV6
- **Org**: team_CKineqTPz03S69dUEjHuE8tK
- **Env vars obrigatorias em prod**: AUTH_SECRET, DATABASE_URL, DATABASE_AUTH_TOKEN
- **Env vars para seed**: ADMIN_PASSWORD, ADMIN_EMAIL, ADMIN_NAME

## Comandos
```bash
npm run dev          # Dev server
npm run build        # Build producao
npm run db:push      # Push schema para banco
npm run db:seed      # Seed com admin + reps
npm run db:studio    # Drizzle Studio (browser)
```

## Padroes de codigo
- Server Components por padrao, `"use client"` apenas quando necessario
- Server Actions em `src/lib/actions/` com validacao Zod
- CSS via classes Tailwind — cores via CSS custom properties em globals.css
- Componentes UI centralizados em `src/components/ui.tsx`
- Valores monetarios sempre em centavos, usar `brl()` para formatar
- Datas via `dateShort()` e `dateLong()` de utils.ts

## Tema visual
- Background: mesh gradient animado (`bg-mesh-live`)
- Cores por contexto: emerald (vendas), amber (comissoes pendentes), violet (comissoes pagas), cyan (clientes)
- Cards com glow colorido (`card-glow-emerald`, `card-glow-amber`, etc.)
- Sidebar com glow line (`sidebar-glow`)
- Animacoes respeitam `prefers-reduced-motion`

## Geracao de PDF
- Arquivo: `src/lib/generate-proposal-pdf.ts`
- Componente: `src/app/(app)/propostas/[id]/pdf-button.tsx`
- Usa logo de `/public/logo-iga.png`
- Layout: header dark com logo, dados cliente/rep, tabela de itens, resumo financeiro, area de assinatura, footer

## Seguranca
- CSP headers em `next.config.ts`
- httpOnly cookies para JWT
- Rate limiting em APIs externas
- Zod validation em todas as Server Actions
- RBAC enforced via `requireScope()` / `requireAdmin()`
- Senhas com bcrypt-ts (salt rounds padrao)

## Observacoes importantes
- NAO usar `any` — preferir `satisfies` ou tipos explicitos
- NAO editar globals.css para remover animacoes — elas sao parte do design
- Valores financeiros sao SEMPRE em centavos no banco/actions, convertidos com `brl()` na UI
- Propostas tem itens (proposalItems) com tipo (one_time, monthly, yearly)
- O pipeline usa drag & drop real com @dnd-kit

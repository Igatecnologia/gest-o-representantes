# SalesOps — Gestão de Representantes de Venda de Software

Rascunho funcional **para uso interno**. MVP com:

- Autenticação (email/senha + sessão em cookie JWT httpOnly)
- CRUD de **representantes**, **clientes** e **produtos**
- Registro de **vendas** com cálculo automático de **comissão**
- Controle de pagamento de comissão (pendente / paga)
- Dashboard com KPIs do mês e ranking de representantes

## Stack

- **Next.js 15** (App Router) + **React 19** (Server Actions, `useActionState`)
- **TypeScript** + **Zod**
- **Drizzle ORM** + **libSQL** (SQLite em arquivo local, sem build nativo — funciona no Windows sem dor)
- **Tailwind v4** (CSS-first, sem config)
- Auth minimalista com `jose` (JWT HS256) + `bcrypt-ts` (pure JS)

## Como rodar

Pré-requisitos: **Node.js 20+** e **pnpm** (ou npm).

```bash
# 1. Instalar dependências
pnpm install

# 2. Criar o banco (gera ./data.db)
pnpm db:push

# 3. Criar o usuário admin inicial
pnpm db:seed

# 4. Subir o dev server
pnpm dev
```

Abra http://localhost:3000 e faça login com:

- **E-mail:** `redacted@example.com`
- **Senha:** `REDACTED`

> Troque `AUTH_SECRET` em `.env.local` antes de usar fora da sua máquina.

## Fluxo para testar

1. **Representantes** → cadastre um rep com comissão (ex: 10%)
2. **Clientes** → cadastre um cliente (CNPJ opcional)
3. **Produtos** → cadastre um produto (ex: licença mensal R$ 299)
4. **Vendas** → registre uma venda (escolha rep + cliente + produto). A comissão é calculada automaticamente com base no % do representante.
5. **Comissões** → marque a comissão como paga quando for quitada no financeiro.
6. **Dashboard** → veja o total do mês, ranking e comissões pendentes.

## Estrutura

```
src/
├── app/
│   ├── (app)/             # rotas protegidas (layout com sidebar)
│   │   ├── dashboard/
│   │   ├── representantes/
│   │   ├── clientes/
│   │   ├── produtos/
│   │   ├── vendas/
│   │   └── comissoes/
│   ├── login/             # rota pública
│   ├── logout/
│   └── layout.tsx
├── components/
│   ├── sidebar.tsx
│   └── ui.tsx             # Button, Input, Card, Table, ...
├── lib/
│   ├── db/                # Drizzle schema + client
│   ├── actions/           # Server Actions por domínio
│   ├── auth.ts            # sessão JWT em cookie httpOnly
│   └── utils.ts
├── middleware.ts          # redirecionamento login/protegido
└── scripts/
    └── seed.ts            # admin inicial
```

## Próximos passos sugeridos

- Editar registros (hoje só criar/deletar)
- Metas por representante + barra de progresso no dashboard
- Regras de comissão avançadas (tabela progressiva, aceleradores)
- Geração de proposta PDF + assinatura digital (ClickSign/D4Sign)
- Exportação de comissão para CSV/folha
- Notificações (e-mail) de comissão aprovada / meta em risco
- Multi-usuário (cada rep loga e vê o próprio funil)

## Segurança mínima já aplicada

- Senha com **Argon2/bcrypt** (bcrypt-ts, 10 rounds)
- Sessão em **cookie httpOnly + SameSite=lax + Secure em produção**
- JWT HS256 com segredo em env
- Middleware protege todas as rotas exceto `/login`
- Validação com **Zod** em toda server action
- Drizzle = **queries parametrizadas nativamente** (sem SQL injection)

> Antes de expor em rede: trocar `AUTH_SECRET`, habilitar HTTPS, revisar CSP e adicionar rate limiting nos endpoints de login.

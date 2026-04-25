import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid(16));

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // admin | manager | rep
  role: text("role").notNull().default("rep"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const representatives = sqliteTable("representatives", {
  id: id(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  // comissão em percentual, ex: 10 = 10%
  commissionPct: real("commission_pct").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
}, (t) => [
  index("idx_reps_user").on(t.userId),
]);

export const customers = sqliteTable("customers", {
  id: id(),
  // Dono do cliente (null = pool geral, só admin)
  representativeId: text("representative_id").references(() => representatives.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  tradeName: text("trade_name"), // nome fantasia
  document: text("document"), // CNPJ/CPF
  email: text("email"),
  phone: text("phone"),
  // Endereço
  cep: text("cep"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  district: text("district"),
  city: text("city"),
  state: text("state"),
  // Metadata
  latitude: real("latitude"),
  longitude: real("longitude"),
  source: text("source").notNull().default("web"), // web | mobile_field | public_form
  notes: text("notes"),
  createdAt: createdAt(),
}, (t) => [
  index("idx_customers_rep").on(t.representativeId),
]);

export const products = sqliteTable("products", {
  id: id(),
  name: text("name").notNull(),
  sku: text("sku"),
  price: integer("price").notNull(), // centavos — mensalidade ou valor base
  implementationPrice: integer("implementation_price").notNull().default(0), // centavos — taxa de implantação
  // perpetual | subscription_monthly | subscription_yearly
  type: text("type").notNull().default("perpetual"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const sales = sqliteTable("sales", {
  id: id(),
  representativeId: text("representative_id")
    .notNull()
    .references(() => representatives.id, { onDelete: "restrict" }),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // centavos
  discount: integer("discount").notNull().default(0), // centavos, valor absoluto
  total: integer("total").notNull(), // centavos
  // pending | approved | cancelled
  status: text("status").notNull().default("approved"),
  notes: text("notes"),
  createdAt: createdAt(),
}, (t) => [
  index("idx_sales_rep").on(t.representativeId),
  index("idx_sales_customer").on(t.customerId),
  index("idx_sales_status").on(t.status),
  index("idx_sales_created").on(t.createdAt),
]);

export const commissions = sqliteTable("commissions", {
  id: id(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  representativeId: text("representative_id")
    .notNull()
    .references(() => representatives.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(), // centavos
  // pending | paid
  status: text("status").notNull().default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
}, (t) => [
  index("idx_commissions_sale").on(t.saleId),
  index("idx_commissions_rep").on(t.representativeId),
  index("idx_commissions_status").on(t.status),
]);

export const deals = sqliteTable("deals", {
  id: id(),
  title: text("title").notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  representativeId: text("representative_id")
    .notNull()
    .references(() => representatives.id, { onDelete: "restrict" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  value: integer("value").notNull().default(0), // centavos
  // stage: lead | qualified | proposal | negotiation | won | lost
  stage: text("stage").notNull().default("lead"),
  probability: integer("probability").notNull().default(20),
  expectedCloseDate: integer("expected_close_date", { mode: "timestamp_ms" }),
  notes: text("notes"),
  sortIndex: integer("sort_index").notNull().default(0),
  createdAt: createdAt(),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
}, (t) => [
  index("idx_deals_rep").on(t.representativeId),
  index("idx_deals_customer").on(t.customerId),
  index("idx_deals_stage").on(t.stage),
]);

export const proposals = sqliteTable("proposals", {
  id: id(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  representativeId: text("representative_id")
    .notNull()
    .references(() => representatives.id, { onDelete: "restrict" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  // draft | sent | accepted | rejected | expired
  status: text("status").notNull().default("draft"),
  validUntil: integer("valid_until", { mode: "timestamp_ms" }),
  notes: text("notes"),
  createdAt: createdAt(),
}, (t) => [
  index("idx_proposals_rep").on(t.representativeId),
  index("idx_proposals_customer").on(t.customerId),
  index("idx_proposals_status").on(t.status),
]);

export const proposalItems = sqliteTable("proposal_items", {
  id: id(),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // "Implantação", "Mensalidade", "Treinamento", etc.
  // one_time | monthly | yearly
  type: text("type").notNull().default("one_time"),
  defaultValue: integer("default_value").notNull(), // centavos — valor padrão do sistema
  value: integer("value").notNull(), // centavos — valor proposto (editável pelo rep)
  createdAt: createdAt(),
}, (t) => [
  index("idx_proposal_items_proposal").on(t.proposalId),
]);

export type User = typeof users.$inferSelect;
export type Representative = typeof representatives.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type ProposalItem = typeof proposalItems.$inferSelect;

export const DEAL_STAGES = [
  { id: "lead", label: "Lead", probability: 10 },
  { id: "qualified", label: "Qualificado", probability: 30 },
  { id: "proposal", label: "Proposta", probability: 60 },
  { id: "negotiation", label: "Negociação", probability: 80 },
  { id: "won", label: "Ganho", probability: 100 },
  { id: "lost", label: "Perdido", probability: 0 },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]["id"];

export const PROPOSAL_STATUSES = [
  { id: "draft", label: "Rascunho" },
  { id: "sent", label: "Enviada" },
  { id: "accepted", label: "Aceita" },
  { id: "rejected", label: "Recusada" },
  { id: "expired", label: "Expirada" },
] as const;

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]["id"];

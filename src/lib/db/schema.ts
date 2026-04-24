import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
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
});

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
});

export const products = sqliteTable("products", {
  id: id(),
  name: text("name").notNull(),
  sku: text("sku"),
  price: real("price").notNull(),
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
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0), // valor absoluto
  total: real("total").notNull(),
  // pending | approved | cancelled
  status: text("status").notNull().default("approved"),
  notes: text("notes"),
  createdAt: createdAt(),
});

export const commissions = sqliteTable("commissions", {
  id: id(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  representativeId: text("representative_id")
    .notNull()
    .references(() => representatives.id, { onDelete: "restrict" }),
  amount: real("amount").notNull(),
  // pending | paid
  status: text("status").notNull().default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

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
  value: real("value").notNull().default(0),
  // stage: lead | qualified | proposal | negotiation | won | lost
  stage: text("stage").notNull().default("lead"),
  probability: integer("probability").notNull().default(20),
  expectedCloseDate: integer("expected_close_date", { mode: "timestamp_ms" }),
  notes: text("notes"),
  sortIndex: integer("sort_index").notNull().default(0),
  createdAt: createdAt(),
  closedAt: integer("closed_at", { mode: "timestamp_ms" }),
});

export type User = typeof users.$inferSelect;
export type Representative = typeof representatives.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type Deal = typeof deals.$inferSelect;

export const DEAL_STAGES = [
  { id: "lead", label: "Lead", probability: 10 },
  { id: "qualified", label: "Qualificado", probability: 30 },
  { id: "proposal", label: "Proposta", probability: 60 },
  { id: "negotiation", label: "Negociação", probability: 80 },
  { id: "won", label: "Ganho", probability: 100 },
  { id: "lost", label: "Perdido", probability: 0 },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]["id"];

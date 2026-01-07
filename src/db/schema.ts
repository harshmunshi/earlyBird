import {
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    boolean,
    pgEnum,
    decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["owner", "member"]);
export const splitTypeEnum = pgEnum("split_type", ["equal", "exact", "percentage"]);
export const costStatusEnum = pgEnum("cost_status", ["tentative", "final"]);

// Users
export const users = pgTable("user", {
    id: text("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").notNull().unique(),
    password: text("password"),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parameters = pgTable("parameters", {
    id: uuid("id").defaultRandom().primaryKey(),
});

// Auth Tables (NextAuth)
export const accounts = pgTable("account", {
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
}, (account) => [
    // composite key? NextAuth usually needs specific primary key setup
    // Usually: primaryKey({ columns: [account.provider, account.providerAccountId] })
]);


export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
}, (verificationToken) => [
    // composite pk
]);

// Projects
export const projects = pgTable("project", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    currency: text("currency").default("USD").notNull(),
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    budget: decimal("budget", { precision: 12, scale: 2 }), // Total Project Budget
});

// Budget Allocations (Financial Planner)
export const budgetAllocations = pgTable("budget_allocation", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // Feature name or budget item
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    jiraTicketId: text("jira_ticket_id"), // Future integration
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Project Members
export const projectMembers = pgTable("project_member", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Costs
export const costs = pgTable("cost", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    paidBy: text("paid_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    date: timestamp("date").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(), // Could be an enum or table later
    billUrl: text("bill_url"),
    status: costStatusEnum("status").default("final").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cost Splits
export const costSplits = pgTable("cost_split", {
    id: uuid("id").defaultRandom().primaryKey(),
    costId: uuid("cost_id").notNull().references(() => costs.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    type: splitTypeEnum("type").default("equal").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    projects: many(projects), // Projects they own
    memberships: many(projectMembers),
    paidCosts: many(costs),
    splits: many(costSplits),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    owner: one(users, {
        fields: [projects.ownerId],
        references: [users.id],
    }),
    members: many(projectMembers),
    costs: many(costs),
    budgetAllocations: many(budgetAllocations),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, {
        fields: [projectMembers.projectId],
        references: [projects.id],
    }),
    user: one(users, {
        fields: [projectMembers.userId],
        references: [users.id],
    }),
}));

export const costsRelations = relations(costs, ({ one, many }) => ({
    project: one(projects, {
        fields: [costs.projectId],
        references: [projects.id],
    }),
    payer: one(users, {
        fields: [costs.paidBy],
        references: [users.id],
    }),
    splits: many(costSplits),
}));

export const costSplitsRelations = relations(costSplits, ({ one }) => ({
    cost: one(costs, {
        fields: [costSplits.costId],
        references: [costs.id],
    }),
    user: one(users, {
        fields: [costSplits.userId],
        references: [users.id],
    }),
}));

export const budgetAllocationsRelations = relations(budgetAllocations, ({ one }) => ({
    project: one(projects, {
        fields: [budgetAllocations.projectId],
        references: [projects.id],
    }),
}));

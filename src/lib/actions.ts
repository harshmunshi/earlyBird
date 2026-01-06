"use server";

import { auth, signIn } from "@/auth";
import { db } from "@/db";
import { projects, costs, users, projectMembers, costSplits, budgetAllocations } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    currency: z.string(),
});

const createCostSchema = z.object({
    description: z.string(),
    amount: z.number(),
    category: z.string(),
    date: z.string(),
    splitType: z.enum(["equal", "exact", "percentage"]),
    splits: z.array(z.object({
        userId: z.string(),
        amount: z.number()
    }))
});

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const createAllocationSchema = z.object({
    name: z.string().min(1),
    amount: z.coerce.number().min(0.01),
    jiraTicketId: z.string().optional()
});

const updateBudgetSchema = z.object({
    budget: z.coerce.number().min(0)
});

export async function updateProjectBudget(projectId: string, data: z.infer<typeof updateBudgetSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { budget } = updateBudgetSchema.parse(data);

    await db.update(projects)
        .set({ budget: budget.toString() })
        .where(eq(projects.id, projectId));

    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function createBudgetAllocation(projectId: string, data: z.infer<typeof createAllocationSchema>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { name, amount, jiraTicketId } = createAllocationSchema.parse(data);

    await db.insert(budgetAllocations).values({
        projectId,
        name,
        amount: amount.toString(),
        jiraTicketId
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function authenticate(data: z.infer<typeof loginSchema>) {
    try {
        const { email, password } = loginSchema.parse(data);
        await signIn('credentials', { email, password, redirect: false });
        // Manually redirect if successful since we set redirect: false to catch errors
        // Actually, signIn throws if successful redirect if we don't set redirect: false, 
        // but to handle errors locally in client we use redirect: false or try/catch.
        // Let's use redirect: false and manually redirect on client, 
        // wait, client components can't redirect easily.
        // Best practice with Server Actions: allow it to throw redirect, catch AuthError.
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return { error: 'Invalid credentials.' };
                default:
                    return { error: 'Something went wrong.' };
            }
        }
        // If it's a redirect error, rethrow it
        throw error;
    }
    redirect('/dashboard');
}

export async function registerUser(data: z.infer<typeof registerSchema>) {
    const { name, email, password } = registerSchema.parse(data);

    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (existingUser) {
        return { error: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
    });

    return { success: true };
}

export async function createProject(data: z.infer<typeof createProjectSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { name, description, currency } = createProjectSchema.parse(data);

    const [inserted] = await db.insert(projects).values({
        name,
        description,
        currency,
        ownerId: session.user.id,
    }).returning({ id: projects.id });

    // Add owner as a member
    await db.insert(projectMembers).values({
        projectId: inserted.id,
        userId: session.user.id,
        role: "owner"
    });

    revalidatePath("/dashboard");
    if (inserted?.id) {
        redirect(`/dashboard/projects/${inserted.id}`);
    } else {
        redirect("/dashboard");
    }
}

export async function createCost(projectId: string, data: z.infer<typeof createCostSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { description, amount, category, date, splitType, splits } = createCostSchema.parse(data);

    // 1. Create Cost
    const [insertedCost] = await db.insert(costs).values({
        projectId,
        paidBy: session.user.id,
        amount: amount.toString(), // Decimal
        date: new Date(date),
        description,
        category,
    }).returning({ id: costs.id });

    // 2. Create Splits
    let processedSplits = splits;
    if (splitType === "percentage") {
        processedSplits = splits.map(split => ({
            userId: split.userId,
            amount: (amount * (split.amount / 100))
        }));
    }

    if (processedSplits.length > 0) {
        await db.insert(costSplits).values(
            processedSplits.map(split => ({
                costId: insertedCost.id,
                userId: split.userId,
                amount: split.amount.toString(),
                type: splitType
            }))
        );
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function inviteMember(projectId: string, email: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.email, email)
    });

    if (!user) {
        return { success: false, error: "User not found. They must sign up first." };
    }

    const existingMember = await db.query.projectMembers.findFirst({
        where: and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.userId, user.id)
        )
    });

    if (existingMember) {
        return { success: false, error: "User is already a member" };
    }

    await db.insert(projectMembers).values({
        projectId,
        userId: user.id,
        role: "member"
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

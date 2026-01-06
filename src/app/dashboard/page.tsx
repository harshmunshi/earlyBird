import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, TrendingUp, DollarSign } from "lucide-react";
import { cn, getGradient } from "@/lib/utils";

// --- Stats Component ---
function DashboardStats({ userProjects }: { userProjects: any[] }) {
    // 1. Aggregate Stats
    const stats: Record<string, { total: number; breakdown: Record<string, number> }> = {};

    userProjects.forEach((proj) => {
        const currency = proj.currency || "USD";
        if (!stats[currency]) {
            stats[currency] = { total: 0, breakdown: {} };
        }

        proj.costs.forEach((cost: any) => {
            const amount = Number(cost.amount);
            stats[currency].total += amount;

            const category = cost.category || "Uncategorized";
            stats[currency].breakdown[category] = (stats[currency].breakdown[category] || 0) + amount;
        });
    });

    const currencies = Object.keys(stats);

    if (currencies.length === 0) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {currencies.map((currency) => (
                <div key={currency} className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Spent ({currency})</h3>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(stats[currency].total)}
                    </div>
                    {/* Mini Breakdown */}
                    <div className="mt-4 space-y-2">
                        {Object.entries(stats[currency].breakdown)
                            .sort(([, a], [, b]) => b - a) // Sort by amount desc
                            .slice(0, 3) // Top 3 categories
                            .map(([cat, amount]) => (
                                <div key={cat} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{cat}</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount)}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            ))}
        </div>
    );
}


export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const userProjects = await db.query.projects.findMany({
        where: eq(projects.ownerId, session.user.id),
        orderBy: [desc(projects.createdAt)],
        with: {
            costs: true
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1">Manage your startup costs.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/projects/new">
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Link>
                </Button>
            </div>

            {/* Global Stats Overview */}
            {userProjects.length > 0 && <DashboardStats userProjects={userProjects} />}

            {userProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed p-12 text-center bg-muted/10">
                    <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <FolderOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No projects created</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                        Create your first project to start tracking expenses and splitting costs with your team.
                    </p>
                    <div className="flex justify-center">
                        <Button asChild>
                            <Link href="/dashboard/projects/new">
                                <Plus className="mr-2 h-4 w-4" /> Create New Project
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {userProjects.map((project) => {
                        const totalCost = project.costs.reduce((acc, c) => acc + Number(c.amount), 0);
                        const gradient = getGradient(project.id);

                        return (
                            <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block group">
                                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-200 h-full flex flex-col justify-between relative overflow-hidden">
                                    {/* Colorful top border/accent */}
                                    <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity", gradient)} />

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-sm", gradient)}>
                                                {project.name.charAt(0)}
                                            </div>
                                            <span className={cn("text-xs font-medium px-2 py-1 rounded-full border bg-white/50 backdrop-blur-sm",
                                                project.currency === 'USD' ? 'text-green-600 border-green-200 bg-green-50' :
                                                    project.currency === 'EUR' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                                        'text-slate-600 border-slate-200 bg-slate-50'
                                            )}>
                                                {project.currency}
                                            </span>
                                        </div>
                                        <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">{project.name}</h2>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t flex items-center justify-between">
                                        <div className="text-sm text-muted-foreground">
                                            {project.costs.length} expenses
                                        </div>
                                        <div className="font-bold text-lg">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(totalCost)}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
}

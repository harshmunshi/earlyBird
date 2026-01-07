import { auth } from "@/auth";
import { db } from "@/db";
import { projects, costs, budgetAllocations } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Calendar, FileText, DollarSign, Wallet, ArrowUpRight, Check } from "lucide-react";
import { AddCostDialog } from "@/components/add-cost-dialog";
import { Button } from "@/components/ui/button";
import { InviteMemberDialog } from "@/components/invite-member-dialog";
import { ProjectStats } from "@/components/project-stats";
import { finalizeCost } from "@/lib/actions";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTab } from "@/components/planner-tab";
import { BudgetSettingsDialog } from "@/components/budget-settings-dialog";
import { cn } from "@/lib/utils";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    // ... auth ...
    const session = await auth();
    if (!session?.user?.id) return null;

    const { id } = await params;

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: {
            costs: {
                orderBy: [desc(costs.date)],
                with: {
                    payer: true
                }
            },
            members: {
                with: {
                    user: true
                }
            },
            budgetAllocations: {
                orderBy: [desc(budgetAllocations.createdAt)]
            }
        }
    });

    if (!project) return notFound();

    // ... calcs ...
    const finalCosts = project.costs.filter(c => c.status === "final");
    const totalCost = finalCosts.reduce((acc, c) => acc + Number(c.amount), 0);

    const memberList = project.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            image: m.user.image
        }
    }));

    const statsCosts = project.costs.map(c => ({
        id: c.id,
        amount: c.amount,
        date: new Date(c.date),
        category: c.category,
        status: c.status
    }));

    // Cast allocations
    const allocations = project.budgetAllocations.map(a => ({
        id: a.id,
        name: a.name,
        amount: Number(a.amount),
        jiraTicketId: a.jiraTicketId,
        createdAt: new Date(a.createdAt)
    }));

    const budget = Number(project.budget || 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors inline-flex items-center text-sm">
                        <ChevronLeft className="h-3 w-3 mr-1" /> Projects
                    </Link>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-sm font-medium text-foreground">{project.name}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {project.name}
                            <span className="text-sm font-mono font-normal text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded-md border border-border/50">{project.currency}</span>
                        </h1>
                        <p className="text-muted-foreground mt-1 max-w-2xl">{project.description || "No description provided."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BudgetSettingsDialog projectId={project.id} currentBudget={budget} />
                        <InviteMemberDialog projectId={project.id} />
                        <AddCostDialog projectId={project.id} members={memberList} />
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="planner">Financial Planner</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Existing View */}
                    {project.costs.length === 0 ? (
                        <div className="rounded-xl border border-dashed p-12 text-center bg-muted/10">
                            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">No expenses yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                                Start tracking your project costs by adding your first expense. You can split it with your team.
                            </p>
                            <div className="flex justify-center">
                                <AddCostDialog projectId={project.id} members={memberList} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Stats Section - Existing */}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(totalCost)}
                                    </div>
                                </div>
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Expenses</span>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-2xl font-bold">{project.costs.length}</div>
                                </div>
                                <div className="rounded-xl border bg-card p-6 shadow-sm">
                                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Members</span>
                                        <div className="flex -space-x-2">
                                            {memberList.slice(0, 3).map(m => (
                                                <div key={m.id} className="h-5 w-5 rounded-full ring-2 ring-background bg-secondary flex items-center justify-center text-[8px] font-bold">
                                                    {m.user.name?.charAt(0) || "U"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold">{memberList.length}</div>
                                </div>
                            </div>

                            <ProjectStats costs={statsCosts} currency={project.currency} />

                            <div className="grid gap-8 md:grid-cols-3">
                                {/* Main Feed */}
                                <div className="md:col-span-2 space-y-6">
                                    <h2 className="text-xl font-semibold tracking-tight">Recent Expenses</h2>
                                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                        {project.costs.map((cost) => (
                                            <div key={cost.id} className={cn(
                                                "group flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors",
                                                cost.status === "tentative" && "opacity-75 bg-muted/10 border-dashed"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-secondary/50 group-hover:bg-secondary flex items-center justify-center transition-colors">
                                                        <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium flex items-center gap-2">
                                                            {cost.description}
                                                            {cost.status === "tentative" && (
                                                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Tentative</span>
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{new Date(cost.date).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">{cost.category}</span>
                                                            <span>•</span>
                                                            <span>Paid by {cost.payer.name?.split(' ')[0]}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="font-semibold tabular-nums text-right">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: project.currency }).format(Number(cost.amount))}
                                                    </div>
                                                    {cost.status === "tentative" && (
                                                        <form action={async () => {
                                                            "use server";
                                                            await finalizeCost(cost.id, project.id);
                                                        }}>
                                                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                                                                <Check className="h-3 w-3 mr-1" /> Finalize
                                                            </Button>
                                                        </form>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <div className="rounded-xl border bg-card p-6 shadow-sm sticky top-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold">Team</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {memberList.map(member => (
                                                <div key={member.id} className="flex items-center gap-3">
                                                    {member.user.image ? (
                                                        <img src={member.user.image} alt={member.user.name || "User"} className="h-8 w-8 rounded-full" />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                            {member.user.name?.charAt(0) || "U"}
                                                        </div>
                                                    )}
                                                    <div className="text-sm">
                                                        <p className="font-medium">{member.user.name || member.user.email}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="planner">
                    <PlannerTab
                        projectId={project.id}
                        budget={budget}
                        allocations={allocations}
                        currency={project.currency}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

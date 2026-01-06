"use client";

import { AddAllocationDialog } from "./add-allocation-dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Allocation = {
    id: string;
    name: string;
    amount: number;
    jiraTicketId: string | null;
    createdAt: Date;
};

export function PlannerTab({
    projectId,
    budget,
    allocations,
    currency
}: {
    projectId: string;
    budget: number;
    allocations: Allocation[];
    currency: string;
}) {
    const totalAllocated = allocations.reduce((acc, curr) => acc + curr.amount, 0);
    const percentUsed = budget > 0 ? (totalAllocated / budget) * 100 : 0;
    const remaining = budget - totalAllocated;

    const format = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            {/* Header / Summary */}
            <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg">Budget Overview</h3>
                        <p className="text-sm text-muted-foreground">Manage your detailed spending plan.</p>
                    </div>
                    <AddAllocationDialog projectId={projectId} />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span>Allocated: {format(totalAllocated)}</span>
                        <span className={cn(remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
                            Budget: {format(budget)}
                        </span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-500", remaining < 0 ? "bg-destructive" : "bg-primary")}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                    </div>
                    {remaining < 0 && (
                        <p className="text-xs text-destructive font-bold text-center">
                            Over budget by {format(Math.abs(remaining))}
                        </p>
                    )}
                </div>
            </div>

            {/* Allocations List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allocations.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-semibold">{item.name}</h4>
                                {item.jiraTicketId && (
                                    <span className="inline-flex items-center rounded-sm bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        {item.jiraTicketId}
                                    </span>
                                )}
                            </div>
                            <div className="text-lg font-bold">{format(item.amount)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                            Added {item.createdAt.toLocaleDateString()}
                        </div>
                    </div>
                ))}
                {allocations.length === 0 && (
                    <div className="col-span-full border-dashed border-2 rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
                        <p>No budget items allocated yet.</p>
                        <p className="text-sm">Start by adding a line item.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { createBudgetAllocation } from "@/lib/actions";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
    name: z.string().min(1, "Name required"),
    amount: z.coerce.number().min(0.01, "Amount > 0"),
    jiraTicketId: z.string().optional()
});

export function AddAllocationDialog({ projectId }: { projectId: string }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            amount: 0,
            jiraTicketId: ""
        }
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await createBudgetAllocation(projectId, data);
            setOpen(false);
            reset();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" suppressHydrationWarning>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Budget Allocation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input id="name" placeholder="e.g. Q1 Infrastructure" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Allocated Amount</Label>
                        <Input id="amount" type="number" step="0.01" {...register("amount")} />
                        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message as string}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="jira">JIRA Ticket (Optional)</Label>
                        <Input id="jira" placeholder="PROJ-123" {...register("jiraTicketId")} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Allocation
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

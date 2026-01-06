"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Loader2 } from "lucide-react";
import { updateProjectBudget } from "@/lib/actions";

export function BudgetSettingsDialog({ projectId, currentBudget }: { projectId: string, currentBudget: number }) {
    const [open, setOpen] = useState(false);
    const [budget, setBudget] = useState(currentBudget);
    const [isLoading, setIsLoading] = useState(false);

    const onSave = async () => {
        setIsLoading(true);
        try {
            await updateProjectBudget(projectId, { budget });
            setOpen(false);
        } catch (error) {
            console.error("Failed to update budget", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Project Settings" suppressHydrationWarning>
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Project Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="budget">Total Project Budget</Label>
                        <Input
                            id="budget"
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
                            placeholder="10000.00"
                        />
                        <p className="text-sm text-muted-foreground">
                            Set a monetary cap for this project to track against.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

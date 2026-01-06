"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { createCost } from "@/lib/actions";
import { upload } from "@vercel/blob/client";

const schema = z.object({
    description: z.string().min(2, "Description required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    category: z.string().min(1, "Category required"),
    date: z.string(),
    billUrl: z.string().optional(),
    splitType: z.enum(["equal", "exact", "percentage"]),
    splits: z.array(z.object({
        userId: z.string(),
        amount: z.number() // For exact: amount, for percentage: percent
    }))
});

type FormData = z.infer<typeof schema>;

type Member = {
    id: string; // member id
    userId: string;
    role: "owner" | "member";
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    }
};

export function AddCostDialog({ projectId, members }: { projectId: string, members: Member[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues: {
            description: "",
            category: "Operational",
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            billUrl: "",
            splitType: "equal",
            splits: members.map(m => ({ userId: m.user.id, amount: 0 }))
        }
    });

    const splitType = watch("splitType");
    const totalAmount = watch("amount");

    // Sync splits when type or amount changes (simple logic for equal)
    useEffect(() => {
        if (splitType === "equal" && totalAmount > 0) {
            const share = Number((totalAmount / members.length).toFixed(2));
            const newSplits = members.map(m => ({ userId: m.user.id, amount: share }));
            // Adjust last for rounding errors
            const sum = newSplits.reduce((acc, s) => acc + s.amount, 0);
            if (sum !== totalAmount) {
                newSplits[newSplits.length - 1].amount += (totalAmount - sum);
            }
            setValue("splits", newSplits);
        }
    }, [splitType, totalAmount, members, setValue]);

    const onSubmit = async (data: any) => { // using any to bypass strict checks for now, safe enough
        setIsLoading(true);
        try {
            await createCost(projectId, { ...data, billUrl: blobUrl });
            setOpen(false);
            reset();
            setBlobUrl(null);
        } catch (error) {
            console.error(error);
            alert("Failed to add cost");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        setIsUploading(true);
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            setBlobUrl(newBlob.url);
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button suppressHydrationWarning>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Cost
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" placeholder="Lunch, Server costs, etc." {...register("description")} />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message as string}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register("amount")} />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message as string}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input id="date" type="date" {...register("date")} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Receipt (Optional)</Label>
                        <div className="flex items-center gap-2">
                            {blobUrl ? (
                                <div className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-md border w-full justify-between">
                                    <span className="truncate max-w-[200px] text-muted-foreground">Receipt uploaded</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => {
                                            setBlobUrl(null);
                                            if (inputFileRef.current) inputFileRef.current.value = '';
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 w-full">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => inputFileRef.current?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        {isUploading ? "Uploading..." : "Upload Receipt"}
                                    </Button>
                                    <input
                                        ref={inputFileRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                            {...register("category")}
                        >
                            <option value="Operational">Operational</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Software">Software</option>
                            <option value="Legal">Legal</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <Label>Split Expense</Label>
                            <select
                                className="h-8 rounded-md border text-xs px-2"
                                {...register("splitType")}
                            >
                                <option value="equal">Equally</option>
                                <option value="exact">Exact Amounts</option>
                                <option value="percentage">Percentages</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            {members.map((member, index) => (
                                <div key={member.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                            {member.user.name?.charAt(0) || "U"}
                                        </div>
                                        <span>{member.user.name || member.user.email}</span>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="hidden"
                                            value={member.user.id}
                                            {...register(`splits.${index}.userId`)}
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-8 text-right"
                                            disabled={splitType === "equal"}
                                            placeholder={splitType === "percentage" ? "%" : "0.00"}
                                            {...register(`splits.${index}.amount` as const)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Expense
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

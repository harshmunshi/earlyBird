"use client";

import { useMemo } from "react";
import {
    Bar,
    BarChart,
    Cell,
    Label,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Cost = {
    id: string;
    amount: string; // decimal string
    date: Date;
    category: string;
    status: "tentative" | "final";
};

type ProjectStatsProps = {
    costs: Cost[];
    currency: string;
};

export function ProjectStats({ costs, currency }: ProjectStatsProps) {
    const { categoryData, dailyData, summary } = useMemo(() => {
        const catMap = new Map<string, number>();
        const dayMap = new Map<string, { final: number, tentative: number }>();
        let total = 0;

        costs.forEach((cost) => {
            const amount = Number(cost.amount);

            // Only add final costs to total and categories for now to keep charts meaningful
            if (cost.status === "final") {
                total += amount;
                catMap.set(cost.category, (catMap.get(cost.category) || 0) + amount);
            }

            // Daily grouping including tentative
            const dayKey = new Date(cost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const current = dayMap.get(dayKey) || { final: 0, tentative: 0 };

            if (cost.status === "final") {
                current.final += amount;
            } else {
                current.tentative += amount;
            }
            dayMap.set(dayKey, current);
        });

        const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2)),
        })).sort((a, b) => b.value - a.value);

        // Daily data for stacked bar
        const dailyData = Array.from(dayMap.entries()).map(([date, values]) => ({
            date,
            final: Number(values.final.toFixed(2)),
            tentative: Number(values.tentative.toFixed(2)),
        })).slice(-7);

        const topCategory = categoryData.length > 0 ? categoryData[0].name : "N/A";
        const avgSpend = dailyData.length > 0 ? total / dailyData.length : 0;

        return { categoryData, dailyData, summary: { topCategory, avgSpend, total } };
    }, [costs]);

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

    if (costs.length === 0) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Spending Over Time (Last entries)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyData}>
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${currency === 'USD' ? '$' : ''}${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const final = payload.find(p => p.dataKey === "final")?.value || 0;
                                        const tentative = payload.find(p => p.dataKey === "tentative")?.value || 0;
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[120px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground font-medium">
                                                        {label}
                                                    </span>
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="text-[0.70rem] text-muted-foreground">Final:</span>
                                                            <span className="font-bold text-xs">
                                                                {Number(final).toFixed(2)} {currency}
                                                            </span>
                                                        </div>
                                                        {Number(tentative) > 0 && (
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-[0.70rem] text-primary/60">Tentative:</span>
                                                                <span className="font-bold text-xs text-primary/60">
                                                                    {Number(tentative).toFixed(2)} {currency}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="final" stackId="a" fill="currentColor" radius={[0, 0, 0, 0]} className="fill-primary" />
                            <Bar dataKey="tentative" stackId="a" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary/30" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Looking by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `${currency === 'USD' ? '$' : ''}${value}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {categoryData.slice(0, 4).map((cat, index) => (
                            <div key={cat.name} className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-muted-foreground ml-auto">{cat.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

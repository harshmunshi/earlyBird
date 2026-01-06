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
};

type ProjectStatsProps = {
    costs: Cost[];
    currency: string;
};

export function ProjectStats({ costs, currency }: ProjectStatsProps) {
    const { categoryData, dailyData, summary } = useMemo(() => {
        const catMap = new Map<string, number>();
        const dayMap = new Map<string, number>();
        let total = 0;

        costs.forEach((cost) => {
            const amount = Number(cost.amount);
            total += amount;

            // Category
            catMap.set(cost.category, (catMap.get(cost.category) || 0) + amount);

            // Daily (simple string key YYYY-MM-DD for grouping)
            const dayKey = new Date(cost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + amount);
        });

        const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({
            name,
            value: Number(value.toFixed(2)),
        })).sort((a, b) => b.value - a.value);

        // Take last 7 data points or appropriate range
        const dailyData = Array.from(dayMap.entries()).map(([date, amount]) => ({
            date,
            amount: Number(amount.toFixed(2)),
        })).slice(-7); // Just last 7 entries for now for cleaner chart

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
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            {label}
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {Number(payload[0].value).toFixed(2)} {currency}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="amount" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
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

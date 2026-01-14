"use client";

import { MessageSquare, Briefcase, Users, PieChart, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ChatSidebar() {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-background border rounded-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className={cn(
                "fixed lg:relative z-40 h-full w-64 flex-col bg-card/80 backdrop-blur-xl border-r transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="p-6 h-16 flex items-center border-b border-border/40">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        CrowdSearch
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-primary/10 text-primary rounded-lg transition-colors hover:bg-primary/20 font-medium text-sm">
                            <Plus className="h-4 w-4" />
                            New Analysis
                        </button>
                    </div>

                    <div className="space-y-1">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
                            Services
                        </h3>
                        <NavItem icon={Briefcase} label="For Business" active />
                        <NavItem icon={PieChart} label="For Sales" />
                        <NavItem icon={Users} label="For Recruiting" />
                    </div>

                    <div className="space-y-1">
                        <h3 className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2">
                            Recent History
                        </h3>
                        <HistoryItem label="Competitor Analysis: A-Corp" time="2h ago" />
                        <HistoryItem label="Meeting Summary: B-Client" time="5h ago" />
                        <HistoryItem label="Market Trends 2024" time="1d ago" />
                    </div>
                </div>

                <div className="p-4 border-t border-border/40">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-indigo-600" />
                        <div className="text-sm">
                            <p className="font-medium text-foreground">User Account</p>
                            <p className="text-xs text-muted-foreground">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function NavItem({ icon: Icon, label, active }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            active
                ? "bg-secondary text-foreground shadow-sm font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}>
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

function HistoryItem({ label, time }: { label: string, time: string }) {
    return (
        <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-colors group">
            <div className="truncate group-hover:text-foreground transition-colors">{label}</div>
            <div className="text-[10px] opacity-60">{time}</div>
        </button>
    );
}

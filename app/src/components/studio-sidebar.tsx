"use client";

import { motion } from "framer-motion";
import { MessageSquarePlus, X } from "lucide-react";
import { promptTemplates } from "@/lib/prompt-templates";
import { cn } from "@/lib/utils";

interface StudioSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPrompt: (prompt: string) => void;
}

export function StudioSidebar({ isOpen, onClose, onSelectPrompt }: StudioSidebarProps) {
    return (
        <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col border-l border-slate-200 bg-white h-full shrink-0 relative z-20 shadow-sm overflow-hidden"
        >
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <MessageSquarePlus className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-700">Studio</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {promptTemplates.map((category, idx) => (
                    <div key={idx} className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                            {category.category}
                        </h3>
                        <div className="space-y-2">
                            {category.prompts.map((prompt, pIdx) => (
                                <button
                                    key={pIdx}
                                    onClick={() => onSelectPrompt(prompt)}
                                    className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 hover:border-indigo-100 transition-all group"
                                >
                                    <p className="text-sm text-slate-700 leading-relaxed group-hover:text-indigo-700 transition-colors whitespace-pre-wrap">
                                        {prompt}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </motion.aside>
    );
}

"use client";

import { Send, Sparkles, Bot, FileText, LayoutGrid, ChevronRight, Menu, SquareTerminal, X, Paperclip, Share2, Copy, Check, Plus, Loader2, StickyNote, Pin, Settings, MessageSquarePlus, User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { PromptEditor } from "./prompt-editor";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { StudioSidebar } from "./studio-sidebar";
import { UserManagement } from "./user-management";
import { useRouter } from "next/navigation";

interface ChatInterfaceProps {
    mode?: 'admin' | 'customer';
}

interface Source {
    id: string;
    name: string;
    category: string;
    count: number;
}

interface Note {
    id: string;
    content: string;
    createdAt: Date;
}

export function ChatInterface({ mode = 'customer' }: ChatInterfaceProps) {
    const { t } = useLanguage();
    const router = useRouter();

    // Auth State
    const [user, setUser] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Fetch User
    useEffect(() => {
        if (mode === 'customer') {
            // In customer mode, force fetch of real user. 
            // Middleware should already protect this, but we double check.
            fetch('/api/auth/me')
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Unauthorized');
                })
                .then(data => {
                    // Use ACTUAL user data
                    setUser(data.user);
                    setIsAdmin(false); // Force admin features off for customer view, but keep identity
                })
                .catch(() => {
                    // If failed, redirect to login (No more Guest User)
                    router.push('/login');
                })
                .finally(() => {
                    setIsCheckingAuth(false);
                });
        } else {
            // Admin/Editor mode - strictly require auth
            fetch('/api/auth/me')
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Unauthorized');
                })
                .then(data => {
                    setUser(data.user);
                    setIsAdmin(data.user.role === 'admin' || data.user.role === 'editor');
                    setIsCheckingAuth(false);
                })
                .catch(() => {
                    router.push('/login');
                });
        }
    }, [router, mode]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'sources' | 'notes' | 'prompt'>('sources');
    const [settingsTab, setSettingsTab] = useState<'prompt' | 'users'>('prompt');

    // Sync sidebar state with admin/customer status once auth is checked
    // Sync sidebar state with admin/customer/viewer status once auth is checked
    useEffect(() => {
        if (!isCheckingAuth) {
            // Left Sidebar: Sources/Notes (Admin or Customer only)
            if (isAdmin || mode === 'customer') {
                setIsSidebarOpen(true);
            }
            // Right Sidebar: Studio (Admin, Customer, OR Viewer)
            if (isAdmin || user?.role === 'viewer' || mode === 'customer') {
                setIsStudioOpen(true);
            }
        }
    }, [isCheckingAuth, isAdmin, mode, user]);

    // Data State
    const [sources, setSources] = useState<Source[]>([]);
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
    const [notes, setNotes] = useState<Note[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [copied, setCopied] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch Sources on Mount (Admin & Customer)
    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const res = await fetch('/api/sources');
            const data = await res.json();
            if (data.sources) {
                setSources(data.sources);
                // Select all by default
                setSelectedSourceIds(new Set(data.sources.map((s: Source) => s.id)));
            }
        } catch (e) {
            console.error("Failed to fetch sources", e);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Share Link Logic
    const shareLink = typeof window !== 'undefined' ? window.location.origin + "/share/demo-view" : "";
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Chat Logic
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) throw new Error(response.statusText);

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) return;

            setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    const updatedMsg = { ...lastMsg, content: lastMsg.content + chunk };
                    return [...prev.slice(0, -1), updatedMsg];
                });
            }
        } catch (error: any) {
            console.error("Chat error:", error);
            setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${error.message} ` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // File Upload Logic
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await uploadFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                await fetchSources(); // Refresh list
            } else {
                alert("Upload failed");
            }
        } catch (e) {
            console.error(e);
            alert("Upload error");
        } finally {
            setIsUploading(false);
        }
    };

    // Drag and Drop
    const [isDragging, setIsDragging] = useState(false);
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isAdmin) setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isAdmin) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadFile(e.dataTransfer.files[0]);
        }
    };

    // Notes Logic
    const addToNotes = (content: string) => {
        const newNote = {
            id: Date.now().toString(),
            content,
            createdAt: new Date()
        };
        setNotes([newNote, ...notes]);
        setActiveTab('notes');
        setIsSidebarOpen(true);
    };

    if (!user || isCheckingAuth) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#f8f9fa]">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="flex h-full w-full bg-[#f8f9fa] text-slate-900 font-sans overflow-hidden"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-xl">
                    <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center animate-bounce">
                        <FileText className="h-16 w-16 text-blue-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">{t('sidebar.dropToAdd')}</h3>
                    </div>
                </div>
            )}

            {/* Sidebar (Sources & Notes) - Visible to Admin & Customer (Read-only sources) */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="hidden md:flex flex-col border-r border-slate-200 bg-white h-full shrink-0 relative z-20 shadow-sm transition-all"
                    >
                        {/* Sidebar Header with Tabs */}
                        <div className="h-16 flex items-center px-4 border-b border-slate-100 justify-between gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg flex-1">
                                <button
                                    onClick={() => setActiveTab('sources')}
                                    className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5", activeTab === 'sources' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" /> {t('sidebar.sources')}
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5", activeTab === 'notes' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                    >
                                        <StickyNote className="h-3.5 w-3.5" /> {t('sidebar.notes')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('prompt')}
                                    className={cn("flex-1 text-xs font-medium py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5", activeTab === 'prompt' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                                >
                                    <Settings className="h-3.5 w-3.5" /> {t('sidebar.prompt')}
                                </button>
                            </div>

                            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded-md text-slate-400">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'sources' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('sidebar.sourcesCount', { count: sources.length })}</h3>
                                        {isAdmin && (
                                            <label className="cursor-pointer p-1.5 hover:bg-slate-100 rounded-md text-blue-600 transition">
                                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt,.md,.xlsx" />
                                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            </label>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {sources.map((source, i) => (
                                            <div key={i} className="group flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer">
                                                <div className="flex items-center justify-center h-8 w-8 rounded bg-slate-100 text-slate-500 shrink-0">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 truncate">{source.name}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{source.category}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSourceIds.has(source.id)}
                                                    onChange={() => {
                                                        const newSet = new Set(selectedSourceIds);
                                                        if (newSet.has(source.id)) newSet.delete(source.id);
                                                        else newSet.add(source.id);
                                                        setSelectedSourceIds(newSet);
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : activeTab === 'notes' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('sidebar.notesCount', { count: notes.length })}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {notes.map((note) => (
                                            <div key={note.id} className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg shadow-sm relative group">
                                                <p className="text-sm text-slate-700 line-clamp-6 leading-relaxed font-serif">{note.content}</p>
                                                <div className="mt-2 text-[10px] text-slate-400 font-medium">
                                                    {note.createdAt.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))}
                                        {notes.length === 0 && (
                                            <div className="text-center py-10 px-4 border-2 border-dashed border-slate-100 rounded-xl">
                                                <Pin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">{t('sidebar.pinTip')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full">
                                    <PromptEditor isCustomer={mode === 'customer'} />
                                </div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center relative min-w-0 bg-[#f8f9fa]" >

                {/* Header */}
                <header className="w-full h-16 flex items-center justify-between px-4 md:px-8 bg-transparent z-10" >
                    <div className="flex items-center gap-3">
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-black/5 rounded-full transition">
                                <Menu className="h-5 w-5 text-slate-600" />
                            </button>
                        )}
                        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                            {isAdmin ? (
                                <>Notebook <span className="text-slate-300 font-light">|</span> CrowdSearch</>
                            ) : (
                                "CrowdSearch AI"
                            )}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />

                        {(isAdmin || user?.role === 'viewer' || mode === 'customer') && (
                            <button
                                onClick={() => setIsStudioOpen(!isStudioOpen)}
                                className={cn(
                                    "p-2 rounded-full transition-all flex items-center gap-2",
                                    isStudioOpen ? "bg-indigo-100 text-indigo-600" : "hover:bg-slate-100 text-slate-400"
                                )}
                                title="Toggle Studio"
                            >
                                <MessageSquarePlus className="h-5 w-5" />
                            </button>
                        )}

                        {isAdmin && (
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition shadow-sm"
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </button>
                        )}

                        <div className="flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-1 py-1">
                            <span className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{user.name}</span>
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold ring-2 ring-white uppercase">
                                {user.role ? user.role[0] : 'U'}
                            </div>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                                title="Settings"
                            >
                                <Settings className="h-5 w-5" />
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </header >

                {/* Messages Scroll Area */}
                <div className="flex-1 w-full max-w-4xl overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-32" >
                    {
                        messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center mt-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
                                    <div className="relative h-24 w-24 bg-white rounded-3xl shadow-xl flex items-center justify-center border border-white/50 backdrop-blur-sm">
                                        <Sparkles className="h-10 w-10 text-blue-600" />
                                    </div>
                                </div>

                                <div className="text-center space-y-3 max-w-lg">
                                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                                        {mode === 'admin' ? t('chat.adminGreeting') : t('chat.customerGreeting')}
                                    </h2>
                                    <p className="text-slate-500 leading-relaxed text-sm">
                                        {mode === 'admin'
                                            ? <span>{t('chat.adminSub', { count: sources.length })}</span>
                                            : t('chat.customerSub')
                                        }
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                                    {t('chat.suggestions').map((suggestion: string) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInput(suggestion)}
                                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm text-left text-slate-600 hover:text-blue-600"
                                        >
                                            <span className="flex items-center justify-between">
                                                {suggestion}
                                                <ChevronRight className="h-4 w-4 opacity-50" />
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={cn("flex w-full mb-6", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    <div className={cn("flex max-w-[85%] md:max-w-[75%] gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1", msg.role === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-200")}>
                                            {msg.role === "user" ? <div className="text-xs font-bold">U</div> : <Sparkles className="h-4 w-4 text-purple-600" />}
                                        </div>

                                        <div className="space-y-1 overflow-hidden relative group">
                                            <div className={cn("p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                                                msg.role === "user"
                                                    ? "bg-slate-900 text-white rounded-tr-none"
                                                    : "bg-white border border-slate-100 rounded-tl-none text-slate-700"
                                            )}>
                                                <div className="prose prose-slate prose-sm max-w-none break-words dark:prose-invert">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                            {/* Pin Action for Assistant messages */}
                                            {isAdmin && msg.role === 'assistant' && (
                                                <button
                                                    onClick={() => addToNotes(msg.content)}
                                                    className="absolute top-2 right-2 p-1.5 bg-white/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm border border-slate-100"
                                                    title="Save to Notes"
                                                >
                                                    <Pin className="h-3 w-3 text-slate-500 hover:text-yellow-500 transition-colors" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    }

                    {/* Thinking Indicator */}
                    <AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex gap-4 w-full"
                            >
                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                                    <Bot className="h-4 w-4 text-purple-600 animate-pulse" />
                                </div>
                                <div className="bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-3">
                                    <div className="flex gap-1.5 pt-1">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 bg-purple-500 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 bg-blue-500 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 bg-green-500 rounded-full" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 shimmer-text">
                                        {t('chat.analyzing')}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div >

                {/* Floating Input Bar */}
                <div className="absolute bottom-6 w-full max-w-3xl px-4 z-30" >
                    <div className="relative group bg-white rounded-full shadow-2xl shadow-slate-200/50 border border-slate-200 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400">
                        <div className="flex items-center p-2 pl-6 gap-3">
                            <textarea
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={t('chat.inputPlaceholder')}
                                disabled={isLoading}
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:outline-none text-slate-700 text-base placeholder:text-slate-400 py-3 resize-none max-h-32 overflow-y-auto"
                            />
                            <div className="flex items-center gap-1 pr-1">
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className={cn(
                                        "p-2.5 rounded-full transition-all duration-300 flex items-center justify-center",
                                        input.trim()
                                            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:scale-105"
                                            : "bg-slate-100 text-slate-300"
                                    )}
                                >
                                    {isLoading ? <SquareTerminal className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-3 font-medium tracking-wide">
                        {t('chat.poweredBy')}
                    </p>
                </div >
            </main >

            {/* Right Sidebar (Studio) - Admin & Customer & Viewer */}
            <AnimatePresence>
                {(isAdmin || user?.role === 'viewer' || mode === 'customer') && (
                    <StudioSidebar
                        isOpen={isStudioOpen}
                        onClose={() => setIsStudioOpen(false)}
                        onSelectPrompt={(prompt) => {
                            setInput(prompt);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Settings Modal (Global) */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-slate-500" />
                                        Settings
                                    </h3>
                                    {isAdmin && (
                                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                            <button
                                                onClick={() => setSettingsTab('prompt')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition ${settingsTab === 'prompt' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                Prompt config
                                            </button>
                                            <button
                                                onClick={() => setSettingsTab('users')}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition ${settingsTab === 'users' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                User Management
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {settingsTab === 'prompt' ? <PromptEditor isCustomer={mode === 'customer'} /> : <UserManagement />}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <AnimatePresence>
                {isShareModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-900">{t('sidebar.shareTitle')}</h3>
                                <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-slate-600 text-sm mb-6">
                                {t('sidebar.shareDesc')}
                            </p>

                            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6">
                                <div className="flex-1 text-sm text-slate-600 truncate font-mono">
                                    {shareLink}
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-slate-200 transition shrink-0"
                                >
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => window.open(shareLink, '_blank')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                                >
                                    {t('sidebar.openLink')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

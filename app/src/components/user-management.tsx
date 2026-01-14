"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, User as UserIcon, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface User {
    id: string;
    username: string;
    role: 'admin' | 'viewer' | 'editor';
    name: string;
    email?: string;
    password?: string;
}

export function UserManagement() {
    const { t } = useLanguage(); // assume we might need translations later
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New User State
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        email: "",
        name: "",
        role: "viewer" as const,
        authType: "credentials" as "credentials" | "google"
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (e) {
            console.error("Failed to fetch users", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUser.name) return;
        if (newUser.authType === 'credentials' && (!newUser.username || !newUser.password)) return;
        if (newUser.authType === 'google' && !newUser.email) return;

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                await fetchUsers();
                setIsAdding(false);
                setNewUser({ username: "", password: "", email: "", name: "", role: "viewer", authType: "credentials" });
            } else {
                alert("Failed to create user");
            }
        } catch (e) {
            alert("Error creating user");
        }
    };

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleDeleteUser = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation(); // Prevent row click
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const res = await fetch("/api/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                await fetchUsers();
            } else {
                alert("Failed to delete user");
            }
        } catch (e) {
            alert("Error deleting user");
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        User Management
                    </h2>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-bold"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isAdding && (
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-700">New User</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                placeholder="Full Name"
                                className="p-2 border rounded"
                                value={newUser.name}
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            />

                            <select
                                className="p-2 border rounded"
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                            >
                                <option value="viewer">Viewer (Customer)</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>

                            <input
                                placeholder="Email (Login ID)"
                                className="p-2 border rounded"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            />
                            <input
                                placeholder="Password"
                                type="password"
                                className="p-2 border rounded"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-slate-500">Cancel</button>
                            <button onClick={handleCreateUser} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
                        </div>
                    </div>
                )}

                <table className="w-full text-left">
                    <thead className="text-xs uppercase text-slate-400 font-bold border-b border-slate-100">
                        <tr>
                            <th className="pb-3 pl-4">Name</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Login ID / Email</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3 text-right pr-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(user => (
                            <tr
                                key={user.id}
                                className="group hover:bg-slate-50 transition cursor-pointer"
                                onClick={() => setSelectedUser(user)}
                            >
                                <td className="py-3 pl-4 font-medium text-slate-700">
                                    <div>{user.name}</div>
                                    <div className="text-[10px] text-slate-300 font-mono">{user.id}</div>
                                </td>
                                <td className="py-3 text-xs text-slate-400 font-medium">
                                    {user.email ? 'Google' : 'Credentials'}
                                </td>
                                <td className="py-3 text-slate-500 text-sm font-mono">
                                    {user.email || user.username}
                                </td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
                                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                                        {user.role}
                                    </span>
                                </td>
                                <td className="py-3 text-right pr-4">
                                    <button
                                        onClick={(e) => handleDeleteUser(e, user.id, user.name)}
                                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                        title="Delete user"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">User Details</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Name</label>
                                <p className="text-slate-800 font-medium">{selectedUser.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
                                    <p className="text-slate-700 capitalize">{selectedUser.role}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                                    <p className="text-slate-700">{selectedUser.email ? 'Google Account' : 'Credentials'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Login ID / Email</label>
                                <div className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-sm break-all">
                                    {selectedUser.email || selectedUser.username}
                                </div>
                            </div>


                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">System ID</label>
                                <p className="text-xs text-slate-400 font-mono mt-1">{selectedUser.id}</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

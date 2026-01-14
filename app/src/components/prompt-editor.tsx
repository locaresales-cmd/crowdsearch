'use client';

import { useState, useEffect } from 'react';
import { Settings, Info } from "lucide-react";
import { useLanguage } from '@/lib/i18n';

interface PromptEditorProps {
    isCustomer?: boolean;
}

export function PromptEditor({ isCustomer = false }: PromptEditorProps) {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState("");

    // Structured Company Profile State
    const [companyProfile, setCompanyProfile] = useState({
        name: "",
        description: "",
        services: "",
        pricing: "",
        target: "",
        strengths: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState<'default' | 'study' | 'custom'>('custom');
    const [length, setLength] = useState<'default' | 'long' | 'short'>('default');

    useEffect(() => {
        fetch('/api/config/prompt')
            .then(res => res.json())
            .then(data => {
                if (data.systemPrompt) {
                    setPrompt(data.systemPrompt);
                }
                if (data.companyProfile) {
                    setCompanyProfile(prev => ({ ...prev, ...data.companyProfile }));
                }
            })
            .catch(err => console.error("Failed to load prompt", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);

        // Generate formatted reference info for the AI
        const formattedReferenceInfo = `
【自社情報 (基準コンテキスト)】
■ 会社名: ${companyProfile.name}
■ 事業内容: ${companyProfile.description}
■ 主なサービス・製品: ${companyProfile.services}
■ 価格体系: ${companyProfile.pricing}
■ ターゲット顧客層: ${companyProfile.target}
■ 強み・特徴: ${companyProfile.strengths}
        `.trim();

        try {
            const res = await fetch('/api/config/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: prompt,
                    referenceInfo: formattedReferenceInfo,
                    companyProfile: companyProfile
                })
            });
            if (res.ok) {
                alert(t('prompt.success'));
            } else {
                alert(t('prompt.error'));
            }
        } catch (e) {
            console.error("Error saving prompt:", e);
            alert(t('prompt.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleProfileChange = (field: keyof typeof companyProfile, value: string) => {
        setCompanyProfile(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <div className="p-8 text-center text-slate-500 text-sm">Loading config...</div>;

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            {/* Header / Title */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    自社情報の登録 (比較基準)
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    競合分析の基準となる、貴社の情報を入力してください。
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
                {/* Structured Form */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            会社名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={companyProfile.name}
                            onChange={(e) => handleProfileChange('name', e.target.value)}
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            placeholder="例: 株式会社Saleshub"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            事業内容
                        </label>
                        <textarea
                            value={companyProfile.description}
                            onChange={(e) => handleProfileChange('description', e.target.value)}
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            placeholder="主な事業内容を記載してください"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            主なサービス・製品
                        </label>
                        <textarea
                            value={companyProfile.services}
                            onChange={(e) => handleProfileChange('services', e.target.value)}
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            placeholder="提供しているサービスや製品を記載してください"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            価格体系
                        </label>
                        <textarea
                            value={companyProfile.pricing}
                            onChange={(e) => handleProfileChange('pricing', e.target.value)}
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                            placeholder="料金プランや価格帯を記載してください"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                            ターゲット顧客層
                        </label>
                        <textarea
                            value={companyProfile.target}
                            onChange={(e) => handleProfileChange('target', e.target.value)}
                            className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all h-20 resize-none"
                            placeholder="主なターゲット顧客を記載してください"
                        />
                    </div>
                </div>

                {/* Advanced Settings (Collapsed by default or separate section) */}
                {!isCustomer && (
                    <div className="pt-6 border-t border-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Settings className="w-3 h-3" />
                            AI システムプロンプト設定 (上級者向け)
                        </h3>

                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'default', label: t('prompt.modeDefault') },
                                    { id: 'study', label: t('prompt.modeStudy') },
                                    { id: 'custom', label: t('prompt.modeCustom') },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id as any)}
                                        className={`
                                            px-4 py-1.5 rounded-full text-xs font-medium transition-all border
                                            ${mode === m.id
                                                ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            <div className={`
                                relative transition-all duration-300
                                ${mode === 'custom' ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}
                            `}>
                                <textarea
                                    className="w-full h-48 p-4 text-xs leading-relaxed border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all font-mono"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={t('prompt.customPlaceholder')}
                                    maxLength={10000}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`
                        px-8 py-2.5 rounded-lg text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all
                        ${saving
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'
                        }
                    `}
                >
                    {saving ? "保存中..." : "保存して適用"}
                </button>
            </div>
        </div>
    );
}


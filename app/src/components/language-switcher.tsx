'use client';

import { useLanguage } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors flex items-center gap-1"
            title="Switch Language"
        >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium uppercase">{language}</span>
        </button>
    );
}

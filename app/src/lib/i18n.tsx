'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, params?: Record<string, string | number>) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('ja');

    const t = (path: string, params?: Record<string, string | number>) => {
        const keys = path.split('.');
        let value: any = translations[language];

        for (const key of keys) {
            value = value?.[key];
            if (value === undefined) return path;
        }

        if (typeof value === 'string' && params) {
            Object.entries(params).forEach(([key, val]) => {
                value = value.replace(`{{${key}}}`, String(val));
            });
        }

        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

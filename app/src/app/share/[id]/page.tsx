import { ChatInterface } from "@/components/chat-interface";
import { LanguageProvider } from "@/lib/i18n";

export default function SharePage() {
    return (
        <LanguageProvider>
            <main className="flex h-screen bg-background text-foreground overflow-hidden">
                <ChatInterface mode="customer" />
            </main>
        </LanguageProvider>
    );
}

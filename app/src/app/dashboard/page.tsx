import { ChatInterface } from "@/components/chat-interface";
import { LanguageProvider } from "@/lib/i18n";

export default function DashboardPage() {
    return (
        <LanguageProvider>
            <main className="flex h-screen bg-background text-foreground overflow-hidden">
                <ChatInterface mode="admin" />
            </main>
        </LanguageProvider>
    );
}

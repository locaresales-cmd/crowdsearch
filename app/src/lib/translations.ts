export const translations = {
    ja: {
        sidebar: {
            sources: "ソース",
            notes: "メモ",
            prompt: "設定", // "Prompt" -> "Settings" context
            sourcesCount: "{{count}} ソース",
            notesCount: "{{count}} 保存済みメモ",
            dropToAdd: "ドロップしてナレッジベースに追加",
            pinTip: "AIの回答をピン留めしてここに保存できます。",
            openLink: "リンクを開く",
            shareTitle: "顧客と共有",
            shareDesc: "このリンクを共有すると、顧客はチャットインターフェースにアクセスできます。内部メモやソースリストは表示されません。",
        },
        chat: {
            adminGreeting: "おはようございます、エージェント。",
            customerGreeting: "どのようなお手伝いができますか？",
            adminSub: "ナレッジベースから {{count}} 件のドキュメントを分析しました。インサイトを発見する準備ができています。",
            customerSub: "CrowdSearchの提供サービスや営業資料について何でも聞いてください。",
            analyzing: "ソースを分析中...",
            inputPlaceholder: "詳しく質問してください... (Shift+Enterで改行)",
            poweredBy: "CROWDSEARCH AI | POWERED BY GEMINI 2.0 FLASH",
            suggestions: [
                "各社の料金体系を比較して",
                "評判の悪い企業の共通点は？",
                "営業代行の成功事例を教えて",
                "提案書の勝ちパターンを分析"
            ]
        },
        prompt: {
            title: "チャットを設定",
            desc: "ノートブックは、リサーチ、学習支援、多様な視点の提示、特定のスタイルやトーンでの会話など、さまざまな目的に合わせてカスタマイズできます。",
            modeTitle: "会話の目的、スタイル、役割の定義",
            modeDefault: "デフォルト",
            modeStudy: "学習ガイド",
            modeCustom: "カスタム",
            customPlaceholder: "ここにカスタムプロンプトを入力してください...",
            lengthTitle: "回答の長さを選択",
            lengthDefault: "デフォルト",
            lengthLong: "長め",
            lengthShort: "短め",
            save: "保存",
            saving: "保存中...",
            success: "設定を保存しました",
            error: "保存に失敗しました"
        }
    },
    en: {
        sidebar: {
            sources: "Sources",
            notes: "Notes",
            prompt: "Prompt",
            sourcesCount: "{{count}} Sources",
            notesCount: "{{count}} saved notes",
            dropToAdd: "Drop to add to Knowledge Base",
            pinTip: "Pin AI responses to save them here.",
            openLink: "Open Link",
            shareTitle: "Share with Customer",
            shareDesc: "Share this link to give customers restricted access to the chat interface. They won't see your internal notes or sources list.",
        },
        chat: {
            adminGreeting: "Good morning, Agent",
            customerGreeting: "How can I help you?",
            adminSub: "I've analyzed {{count}} documents from your knowledge base. Ready to uncover insights.",
            customerSub: "Ask me anything about CrowdSearch services and sales materials.",
            analyzing: "Analyzing sources...",
            inputPlaceholder: "Ask detailed questions... (Shift+Enter for new line)",
            poweredBy: "CROWDSEARCH AI | POWERED BY GEMINI 2.0 FLASH",
            suggestions: [
                "Compare pricing structures",
                "Common complaints about competitors?",
                "Tell me success stories",
                "Analyze winning proposal patterns"
            ]
        },
        prompt: {
            title: "Chat Settings",
            desc: "Notebooks can be customized for research, study aids, presenting diverse perspectives, specific conversation styles/tones, and more.",
            modeTitle: "Define purpose, style, and role",
            modeDefault: "Default",
            modeStudy: "Study Guide",
            modeCustom: "Custom",
            customPlaceholder: "Enter custom prompt here...",
            lengthTitle: "Select response length",
            lengthDefault: "Default",
            lengthLong: "Long",
            lengthShort: "Short",
            save: "Save",
            saving: "Saving...",
            success: "Settings saved",
            error: "Failed to save"
        }
    }
};

export type Language = 'ja' | 'en';

import { model, apiKey } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";
import { getContext } from "@/lib/context";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        if (!model) {
            return NextResponse.json(
                { error: "Gemini API Key not configured" },
                { status: 500 }
            );
        }

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];

        // RAG: Load Context
        const knowledge = await getContext();

        let baseSystemPrompt = `
You are CrowdSearch AI, a high - level strategic business consultant.
Your goal is to help the user(business owner) make decisions based on FACTS.

    RULES:
1. You have access to the user's internal data (provided below as "Context").
2. ALWAYS cite the specific document name(e.g., "From 'DORIRU文字起こし.pdf'...") when providing facts.
3. If the context does not contain the answer, admit it.Do not hallucinate.
4. Be concise, professional, and actionable.Use bullet points for clarity.
`;

        let referenceInfo = "";

        try {
            const promptPath = path.join(process.cwd(), 'src', 'data', 'prompt-config.json');
            if (fs.existsSync(promptPath)) {
                const data = JSON.parse(fs.readFileSync(promptPath, 'utf-8'));
                if (data.systemPrompt) {
                    baseSystemPrompt = data.systemPrompt;
                }
                if (data.referenceInfo) {
                    referenceInfo = data.referenceInfo;
                }
            }
        } catch (e) {
            console.error("Error loading system prompt config:", e);
        }

        const systemInstruction = `
${baseSystemPrompt}

    REFERENCE / OWN COMPANY INFO:
${referenceInfo}

    CONTEXT:
${knowledge.substring(0, 1000000)}
(End of Context)
`; // Limit to 1M chars just in case, though 2.0 handles more.

        const chat = model.startChat({
            history: messages.slice(0, -1).map((m: any) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
            })),
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
        });

        let result: any;
        let retryCount = 0;
        const maxRetries = 5;

        while (retryCount < maxRetries) {
            try {
                result = await chat.sendMessageStream(lastMessage.content);
                break;
            } catch (e: any) {
                if (e.message.includes("429") || e.response?.status === 429) {
                    let waitTime = 2000 * Math.pow(2, retryCount);

                    const match = e.message.match(/retry in (\d+(\.\d+)?)s/);
                    if (match && match[1]) {
                        waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 2000;
                    }

                    console.log(`Rate limited (429). Waiting ${waitTime}ms... (${retryCount + 1}/${maxRetries})`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, waitTime));

                    if (retryCount === maxRetries) {
                        // Graceful fallback instead of error
                        const fallbackStream = new ReadableStream({
                            start(controller) {
                                controller.enqueue(new TextEncoder().encode("⚠️ システムアクセス集中により、一時的に応答が制限されています。約60秒後に再度お試しください。(CrowdSearch AI Safe Mode)"));
                                controller.close();
                            }
                        });
                        return new NextResponse(fallbackStream);
                    }
                } else {
                    console.error("Non-retriable error:", e);
                    const fallbackStream = new ReadableStream({
                        start(controller) {
                            controller.enqueue(new TextEncoder().encode("申し訳ありません。現在システムのエラーにより応答できません。"));
                            controller.close();
                        }
                    });
                    return new NextResponse(fallbackStream);
                }
            }
        }

        const stream = new ReadableStream({
            async start(controller) {
                if (!result) return;
                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        if (chunkText) {
                            controller.enqueue(new TextEncoder().encode(chunkText));
                        }
                    }
                } catch (streamError) {
                    console.error("Stream reading error:", streamError);
                    controller.enqueue(new TextEncoder().encode("\n[通信が中断されました]"));
                }
                controller.close();
            },
        });

        return new NextResponse(stream);

    } catch (error: any) {
        console.error("Detailed API Error:", error);
        const fallbackStream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("システムエラーが発生しました。時間を置いて再度お試しください。"));
                controller.close();
            }
        });
        return new NextResponse(fallbackStream);
    }
}

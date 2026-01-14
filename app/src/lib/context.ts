import { prisma } from "@/lib/prisma";

export async function getContext(): Promise<string> {
    try {
        const documents = await prisma.document.findMany();

        // Format documents into a single context block
        const context = documents.map((doc: any, index: number) => {
            return `[Document ${index + 1}]
Source: ${doc.source}
Category: ${doc.category}
Content:
${doc.content}
-----------------------------------`;
        }).join("\n\n");

        return context;
    } catch (error) {
        console.error("Error reading knowledge base from DB:", error);
        return "";
    }
}

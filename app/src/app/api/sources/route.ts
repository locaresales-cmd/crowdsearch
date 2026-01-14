import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const documents = await prisma.document.findMany();

        const sources = documents.map((doc, index) => ({
            id: doc.id,
            name: doc.source,
            category: doc.category,
            count: doc.content.length,
        }));

        // De-duplicate sources if needed, but for now list all entries
        // Or group by category
        const categories = Array.from(new Set(sources.map((s) => s.category))).map((cat) => {
            return {
                name: cat,
                count: sources.filter((s) => s.category === cat).length,
                color: getColorForCategory(cat),
                files: sources.filter((s) => s.category === cat),
            };
        });

        return NextResponse.json({ categories, sources });
    } catch (error) {
        console.error("Error fetching sources:", error);
        return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
    }
}

function getColorForCategory(category: string): string {
    if (category.includes("資料")) return "bg-blue-500";
    if (category.includes("文字起こし")) return "bg-purple-500";
    if (category.includes("評価")) return "bg-green-500";
    return "bg-slate-500";
}

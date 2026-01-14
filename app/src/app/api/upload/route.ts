
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parsePDF, parseXLSX } from "@/lib/document-parser";
import { prisma } from "@/lib/prisma";

const UPLOADS_DIR = path.join(process.cwd(), "src/data/uploads");

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name;
        const uploadPath = path.join(UPLOADS_DIR, fileName);

        // Ensure upload dir exists
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        // Save file locally (optional but good for debugging/backup)
        fs.writeFileSync(uploadPath, buffer);

        // Parse content
        let content = "";
        const ext = path.extname(fileName).toLowerCase();

        if (ext === ".pdf") {
            content = await parsePDF(buffer);
        } else if (ext === ".xlsx" || ext === ".xls") {
            content = parseXLSX(buffer);
        } else if (ext === ".txt" || ext === ".md") {
            content = buffer.toString("utf-8");
        } else {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
        }

        // Add to knowledge base (Database)
        if (content && typeof content === 'string' && content.trim()) {
            const cleanContent = content.replace(/\n+/g, '\n').trim();

            await prisma.document.create({
                data: {
                    source: fileName,
                    category: "uploads",
                    content: cleanContent
                }
            });

            return NextResponse.json({ success: true, fileName });
        } else {
            return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

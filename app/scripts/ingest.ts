
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';

const require = createRequire(import.meta.url);

// -- Polyfill for pdfjs-dist / pdf-parse in Node.js --
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() { }
    };
}
if (typeof global.ReadableStream === 'undefined') {
    const { ReadableStream } = require('stream/web');
    (global as any).ReadableStream = ReadableStream;
}
// ----------------------------------------------------

const BASE_DIR = path.resolve('/Users/fujimotogakuto/Library/CloudStorage/GoogleDrive-manamana072554@gmail.com/マイドライブ/Crowdsearch');
const TARGET_DIRS = [
    '営業受け文字起こし',
    '営業代行会社資料',
    '営業評価シート'
];

const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'knowledge.jsonl');

async function ingestData() {
    console.log('🚀 Starting Data Ingestion (PDF & Excel)...');

    // -- Setup PDF Parser --
    let PDFParse: any;
    try {
        const mod = await import('pdf-parse');
        PDFParse = mod.PDFParse;
        if (!PDFParse) {
            const defaultExport = (mod as any).default;
            if (defaultExport && defaultExport.PDFParse) {
                PDFParse = defaultExport.PDFParse;
            }
        }
    } catch (e) {
        console.error("Failed to import pdf-parse:", e);
    }
    // ----------------------

    // Ensure output dir exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Clear existing file
    fs.writeFileSync(OUTPUT_FILE, '');

    let totalDocs = 0;

    for (const dirName of TARGET_DIRS) {
        const dirPath = path.join(BASE_DIR, dirName);
        if (!fs.existsSync(dirPath)) {
            console.warn(`⚠️ Directory not found: ${dirPath}`);
            continue;
        }

        const files = fs.readdirSync(dirPath);
        console.log(`📂 Processing ${dirName}: ${files.length} files found.`);

        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const ext = path.extname(file).toLowerCase();

            let cleanText = "";

            try {
                if (ext === '.pdf') {
                    if (typeof PDFParse !== 'function') continue;

                    const dataBuffer = fs.readFileSync(filePath);
                    const parser = new PDFParse({ data: dataBuffer });
                    const result = await parser.getText();
                    await parser.destroy();

                    cleanText = result.text.replace(/\s+/g, ' ').trim();
                    cleanText = cleanText.replace(/Page \(\d+\) Break/g, '');

                } else if (ext === '.xlsx') {
                    const workbook = XLSX.readFile(filePath);
                    let combinedText = "";
                    workbook.SheetNames.forEach(sheetName => {
                        const sheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        json.forEach((row: any) => {
                            const rowText = row.filter((cell: any) => cell !== null && cell !== undefined).join(" ").trim();
                            if (rowText) combinedText += rowText + " ";
                        });
                    });
                    cleanText = combinedText.replace(/\s+/g, ' ').trim();
                }

                // Save if valid content
                if (cleanText.length > 50) {
                    const doc = {
                        source: file,
                        category: dirName,
                        content: cleanText
                    };
                    fs.appendFileSync(OUTPUT_FILE, JSON.stringify(doc) + '\n');
                    totalDocs++;
                    console.log(`  ✅ Indexed: ${file} (${cleanText.length} chars) [${ext}]`);
                } else {
                    if (ext === '.pdf' || ext === '.xlsx') {
                        console.log(`  ⚠️ Skipped (Empty or too short): ${file}`);
                    }
                }

            } catch (error) {
                console.error(`  ❌ Failed to parse ${file}:`, error);
            }
        }
    }

    console.log(`\n🎉 Ingestion Complete! Saved to ${OUTPUT_FILE}`);
    console.log(`Total Documents: ${totalDocs}`);
}

ingestData().catch(console.error);

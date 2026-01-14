
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { parsePDF, parseXLSX } from '../lib/document-parser';
import { prisma } from '../lib/prisma'; // Assumes correct path resolution

dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env


const DEFAULT_DATA_DIRS = [
    { name: '営業代行会社資料', path: '../営業代行会社資料', category: 'material' },
    { name: '営業受け文字起こし', path: '../営業受け文字起こし', category: 'transcript' },
    { name: '営業評価シート', path: '../営業評価シート', category: 'evaluation' }
];

let DATA_DIRS = DEFAULT_DATA_DIRS;

try {
    if (process.env.INGEST_SOURCES) {
        DATA_DIRS = JSON.parse(process.env.INGEST_SOURCES);
        console.log('Loaded ingestion configuration from environment variables.');
    }
} catch (e) {
    console.warn('Failed to parse INGEST_SOURCES from environment, using default configuration.', e);
}


async function ingest() {
    console.log("Starting ingestion...");

    let count = 0;

    for (const dir of DATA_DIRS) {
        const absoluteDirPath = path.resolve(process.cwd(), dir.path);

        if (!fs.existsSync(absoluteDirPath)) {
            console.warn(`Directory not found: ${absoluteDirPath}`);
            continue;
        }

        const files = fs.readdirSync(absoluteDirPath);

        for (const file of files) {
            // Ignore dotfiles and hidden files
            if (file.startsWith('.')) continue;

            const filePath = path.join(absoluteDirPath, file);
            const ext = path.extname(file).toLowerCase();
            let content: string = "";

            try {
                if (ext === '.pdf') {
                    const buffer = fs.readFileSync(filePath);
                    content = await parsePDF(buffer);
                } else if (ext === '.xlsx' || ext === '.xls') {
                    const buffer = fs.readFileSync(filePath);
                    content = parseXLSX(buffer);
                } else if (ext === '.txt' || ext === '.md') {
                    content = fs.readFileSync(filePath, 'utf-8');
                } else {
                    continue; // Skip unsupported extensions
                }

                // Safeguard against non-string content
                if (content && typeof content !== 'string') {
                    try {
                        // @ts-ignore
                        content = content.text || String(content);
                    } catch (e) { content = ""; }
                }

                if (typeof content === 'string' && content.trim()) {
                    const cleanContent = content.replace(/\n+/g, '\n').trim();

                    // Upsert into DB
                    await prisma.document.upsert({
                        where: {
                            source_category: {
                                source: file,
                                category: dir.name
                            }
                        },
                        update: {
                            content: cleanContent,
                            updatedAt: new Date()
                        },
                        create: {
                            source: file,
                            category: dir.name,
                            content: cleanContent
                        }
                    });

                    count++;
                    console.log(`Ingested: ${file} (${dir.name})`);
                }
            } catch (e) {
                console.error(`Error processing ${file}:`, e);
            }
        }
    }

    console.log(`Ingestion complete. Upserted ${count} documents into database.`);
}

ingest().catch(console.error);

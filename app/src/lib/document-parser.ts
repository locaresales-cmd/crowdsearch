import fs from 'fs';
import * as XLSX from 'xlsx';

// Minimal polyfills for Node.js environment
if (typeof Promise.withResolvers === 'undefined') {
    // @ts-ignore
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}
if (typeof global.DOMMatrix === 'undefined') {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {
        constructor() { }
    };
}

// Load PDFParse
let PDFParse: any;
try {
    const pdfLib = require('pdf-parse');
    PDFParse = pdfLib.PDFParse || pdfLib;
} catch (e) {
    console.error("Failed to load pdf-parse:", e);
}

export async function parsePDF(buffer: Buffer | Uint8Array): Promise<string> {
    // Ensure we have a Uint8Array, copying the buffer content if necessary
    const dataBuffer = new Uint8Array(buffer);
    try {
        if (!PDFParse) return "";

        // Based on previous debugging, PDFParse might need to be called as a function or class
        // but the error "Class constructors cannot be invoked without 'new'" suggests it IS a class
        // and we might be falling into the wrong branch or the import is slightly different in this context.

        let result: any = "";
        try {
            // @ts-ignore
            result = await new PDFParse(dataBuffer).getText();
        } catch (e: any) {
            // @ts-ignore
            if (typeof PDFParse === 'function') {
                try {
                    result = await PDFParse(dataBuffer);
                } catch (e2) {
                    throw e; // Throw original error if fallback fails
                }
            } else {
                throw e;
            }
        }

        // Ensure string result
        if (typeof result === 'string') return result;
        if (result && typeof result.text === 'string') return result.text;
        if (result) return String(result);
        return "";
    } catch (e: any) {
        console.error(`Error parsing PDF:`, e.message);
        return "";
    }
}

export function parseXLSX(buffer: Buffer): string {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += `Sheet: ${sheetName}\n`;
            text += XLSX.utils.sheet_to_csv(sheet);
            text += "\n";
        });
        return text;
    } catch (e) {
        console.error(`Error parsing XLSX:`, e);
        return "";
    }
}

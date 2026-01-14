import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROMPT_CONFIG_PATH = path.join(process.cwd(), "src", "data", "prompt-config.json");

function getPromptConfig() {
    try {
        if (!fs.existsSync(PROMPT_CONFIG_PATH)) {
            return null;
        }
        const data = fs.readFileSync(PROMPT_CONFIG_PATH, "utf-8");
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading prompt config:", e);
        return null;
    }
}

export async function GET() {
    const config = getPromptConfig();
    if (!config) {
        // Return default if file doesn't exist (though we created it)
        return NextResponse.json({ systemPrompt: "", referenceInfo: "", companyProfile: {} });
    }
    return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
    try {
        const { systemPrompt, referenceInfo, companyProfile } = await req.json();

        if (typeof systemPrompt !== "string") {
            return NextResponse.json({ error: "Invalid prompt format" }, { status: 400 });
        }

        // Ensure directory exists
        const dir = path.dirname(PROMPT_CONFIG_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const config = {
            systemPrompt,
            referenceInfo: typeof referenceInfo === 'string' ? referenceInfo : "",
            companyProfile: companyProfile || {}
        };

        fs.writeFileSync(PROMPT_CONFIG_PATH, JSON.stringify(config, null, 2));

        return NextResponse.json({ success: true, ...config });
    } catch (e) {
        console.error("Error saving prompt config:", e);
        return NextResponse.json({ error: "Failed to save prompt" }, { status: 500 });
    }
}

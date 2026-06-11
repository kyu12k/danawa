import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type HistoryItem = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const { prompt, history = [] }: { prompt: string; history: HistoryItem[] } = await req.json();
  if (!prompt) return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 });

  const results = await Promise.allSettled([
    callGemini(prompt, history),
    callOpenAI(prompt, history),
    callClaude(prompt, history),
  ]);

  return NextResponse.json({
    gemini: extract(results[0]),
    openai: extract(results[1]),
    claude: extract(results[2]),
  });
}

function extract(result: PromiseSettledResult<string>) {
  if (result.status === "fulfilled") return { text: result.value, error: null };
  return { text: null, error: String(result.reason) };
}

async function callGemini(prompt: string, history: HistoryItem[]): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const chat = model.startChat({
    history: history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
  });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

async function callOpenAI(prompt: string, history: HistoryItem[]): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ],
  });
  return completion.choices[0].message.content ?? "";
}

async function callClaude(prompt: string, history: HistoryItem[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

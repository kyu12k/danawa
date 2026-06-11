import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt) return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 });

  const results = await Promise.allSettled([
    callGemini(prompt),
    callGroq(prompt),
    callOpenAI(prompt),
    callClaude(prompt),
  ]);

  return NextResponse.json({
    gemini: extract(results[0]),
    groq: extract(results[1]),
    openai: extract(results[2]),
    claude: extract(results[3]),
  });
}

function extract(result: PromiseSettledResult<string>) {
  if (result.status === "fulfilled") return { text: result.value, error: null };
  return { text: null, error: String(result.reason) };
}

async function callGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function callGroq(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content ?? "";
}

async function callOpenAI(prompt: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });
  return completion.choices[0].message.content ?? "";
}

async function callClaude(prompt: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

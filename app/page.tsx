"use client";

import { useState } from "react";

const MODELS = [
  { key: "gemini", name: "Gemini 2.0 Flash", color: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
  { key: "groq", name: "Llama 3.3 (Groq)", color: "border-orange-400", badge: "bg-orange-100 text-orange-700" },
  { key: "openai", name: "GPT-4o mini", color: "border-green-400", badge: "bg-green-100 text-green-700" },
  { key: "claude", name: "Claude Haiku", color: "border-purple-400", badge: "bg-purple-100 text-purple-700" },
];

type Results = Record<string, { text: string | null; error: string | null }>;

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">다나와</h1>
        <p className="text-gray-500 mb-8">하나의 프롬프트, 네 개의 AI 답변</p>

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <textarea
            className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-base"
            rows={4}
            placeholder="예: '가을 단풍을 소재로 라디오 오프닝 대본을 써줘.'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">Ctrl+Enter로도 전송 가능</span>
            <button
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              {loading ? "생성 중..." : "전송"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODELS.map((m) => (
              <div key={m.key} className={`bg-white rounded-2xl shadow border-t-4 ${m.color} p-6`}>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.badge}`}>{m.name}</span>
                <div className="mt-4 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODELS.map((m) => {
              const r = results[m.key];
              return (
                <div key={m.key} className={`bg-white rounded-2xl shadow border-t-4 ${m.color} p-6`}>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.badge}`}>{m.name}</span>
                  {r?.error ? (
                    <p className="mt-4 text-red-400 text-sm">{r.error}</p>
                  ) : (
                    <p className="mt-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{r?.text}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

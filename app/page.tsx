"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { popResumeSession, saveSession } from "@/lib/storage";

const MODELS = [
  { key: "gemini", name: "Gemini 2.5 Flash", color: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
  { key: "openai", name: "GPT-4o", color: "border-green-400", badge: "bg-green-100 text-green-700" },
  { key: "claude", name: "Claude Sonnet", color: "border-purple-400", badge: "bg-purple-100 text-purple-700" },
];

type Results = Record<string, { text: string | null; error: string | null }>;
type HistoryItem = { role: "user" | "assistant"; content: string };
type Round = { prompt: string; results: Results; selectedKey: string };

export default function Home() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [currentResults, setCurrentResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  useEffect(() => {
    const session = popResumeSession();
    if (!session) return;
    const loadedRounds: Round[] = [];
    const loadedHistory: HistoryItem[] = [];
    for (const ex of session.exchanges) {
      const results: Results = {
        gemini: { text: null, error: null },
        openai: { text: null, error: null },
        claude: { text: null, error: null },
      };
      results[ex.selectedModel] = { text: ex.selectedText, error: null };
      loadedRounds.push({ prompt: ex.prompt, results, selectedKey: ex.selectedModel });
      loadedHistory.push({ role: "user", content: ex.prompt });
      loadedHistory.push({ role: "assistant", content: ex.selectedText });
    }
    setRounds(loadedRounds);
    setHistory(loadedHistory);
  }, []);

  function handleSave() {
    const exchanges = rounds.map((r) => ({
      prompt: r.prompt,
      selectedModel: r.selectedKey,
      selectedText: r.results[r.selectedKey]?.text ?? "",
    }));
    saveSession(exchanges);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSubmit() {
    if (!prompt.trim()) return;
    const submitted = prompt;
    setPrompt("");
    setPendingPrompt(submitted);
    setLoading(true);
    setCurrentResults(null);
    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: submitted, history }),
      });
      const data = await res.json();
      setCurrentResults(data);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(key: string) {
    if (!currentResults) return;
    const selectedText = currentResults[key]?.text ?? "";
    setRounds((prev) => [...prev, { prompt: pendingPrompt, results: currentResults, selectedKey: key }]);
    setHistory((prev) => [
      ...prev,
      { role: "user", content: pendingPrompt },
      { role: "assistant", content: selectedText },
    ]);
    setCurrentResults(null);
    setPendingPrompt("");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">다나와</h1>
            <p className="text-gray-500">하나의 프롬프트, 세 개의 AI 답변</p>
          </div>
          <div className="flex gap-2 items-center">
            {rounds.length > 0 && (
              <>
                <button
                  onClick={handleSave}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                    saved
                      ? "bg-green-100 text-green-600"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {saved ? "저장됨 ✓" : "저장하기"}
                </button>
                <button
                  onClick={() => {
                    setRounds([]);
                    setHistory([]);
                    setCurrentResults(null);
                    setPendingPrompt("");
                    setPrompt("");
                    setSaved(false);
                  }}
                  className="text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  새 대화
                </button>
              </>
            )}
            <Link
              href="/library"
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              라이브러리
            </Link>
          </div>
        </div>

        {/* 이전 라운드 */}
        {rounds.map((round, i) => (
          <div key={i} className="mb-8">
            <div className="flex justify-end mb-4">
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 max-w-2xl text-sm">
                {round.prompt}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map((m) => {
                const r = round.results[m.key];
                const isSelected = round.selectedKey === m.key;
                return (
                  <div
                    key={m.key}
                    className={`bg-white rounded-2xl shadow border-t-4 ${m.color} p-4 transition-opacity ${
                      isSelected ? "opacity-100 ring-2 ring-blue-400" : "opacity-30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.badge}`}>{m.name}</span>
                        {isSelected && <span className="text-xs text-blue-500 font-semibold">✓ 선택됨</span>}
                      </div>
                      {r?.text && (
                        <button
                          onClick={() => handleCopy(r.text!, `past-${i}-${m.key}`)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                        >
                          {copied === `past-${i}-${m.key}` ? "복사됨 ✓" : "복사"}
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {r?.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 로딩 */}
        {loading && (
          <div className="mb-8">
            <div className="flex justify-end mb-4">
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 max-w-2xl text-sm">
                {pendingPrompt}
              </div>
            </div>
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
          </div>
        )}

        {/* 현재 결과 - 선택 대기 */}
        {currentResults && !loading && (
          <div className="mb-8">
            <div className="flex justify-end mb-4">
              <div className="bg-blue-500 text-white rounded-2xl px-4 py-3 max-w-2xl text-sm">
                {pendingPrompt}
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mb-4">
              마음에 드는 답변을 선택해서 대화를 이어가세요
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODELS.map((m) => {
                const r = currentResults[m.key];
                return (
                  <div key={m.key} className={`bg-white rounded-2xl shadow border-t-4 ${m.color} p-6`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${m.badge}`}>{m.name}</span>
                      {r?.text && (
                        <button
                          onClick={() => handleCopy(r.text!, `cur-${m.key}`)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {copied === `cur-${m.key}` ? "복사됨 ✓" : "복사"}
                        </button>
                      )}
                    </div>
                    {r?.error ? (
                      <p className="mt-4 text-red-400 text-sm">{r.error}</p>
                    ) : (
                      <p className="mt-4 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{r?.text}</p>
                    )}
                    {!r?.error && (
                      <button
                        onClick={() => handleSelect(m.key)}
                        className="mt-4 w-full py-2 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        이 답변으로 이어가기
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 입력창 - 선택 대기 중이 아닐 때만 표시 */}
        {!currentResults && !loading && (
          <div className="bg-white rounded-2xl shadow p-6">
            <textarea
              className="w-full border border-gray-200 rounded-xl p-4 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-base"
              rows={4}
              placeholder={
                rounds.length === 0
                  ? "예: '가을 단풍을 소재로 라디오 오프닝 대본을 써줘.'"
                  : "이어서 질문하세요..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              autoFocus
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-400">Ctrl+Enter로도 전송 가능</span>
              <button
                onClick={handleSubmit}
                disabled={loading || !prompt.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

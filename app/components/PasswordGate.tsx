"use client";

import { useEffect, useState } from "react";

const PASSWORD = "dbswlghks";
const AUTH_VERSION = "v1"; // 새 업데이트 시 v2, v3... 으로 올리면 전원 재인증

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("danawa_auth");
    if (stored === AUTH_VERSION) setUnlocked(true);
    setReady(true);
  }, []);

  function handleSubmit() {
    if (input === PASSWORD) {
      localStorage.setItem("danawa_auth", AUTH_VERSION);
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 1500);
    }
  }

  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">다나와</h1>
        <p className="text-gray-400 text-sm mb-6">비밀번호를 입력해주세요.</p>
        <input
          type="password"
          className={`w-full border rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 transition-colors ${
            error
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-blue-300"
          }`}
          placeholder="비밀번호"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mt-2">비밀번호가 틀렸어요.</p>}
        <button
          onClick={handleSubmit}
          disabled={!input}
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          입장
        </button>
      </div>
    </div>
  );
}

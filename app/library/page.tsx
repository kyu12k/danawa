"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteSession,
  exportSessions,
  getProfile,
  getSessions,
  importSessions,
  Session,
  setProfile,
  setResumeId,
} from "@/lib/storage";

const MODEL_NAMES: Record<string, string> = {
  gemini: "Gemini 2.5 Flash",
  openai: "GPT-4o",
  claude: "Claude Sonnet",
};

export default function LibraryPage() {
  const [profile, setProfileState] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileInput, setProfileInput] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const name = getProfile();
    setProfileState(name);
    setSessions(getSessions());
    if (!name) setEditingProfile(true);
  }, []);

  function handleSaveProfile() {
    setProfile(profileInput.trim());
    setProfileState(profileInput.trim());
    setEditingProfile(false);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions(getSessions());
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await importSessions(file);
      setSessions(getSessions());
      setImportMsg(`${count}개의 대화가 추가됐어요.`);
      setTimeout(() => setImportMsg(""), 3000);
    } catch {
      setImportMsg("파일을 불러오지 못했어요.");
      setTimeout(() => setImportMsg(""), 3000);
    }
    e.target.value = "";
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">라이브러리</h1>
            {!editingProfile && profile && (
              <p className="text-gray-500 mt-1">
                {profile}님의 대화 기록
                <button
                  onClick={() => { setProfileInput(profile); setEditingProfile(true); }}
                  className="ml-2 text-xs text-blue-400 hover:underline"
                >
                  이름 변경
                </button>
              </p>
            )}
          </div>
          <Link
            href="/"
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            새 대화
          </Link>
        </div>

        {/* 이름 설정 */}
        {editingProfile && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <p className="text-gray-700 font-semibold mb-3">이름을 입력해주세요</p>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="예: 김작가"
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveProfile()}
                autoFocus
              />
              <button
                onClick={handleSaveProfile}
                disabled={!profileInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 내보내기 / 불러오기 */}
        {sessions.length > 0 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={exportSessions}
              className="text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-xl transition-colors"
            >
              JSON으로 백업
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium px-4 py-2 rounded-xl transition-colors"
            >
              백업 불러오기
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            {importMsg && <span className="text-sm text-blue-500 self-center">{importMsg}</span>}
          </div>
        )}

        {/* 세션 목록 */}
        {sessions.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            아직 저장된 대화가 없어요.
            <br />
            대화 후 저장하기 버튼을 눌러보세요.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl shadow overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{session.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(session.savedAt).toLocaleDateString("ko-KR", {
                          year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                        {" · "}질문 {session.exchanges.length}개
                      </p>
                    </div>
                    <span className="text-gray-400 ml-4">{expanded === session.id ? "▲" : "▼"}</span>
                  </div>
                </button>

                {expanded === session.id && (
                  <div className="border-t border-gray-100 px-6 py-4 space-y-6">
                    {session.exchanges.map((ex, i) => (
                      <div key={i}>
                        <div className="flex justify-end mb-2">
                          <div className="bg-blue-500 text-white rounded-2xl px-4 py-2 text-sm max-w-lg">
                            {ex.prompt}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <span className="text-xs font-bold text-gray-400">
                            {MODEL_NAMES[ex.selectedModel] ?? ex.selectedModel}
                          </span>
                          <p className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {ex.selectedText}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setResumeId(session.id);
                          router.push("/");
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                      >
                        이어서 대화하기 →
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        이 대화 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

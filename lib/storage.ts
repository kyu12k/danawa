export type Exchange = {
  prompt: string;
  selectedModel: string;
  selectedText: string;
};

export type Session = {
  id: string;
  title: string;
  savedAt: number;
  exchanges: Exchange[];
};

export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("danawa_sessions") ?? "[]");
  } catch {
    return [];
  }
}

export function saveSession(exchanges: Exchange[]): void {
  if (exchanges.length === 0) return;
  const sessions = getSessions();
  const newSession: Session = {
    id: Date.now().toString(),
    title: exchanges[0].prompt,
    savedAt: Date.now(),
    exchanges,
  };
  localStorage.setItem("danawa_sessions", JSON.stringify([newSession, ...sessions]));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem("danawa_sessions", JSON.stringify(sessions));
}

export function getProfile(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("danawa_profile") ?? "";
}

export function setProfile(name: string): void {
  localStorage.setItem("danawa_profile", name);
}

export function exportSessions(): void {
  const data = {
    profile: getProfile(),
    sessions: getSessions(),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `danawa_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function setResumeId(id: string): void {
  localStorage.setItem("danawa_resume_id", id);
}

export function popResumeSession(): Session | null {
  const id = localStorage.getItem("danawa_resume_id");
  if (!id) return null;
  localStorage.removeItem("danawa_resume_id");
  return getSessions().find((s) => s.id === id) ?? null;
}

export function importSessions(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const imported: Session[] = data.sessions ?? data;
        const existing = getSessions();
        const existingIds = new Set(existing.map((s) => s.id));
        const newOnes = imported.filter((s) => !existingIds.has(s.id));
        localStorage.setItem("danawa_sessions", JSON.stringify([...newOnes, ...existing]));
        resolve(newOnes.length);
      } catch {
        reject(new Error("파일 형식이 올바르지 않습니다."));
      }
    };
    reader.readAsText(file);
  });
}

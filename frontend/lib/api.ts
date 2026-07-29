import { AuthHelpers } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function req<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const token = AuthHelpers.getToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: isFormData
      ? { ...authHeader, ...(options?.headers as Record<string, string> ?? {}) }
      : { 'Content-Type': 'application/json', ...authHeader, ...(options?.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Session ──────────────────────────────────────────────────────────────
  createSession: (body: {
    student_name: string; resume_text: string; target_role: string;
    language: string; difficulty: string; company: string; experience_level: string;
  }, userId?: string) => {
    const url = userId ? `/session/create?user_id=${userId}` : '/session/create';
    return req(url, { method: 'POST', body: JSON.stringify(body) });
  },

  uploadResume: async (file: File): Promise<{ resume_text: string }> => {
    const form = new FormData();
    form.append('file', file);
    const token = AuthHelpers.getToken();
    const res = await fetch(`${BASE}/resume/upload`, {
      method: 'POST',
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) { const e = await res.text(); throw new Error(e); }
    return res.json();
  },

  analyzeResume:  (sid: string) => req(`/session/${sid}/analyze`, { method: 'POST' }),
  createPlan:     (sid: string) => req(`/session/${sid}/plan`, { method: 'POST' }),
  getSession:     (sid: string) => req<Record<string, unknown>>(`/session/${sid}`),
  getBenchmark:   (sid: string) => req(`/session/${sid}/benchmark`, { method: 'POST' }),
  getLearningPath:(sid: string) => req(`/session/${sid}/learning-path`, { method: 'POST' }),
  getReport:      (sid: string) => req(`/session/${sid}/report`, { method: 'POST' }),
  getMotivation:  (sid: string) => req(`/session/${sid}/motivate`, { method: 'POST' }),
  getAnalytics:   (sid: string) => req(`/progress/${sid}/analytics`),

  submitAnswer: (body: { session_id: string; question_index: number; question: string; answer: string }) =>
    req('/interview/submit-answer', { method: 'POST', body: JSON.stringify(body) }),

  generateFollowup: (sid: string, question: string, answer: string) =>
    req(`/session/${sid}/followup`, { method: 'POST', body: JSON.stringify({ session_id: sid, question, answer }) }),

  generatePractice: (sid: string) => req(`/interview/${sid}/practice`, { method: 'POST' }),

  getHistory: (studentName: string): Promise<{ sessions: Array<Record<string, unknown>>; total_sessions: number }> =>
    req(`/progress/student/${encodeURIComponent(studentName)}/history`),

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    req<{ token: string; user_id: string; name: string; email: string }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  signup: (name: string, email: string, password: string) =>
    req<{ token: string; user_id: string; name: string; email: string }>(
      '/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  getMe: () => req('/auth/me'),

  getUserSessions: () =>
    req<{ sessions: Array<Record<string, unknown>> }>('/auth/sessions'),

  // ── Advanced / Power Agents ───────────────────────────────────────────────
  analyzeJD: (jdText: string, role: string) =>
    req('/advanced/jd-analyze', { method: 'POST', body: JSON.stringify({ jd_text: jdText, candidate_role: role }) }),

  getReadiness: (sid: string) =>
    req(`/advanced/readiness/${sid}`, { method: 'POST' }),

  formatStar: (question: string, answer: string, role: string) =>
    req('/advanced/star-format', { method: 'POST', body: JSON.stringify({ question, answer, role }) }),

  getSoftSkills: (sid: string) =>
    req(`/advanced/soft-skills/${sid}`, { method: 'POST' }),

  devilAdvocate: (question: string, answer: string, role: string, company: string) =>
    req('/advanced/devil-advocate', { method: 'POST', body: JSON.stringify({ question, answer, role, company }) }),

  scoreATS: (resumeText: string, jdText: string) =>
    req('/advanced/ats-score', { method: 'POST', body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }) }),

  executeAgentLab: (agentId: string, payload: Record<string, unknown>) =>
    req<{ agent_id: string; status: string; latency_ms: number; model: string; output: Record<string, unknown> }>(
      '/agent-lab/execute', { method: 'POST', body: JSON.stringify({ agent_id: agentId, payload }) }
    ),

  executeCode: (code: string, language: string) =>
    req<{ status: string; stdout: string; elapsed_ms: number; complexity?: { time: string; space: string } }>(
      '/interview/execute-code', { method: 'POST', body: JSON.stringify({ code, language }) }
    ),
};

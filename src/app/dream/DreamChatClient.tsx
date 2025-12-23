'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { MarkdownContent } from '@/components/chat/MarkdownContent';

type Role = 'user' | 'ai';

type DreamMessage = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

type DreamStateV1 = {
  version: 1;
  anonId: string;
  sessionId: string;
  messages: DreamMessage[];
};

const STORAGE_KEY = 'edulens_dream_state_v1';
const MAX_MESSAGES = 8; // 4 pairs

function safeRandomId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `${prefix}_${(crypto as any).randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function loadState(): DreamStateV1 {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DreamStateV1>;
      if (parsed && parsed.version === 1 && parsed.anonId && parsed.sessionId && Array.isArray(parsed.messages)) {
        return {
          version: 1,
          anonId: String(parsed.anonId),
          sessionId: String(parsed.sessionId),
          messages: parsed.messages
            .filter((m): m is DreamMessage =>
              m && (m as DreamMessage).role && typeof (m as DreamMessage).content === 'string'
            )
            .slice(-MAX_MESSAGES),
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    version: 1,
    anonId: safeRandomId('anon'),
    sessionId: safeRandomId('dream'),
    messages: [],
  };
}

function saveState(state: DreamStateV1) {
  const trimmed: DreamStateV1 = {
    ...state,
    messages: state.messages.slice(-MAX_MESSAGES),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

async function postDreamMessage(params: {
  anonId: string;
  sessionId: string;
  message: string;
  recentMessages: Array<{ role: Role; content: string }>;
}) {
  const res = await fetch('/api/dream/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.detail || data?.error || data?.message || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return (await res.json()) as { session_id: string; answer: string };
}

export default function DreamChatClient() {
  const searchParams = useSearchParams();
  const initialQ = useMemo(() => (searchParams.get('q') || '').trim(), [searchParams]);

  const [state, setState] = useState<DreamStateV1 | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSentRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
  }, []);

  useEffect(() => {
    if (!state) return;
    saveState(state);
  }, [state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.messages.length]);

  const send = useCallback(async (text: string) => {
    if (!state) return;

    const message = text.trim();
    if (!message || busy) return;

    setError(null);
    setBusy(true);

    const userMsg: DreamMessage = {
      id: safeRandomId('m'),
      role: 'user',
      content: message,
      ts: Date.now(),
    };

    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, messages: [...prev.messages, userMsg] };
      return { ...next, messages: next.messages.slice(-MAX_MESSAGES) };
    });

    try {
      const recent = [...(state.messages || []), userMsg]
        .slice(-MAX_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const resp = await postDreamMessage({
        anonId: state.anonId,
        sessionId: state.sessionId,
        message,
        recentMessages: recent,
      });

      const aiMsg: DreamMessage = {
        id: safeRandomId('m'),
        role: 'ai',
        content: resp.answer,
        ts: Date.now(),
      };

      setState((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          sessionId: resp.session_id || prev.sessionId,
          messages: [...prev.messages, aiMsg],
        };
        return { ...next, messages: next.messages.slice(-MAX_MESSAGES) };
      });

      setInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setBusy(false);
    }
  }, [busy, state]);

  useEffect(() => {
    if (!state) return;
    if (autoSentRef.current) return;
    if (!initialQ) return;
    if (state.messages.length > 0) return;

    autoSentRef.current = true;
    void send(initialQ);
  }, [state, initialQ, send]);

  if (!state) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="text-sm text-slate-500">Dream chat (no signup)</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {state.messages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm">
              Tell me your dream: where you want to study, what you want to become, and your ideal timeline.
            </div>
          ) : null}

          {state.messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[90%] rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm leading-relaxed shadow-sm'
                    : 'max-w-[90%] rounded-2xl border border-slate-200 bg-white text-slate-900 px-4 py-3 text-sm leading-relaxed shadow-sm'
                }
              >
                {m.role === 'ai' ? (
                  <MarkdownContent
                    content={m.content}
                    className="prose-slate prose-headings:mt-4 prose-headings:mb-2 prose-p:my-3 prose-ol:my-3 prose-ul:my-3"
                  />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {busy ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl border border-slate-200 bg-white text-slate-500 px-4 py-3 text-sm">
                Thinking…
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your dream…"
              className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 outline-none"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-2 text-xs text-slate-500">We store only the last 4 message pairs in this browser.</div>
        </div>
      </footer>
    </div>
  );
}

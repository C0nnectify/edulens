"use client";
import React, { useState } from "react";

export default function AnalyzerPage() {
  const [userId, setUserId] = useState<string>("demo-user");
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [useEntireCollection, setUseEntireCollection] = useState<boolean>(false);

  const apiBase = process.env.NEXT_PUBLIC_AI_API_BASE || "http://localhost:8000";

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("user_id", userId);
      form.append("collection_type", "documents");
      form.append("document_type", "general");

      const res = await fetch(`${apiBase}/api/v1/analyzer/upload`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Upload failed");
      alert(`Uploaded: ${data.data.filename} (chunks: ${data.data.chunk_count})`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments() {
    try {
      const res = await fetch(`${apiBase}/api/v1/analyzer/documents?user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data.documents || []);
      }
    } catch (err) {
      // ignore
    }
  }

  async function handleQuery(e: React.FormEvent) {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    try {
      const tracking_ids = Object.keys(selected).filter((k) => selected[k]);
      const res = await fetch(`${apiBase}/api/v1/analyzer/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, question, top_k: 6, tracking_ids, use_entire_collection: useEntireCollection }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Query failed");
      setAnswer(data.data.answer);
      setSources(data.data.sources || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Document Analyzer</h1>

      <div className="space-y-2">
        <label className="block text-sm">User ID</label>
        <input
          className="border rounded p-2 w-full"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          onBlur={loadDocuments}
        />
      </div>

      <form onSubmit={handleUpload} className="space-y-3">
        <label className="block text-sm">Upload Document</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Uploading..." : "Upload & Index"}
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Select Documents to Analyze</h2>
          <button className="text-sm underline" onClick={loadDocuments} type="button">Refresh</button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {documents.length === 0 && (
            <div className="text-sm text-gray-500">No documents found for this user.</div>
          )}
          {documents.map((d) => (
            <label key={d.tracking_id} className="flex items-center gap-2 border rounded p-2">
              <input
                type="checkbox"
                checked={!!selected[d.tracking_id]}
                onChange={(e) =>
                  setSelected((prev) => ({ ...prev, [d.tracking_id]: e.target.checked }))
                }
              />
              <span className="font-mono">{d.filename || d.document_id}</span>
              <span className="text-xs text-gray-500">({d.tracking_id})</span>
              <span className="ml-auto text-xs text-gray-500">chunks: {d.chunk_count}</span>
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm mt-2">
          <input type="checkbox" checked={useEntireCollection} onChange={(e) => setUseEntireCollection(e.target.checked)} />
          Use entire collection when no files selected
        </label>
      </div>

      <form onSubmit={handleQuery} className="space-y-3">
        <label className="block text-sm">Ask a Question</label>
        <textarea
          className="border rounded p-2 w-full"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Analyzing..." : "Analyze & Answer"}
        </button>
      </form>

      {answer && (
        <div className="space-y-2">
          <h2 className="text-xl font-medium">Answer</h2>
          <div className="bg-gray-50 border rounded p-3 whitespace-pre-wrap">{answer}</div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Sources</h3>
          <ul className="list-disc pl-6">
            {sources.map((s, i) => (
              <li key={i}>
                <span className="font-mono">{s.filename}</span> — score {s.score?.toFixed(3)} (chunk {s.chunk_index})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { chatEventSchema, type ChatAnswer } from "@/lib/chat/schema";
import { Citation } from "@/components/citation";

type Message = { question: string; response?: ChatAnswer };

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    const messageIndex = messages.length;
    setMessages((current) => [...current, { question }]);
    setInput(""); setBusy(true); setError(""); setStatus("Looking up relevant passages…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      if (!response.ok || !response.body) throw new Error("Couldn't connect. Check that you're signed in and try again.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let received = false;
      function receive(line: string) {
        if (!line.trim()) return;
        const event = chatEventSchema.parse(JSON.parse(line));
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "status") setStatus(event.message);
        if (event.type === "answer") {
          received = true;
          setMessages((current) => current.map((item, index) => index === messageIndex ? { ...item, response: event.data } : item));
        }
      }
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary;
          while ((boundary = buffer.indexOf("\n")) >= 0) {
            receive(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 1);
          }
        }
        buffer += decoder.decode();
        receive(buffer);
        if (!received) throw new Error("The explanation was interrupted. Please try again.");
      } finally { reader.releaseLock(); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't explain this topic.");
      setInput(question);
    } finally { setBusy(false); setStatus(""); }
  }

  return <div className="mt-8 space-y-6">
    <p className="rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">This helper only uses your uploaded notes and syllabus. No useful source means no answer from memory. Messages stay in this page and are not saved after reload.</p>
    {messages.map((message, index) => <article key={index} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-bold">{message.question}</h2>
      {message.response && <><p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">{message.response.answer}</p>{message.response.citations.map((citation) => <Citation key={citation.id} section={citation.section} quote={citation.quote} />)}</>}
      {!message.response && !busy && <p className="mt-3 text-sm text-slate-500">No response saved. Retry using the form below.</p>}
    </article>)}
    {busy && <p role="status" className="text-sm text-teal-800">{status}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={submit} className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="sr-only" htmlFor="chat-question">Ask about your material</label>
      <input id="chat-question" className="min-w-0 flex-1" placeholder="Explain photosynthesis…" value={input} minLength={2} maxLength={1200} required onChange={(event) => setInput(event.target.value)} disabled={busy} />
      <button className="button-primary" disabled={busy}>{busy ? "Checking sources…" : "Explain topic →"}</button>
    </form>
  </div>;
}

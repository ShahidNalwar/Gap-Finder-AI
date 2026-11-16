"use client";

import { useState, type FormEvent } from "react";
import { chatEventSchema, type ChatAnswer } from "@/lib/chat/schema";
import { Citation } from "@/components/citation";
import { Icon } from "@/components/ui/icon";

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
    <p className="flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50/70 p-4 text-xs leading-6 text-teal-900"><Icon name="shield" className="mt-1 h-4 w-4 shrink-0" /><span>This helper only uses your uploaded notes and syllabus. No useful source means no answer from memory. Messages stay in this page and are not saved after reload.</span></p>
    {!messages.length && <div className="surface flex flex-col items-center px-6 py-14 text-center"><span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon name="chat" className="h-8 w-8" /></span><h2 className="text-xl font-semibold tracking-tight text-slate-900">Your notes. A clearer explanation.</h2><p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Ask about something you&apos;ve uploaded. We&apos;ll find the relevant passages and help make sense of them, with sources you can check.</p><span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><Icon name="book" className="h-3 w-3" />Grounded in your material</span></div>}
    {messages.map((message, index) => <article key={index} className="surface p-6 sm:p-7">
      <h2 className="flex items-start gap-3 font-semibold text-slate-900"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"><Icon name="chat" className="h-3.5 w-3.5" /></span>{message.question}</h2>
      {message.response && <><p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">{message.response.answer}</p>{message.response.citations.map((citation) => <Citation key={citation.id} section={citation.section} quote={citation.quote} />)}</>}
      {!message.response && !busy && <p className="mt-3 text-sm text-slate-500">No response saved. Retry using the form below.</p>}
    </article>)}
    {busy && <p role="status" className="text-sm text-teal-800">{status}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={submit} className="surface flex flex-wrap gap-3 p-4 sm:p-5">
      <label className="sr-only" htmlFor="chat-question">Ask about your material</label>
      <input id="chat-question" className="min-w-0 flex-1 basis-full text-sm sm:basis-auto" placeholder="What would you like to understand better?" value={input} minLength={2} maxLength={1200} required onChange={(event) => setInput(event.target.value)} disabled={busy} />
      <button className="button-primary w-full sm:w-auto" disabled={busy}>{busy ? "Checking sources…" : "Explain topic"}<Icon name="arrow" className="h-4 w-4" /></button>
    </form>
  </div>;
}

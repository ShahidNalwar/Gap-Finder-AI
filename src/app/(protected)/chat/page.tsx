import { ChatPanel } from "@/components/chat-panel";

export default function ChatPage() {
  return <section><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">Study helper</p><h1 className="text-3xl font-bold">A little help, from your own notes.</h1><p className="mt-4 leading-7 text-slate-500">Ask about a topic. Every supported explanation includes source sections you can inspect.</p><ChatPanel /></section>;
}

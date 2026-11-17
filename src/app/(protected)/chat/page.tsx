import { ChatPanel } from "@/components/chat-panel";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

export default function ChatPage() {
  return <section><PageHeader eyebrow="Your study companion" icon="chat" badge="Only from your material" title="Make the tricky parts click." description="Ask for a simpler explanation, grounded in your own notes. Every supported answer points you back to the source." /><ChatPanel /><div className="mt-8"><Link href="/quiz" className="button-primary">Next: test your understanding →</Link></div></section>;
}

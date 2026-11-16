import { Icon } from "@/components/ui/icon";

export function Citation({ section, quote }: { section: string; quote: string }) {
  return (
    <details className="group mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-sm">
      <summary className="flex cursor-pointer list-none items-start gap-2 text-xs font-semibold leading-6 text-teal-800"><Icon name="book" className="mt-1 h-4 w-4 shrink-0" /><span className="flex-1">Source: {section}</span><Icon name="arrow" className="mt-1 h-3.5 w-3.5 shrink-0 rotate-90 transition group-open:-rotate-90" /></summary>
      <blockquote className="mt-4 whitespace-pre-wrap break-words border-l-2 border-teal-500/60 pl-4 text-sm leading-7 text-slate-500">{quote}</blockquote>
    </details>
  );
}

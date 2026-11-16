export function Citation({ section, quote }: { section: string; quote: string }) {
  return (
    <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-teal-800">Source: {section}</summary>
      <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-teal-600 pl-4 leading-6 text-slate-600">{quote}</blockquote>
    </details>
  );
}

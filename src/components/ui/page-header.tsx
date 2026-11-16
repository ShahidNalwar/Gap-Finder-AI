import { Icon, type IconName } from "@/components/ui/icon";

export function PageHeader({ eyebrow, title, description, icon, badge }: {
  eyebrow: string; title: string; description: string; icon: IconName; badge?: string;
}) {
  return <div className="page-header">
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <span className="eyebrow"><span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-100/80"><Icon name={icon} className="h-3.5 w-3.5" /></span>{eyebrow}</span>
      {badge && <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-500">{badge}</span>}
    </div>
    <h1 className="page-title">{title}</h1>
    <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-500 sm:text-base">{description}</p>
  </div>;
}

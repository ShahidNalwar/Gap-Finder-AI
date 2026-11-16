import { UploadForm } from "@/components/upload-form";

export default function UploadPage() {
  return (
    <section>
      <p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">01 / Your material</p>
      <h1 className="text-3xl font-bold tracking-tight">Start with what you&apos;re studying.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-500">Bring your syllabus, notes, and past papers together. Your questions and explanations will be grounded in these sources.</p>
      <UploadForm />
    </section>
  );
}

import { UploadForm } from "@/components/upload-form";
import { PageHeader } from "@/components/ui/page-header";

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams;
  return (
    <section>
      <PageHeader eyebrow="01 / Your material" icon="upload" badge="Your sources, your learning" title="Good revision starts here." description="Bring your syllabus, notes, and past papers together. Every question and explanation starts with your material—not guesswork." />
      {reset === "done" && <p role="status" className="notice-success mt-6">Your study workspace has been cleared. Your account is unchanged. You can now load the Electricity sample or upload new material.</p>}
      <UploadForm />
    </section>
  );
}

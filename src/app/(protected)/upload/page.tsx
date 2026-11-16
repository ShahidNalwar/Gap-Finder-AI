import { UploadForm } from "@/components/upload-form";
import { PageHeader } from "@/components/ui/page-header";

export default function UploadPage() {
  return (
    <section>
      <PageHeader eyebrow="01 / Your material" icon="upload" badge="Your sources, your learning" title="Good revision starts here." description="Bring your syllabus, notes, and past papers together. Every question and explanation starts with your material—not guesswork." />
      <UploadForm />
    </section>
  );
}

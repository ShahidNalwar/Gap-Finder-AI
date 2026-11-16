import { TopicMap } from "@/components/topic-map";
import { PageHeader } from "@/components/ui/page-header";

export default function TopicsPage() {
  return <section><PageHeader eyebrow="02 / Topic map" icon="topics" badge="See what matters most" title="The bigger picture, mapped." description="Your syllabus, broken into clear topics. See which ones appear most often in your past papers before you test your understanding." /><TopicMap /></section>;
}

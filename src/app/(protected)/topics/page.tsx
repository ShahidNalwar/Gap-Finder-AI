import { TopicMap } from "@/components/topic-map";

export default function TopicsPage() {
  return <section><p className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-teal-800">02 / Topic map</p><h1 className="text-3xl font-bold">See the bigger picture.</h1><p className="mt-4 leading-7 text-slate-500">Your syllabus topics, with exam-frequency weighting from your uploaded past papers.</p><TopicMap /></section>;
}

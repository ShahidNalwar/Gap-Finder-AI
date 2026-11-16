import type { TopicScore } from "@/lib/scoring/mastery";

const colors = ["#0f766e", "#b45309", "#7c3aed", "#be185d", "#0369a1", "#4d7c0f"];

export function ProgressChart({ progress, topics }: {
  progress: { id: string; scores: TopicScore[] }[];
  topics: { id: string; name: string }[];
}) {
  const width = 680;
  const height = 240;
  const x = (index: number) => 50 + index * 590 / Math.max(1, progress.length - 1);
  const y = (mastery: number) => 190 - mastery * 150;
  return <div className="overflow-x-auto">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="progress-title progress-desc" className="min-w-[480px] w-full">
      <title id="progress-title">Mastery across diagnostic attempts</title>
      <desc id="progress-desc">Each topic has a colored line. The exact percentages are available in the table below. Untested topics have no point.</desc>
      {[0, 0.4, 0.7, 1].map((value) => <g key={value}><line x1={50} x2={650} y1={y(value)} y2={y(value)} stroke="#e2e8f0" /><text x={8} y={y(value) + 4} fontSize={11} fill="#64748b">{Math.round(value * 100)}%</text></g>)}
      {topics.map((topic, topicIndex) => {
        const points = progress.map((attempt, index) => ({ index, mastery: attempt.scores.find((score) => score.id === topic.id)?.mastery ?? null }));
        return <g key={topic.id}>
          {points.slice(1).map((point, index) => point.mastery !== null && points[index].mastery !== null
            ? <line key={point.index} x1={x(index)} y1={y(points[index].mastery!)} x2={x(point.index)} y2={y(point.mastery)} stroke={colors[topicIndex % colors.length]} strokeWidth={2} /> : null)}
          {points.filter((point) => point.mastery !== null).map((point) => <circle key={point.index} cx={x(point.index)} cy={y(point.mastery!)} r={4} fill={colors[topicIndex % colors.length]} />)}
        </g>;
      })}
      {progress.map((attempt, index) => <text key={attempt.id} x={x(index)} y={215} textAnchor="middle" fontSize={10} fill="#64748b">{index + 1}</text>)}
      <text x={340} y={237} textAnchor="middle" fontSize={11} fill="#64748b">Attempts (oldest → latest)</text>
    </svg>
    <ul className="mt-2 flex flex-wrap gap-4 text-xs">{topics.map((topic, index) => <li key={topic.id} className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />{topic.name}</li>)}</ul>
  </div>;
}

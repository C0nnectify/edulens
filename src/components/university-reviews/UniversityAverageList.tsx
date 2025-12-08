
import StarRatingDisplay from "./StarRatingDisplay";

type Item = {
  university: string;
  avg: number;
  count: number;
};

type Props = {
  averages: Item[];
};

export default function UniversityAverageList({ averages }: Props) {
  if (!averages.length) return null;
  return (
    <div className="flex flex-wrap gap-4">
      {averages.map(({ university, avg, count }) => (
        <div key={university} className="flex items-center bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 gap-2 shadow-sm animate-fade-in">
          <span className="font-medium text-emerald-900">{university}</span>
          <StarRatingDisplay rating={avg} size={18} />
          <span className="text-xs text-gray-600">({avg.toFixed(2)}, {count} review{count > 1 ? "s" : ""})</span>
        </div>
      ))}
    </div>
  );
}

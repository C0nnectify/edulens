
import StarRatingDisplay from "./StarRatingDisplay";
import { Review } from "./types";

type Props = {
  reviews: Review[];
  isNewlyAdded: (id: number) => boolean;
};
export default function ReviewList({ reviews, isNewlyAdded }: Props) {
  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to add one!</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            className={`border rounded-lg p-4 bg-white shadow relative ${
              isNewlyAdded(r.id)
                ? "animate-fade-in ring-2 ring-emerald-400"
                : ""
            }`}
            style={{ transition: "box-shadow 0.3s" }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-emerald-700">{r.university}</span>
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded">
                <StarRatingDisplay rating={r.rating} size={14} />
                <span className="ml-1">{r.rating}</span>
              </span>
            </div>
            {(r.subject || r.department) && (
              <div className="mb-1 text-xs text-blue-700">
                {r.subject && <span>{r.subject}</span>}
                {r.subject && r.department && ' • '}
                {r.department && <span>{r.department}</span>}
              </div>
            )}
            <div className="mb-1 text-gray-600 text-sm">{r.comment}</div>
            <div className="text-gray-400 text-xs">by {r.reviewer}</div>
          </div>
        ))
      )}
    </div>
  );
}

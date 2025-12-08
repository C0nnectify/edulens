
import { Star, StarHalf, StarOff } from "lucide-react";

export default function StarRatingDisplay({ rating, size = 18 }: { rating: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Star key={i} size={size} className="text-yellow-500 inline" fill="currentColor" />);
    } else if (rating > i - 1 && rating < i) {
      stars.push(<StarHalf key={i} size={size} className="text-yellow-500 inline" fill="currentColor" />);
    } else {
      stars.push(<StarOff key={i} size={size} className="text-gray-300 inline" />);
    }
  }
  return <span className="inline-flex gap-0.5">{stars}</span>;
}

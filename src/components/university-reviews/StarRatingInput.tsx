
import { Star, StarOff } from "lucide-react";

export default function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`p-0.5 bg-transparent border-0 focus:outline-none ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !disabled && onChange(star)}
          aria-label={`${star} Star${star > 1 ? "s" : ""}`}
          disabled={disabled}
        >
          {value >= star ? <Star size={24} className="text-yellow-500" fill="currentColor" /> : <StarOff size={24} className="text-gray-300" />}
        </button>
      ))}
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StarRatingInput from "./StarRatingInput";
import { Review } from "./types";
import React from "react";

type FormType = Omit<Review, "id">;
type Props = {
  form: FormType;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStarChange: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
};
export default function ReviewForm({ form, onChange, onStarChange, onSubmit, submitting }: Props) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Submit a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="university" className="mb-1 font-medium text-sm">University<span className="text-red-500">*</span></label>
              <input
                className="border p-2 rounded"
                id="university"
                type="text"
                name="university"
                placeholder="University"
                value={form.university}
                onChange={onChange}
                required
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="subject" className="mb-1 font-medium text-sm">Subject (optional)</label>
              <input
                className="border p-2 rounded"
                id="subject"
                type="text"
                name="subject"
                placeholder="Subject (optional)"
                value={form.subject}
                onChange={onChange}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="department" className="mb-1 font-medium text-sm">Department (optional)</label>
              <input
                className="border p-2 rounded"
                id="department"
                type="text"
                name="department"
                placeholder="Department (optional)"
                value={form.department}
                onChange={onChange}
                disabled={submitting}
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="reviewer" className="mb-1 font-medium text-sm">Your Name<span className="text-red-500">*</span></label>
              <input
                className="border p-2 rounded"
                id="reviewer"
                type="text"
                name="reviewer"
                placeholder="Your Name"
                value={form.reviewer}
                onChange={onChange}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="font-medium mr-2">Rating<span className="text-red-500">*</span>:</label>
            <StarRatingInput value={form.rating} onChange={onStarChange} disabled={submitting} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="comment" className="mb-1 font-medium text-sm">Your Review<span className="text-red-500">*</span></label>
            <textarea
              className="border p-2 rounded w-full min-h-[80px]"
              id="comment"
              name="comment"
              placeholder="Your honest review"
              value={form.comment}
              onChange={onChange}
              required
              disabled={submitting}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

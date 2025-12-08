
import FilterBar from "./FilterBar";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import ReviewsPagination from "./ReviewsPagination";
import UniversityQA from "./UniversityQA";
import { Review } from "./types";
import React from "react";

type FilterType = {
  university: string;
  subject: string;
  department: string;
};

type Props = {
  universities: string[];
  subjects: string[];
  departments: string[];
  filters: FilterType;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  form: Omit<Review, "id">;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onStarChange: (val: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;

  paginatedReviews: Review[];
  isNewlyAdded: (id: number) => boolean;

  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
  getPageNumbers: () => number[];
};

export default function UniversityReviewsSection({
  universities,
  subjects,
  departments,
  filters,
  onFilterChange,
  form,
  onFormChange,
  onStarChange,
  onSubmit,
  submitting,
  paginatedReviews,
  isNewlyAdded,
  page,
  totalPages,
  onPrev,
  onNext,
  onPage,
  getPageNumbers,
}: Props) {
  return (
    <>
      <FilterBar
        universities={universities}
        subjects={subjects}
        departments={departments}
        filters={filters}
        onChange={onFilterChange}
      />
      <ReviewForm
        form={form}
        onChange={onFormChange}
        onStarChange={onStarChange}
        onSubmit={onSubmit}
        submitting={submitting}
      />
      <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
      <ReviewList reviews={paginatedReviews} isNewlyAdded={isNewlyAdded} />
      <ReviewsPagination
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        onPage={onPage}
        getPageNumbers={getPageNumbers}
      />
      {/* Q&A forum for selected university */}
      {filters.university && <UniversityQA university={filters.university} />}
    </>
  );
}

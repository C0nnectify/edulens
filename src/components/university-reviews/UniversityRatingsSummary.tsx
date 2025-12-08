
import UniversityAverageList from "./UniversityAverageList";
import UniversityAggregations from "./UniversityAggregations";
import React from "react";

type Props = {
  avgRatingByUniversity: { university: string; avg: number; count: number }[];
  filteredUniversitySubjectAggs: {
    university: string;
    subject: string;
    avg: number;
    count: number;
  }[];
  filteredUniversityDepartmentAggs: {
    university: string;
    department: string;
    avg: number;
    count: number;
  }[];
};

export default function UniversityRatingsSummary({
  avgRatingByUniversity,
  filteredUniversitySubjectAggs,
  filteredUniversityDepartmentAggs,
}: Props) {
  return (
    <>
      <div className="mb-4">
        <UniversityAverageList averages={avgRatingByUniversity} />
      </div>
      {(filteredUniversitySubjectAggs.length > 0 ||
        filteredUniversityDepartmentAggs.length > 0) && (
        <UniversityAggregations
          subjectAggs={filteredUniversitySubjectAggs}
          departmentAggs={filteredUniversityDepartmentAggs}
        />
      )}
    </>
  );
}

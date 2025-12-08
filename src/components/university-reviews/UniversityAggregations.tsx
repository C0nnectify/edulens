
import StarRatingDisplay from "./StarRatingDisplay";

type SubjectAgg = {
  subject: string;
  avg: number;
  count: number;
};

type DepartmentAgg = {
  department: string;
  avg: number;
  count: number;
};

type Props = {
  subjectAggs: SubjectAgg[];
  departmentAggs: DepartmentAgg[];
};

export default function UniversityAggregations({ subjectAggs, departmentAggs }: Props) {
  return (
    <>
      {/* Detailed Subject Aggregations */}
      {subjectAggs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {subjectAggs.map(({ subject, avg, count }) =>
            subject ? (
              <span key={subject}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs text-blue-800"
              >
                <span className="font-semibold">{subject}</span>
                <StarRatingDisplay rating={avg} size={14} />
                <span>({avg.toFixed(2)}, {count})</span>
              </span>
            ) : null
          )}
        </div>
      )}
      {/* Detailed Department Aggregations */}
      {departmentAggs.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {departmentAggs.map(({ department, avg, count }) =>
            department ? (
              <span key={department}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs text-purple-800"
              >
                <span className="font-semibold">{department}</span>
                <StarRatingDisplay rating={avg} size={14} />
                <span>({avg.toFixed(2)}, {count})</span>
              </span>
            ) : null
          )}
        </div>
      )}
    </>
  );
}

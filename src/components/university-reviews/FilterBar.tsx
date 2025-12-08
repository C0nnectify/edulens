
import { Review } from "./types";

type Props = {
  universities: string[];
  subjects: string[];
  departments: string[];
  filters: { university: string; subject: string; department: string };
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};
export default function FilterBar({ universities, subjects, departments, filters, onChange }: Props) {
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 mb-8 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
      <label className="sr-only" htmlFor="filter-university">University</label>
      <select
        id="filter-university"
        className="border p-2 rounded min-w-[120px]"
        name="university"
        value={filters.university}
        onChange={onChange}
      >
        <option value="">All Universities</option>
        {universities.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="filter-subject">Subject</label>
      <select
        id="filter-subject"
        className="border p-2 rounded min-w-[120px]"
        name="subject"
        value={filters.subject}
        onChange={onChange}
      >
        <option value="">All Subjects</option>
        {subjects.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="filter-department">Department</label>
      <select
        id="filter-department"
        className="border p-2 rounded min-w-[120px]"
        name="department"
        value={filters.department}
        onChange={onChange}
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}

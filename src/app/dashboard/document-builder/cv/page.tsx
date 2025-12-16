import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ResumeListView } from '@/components/dashboard/resume/ResumeListView';

export default function CVsPage() {
  return (
    <DashboardLayout>
      <ResumeListView documentType="cv" />
    </DashboardLayout>
  );
}

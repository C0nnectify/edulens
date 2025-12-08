import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ResumeListView } from '@/components/dashboard/resume/ResumeListView';

export default function ResumesPage() {
  return (
    <DashboardLayout>
      <ResumeListView userId="demo-user" />
    </DashboardLayout>
  );
}

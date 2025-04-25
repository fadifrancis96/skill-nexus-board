
import { useAuth } from "@/contexts/AuthContext";
import JobList from "@/components/Jobs/JobList";
import AppLayout from "@/components/Layout/AppLayout";

export default function MyJobsPage() {
  const { currentUserData } = useAuth();

  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">My Jobs</h1>
        <JobList filter="my-jobs" userId={currentUserData?.id} />
      </div>
    </AppLayout>
  );
}

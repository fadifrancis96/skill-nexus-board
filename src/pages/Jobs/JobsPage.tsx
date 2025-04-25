
import JobList from "@/components/Jobs/JobList";
import AppLayout from "@/components/Layout/AppLayout";

export default function JobsPage() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Browse Jobs</h1>
        <JobList filter="all" />
      </div>
    </AppLayout>
  );
}

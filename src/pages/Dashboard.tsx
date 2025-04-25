
import { useAuth } from "@/contexts/AuthContext";
import JobPosterDashboard from "@/components/Dashboard/JobPosterDashboard";
import ContractorDashboard from "@/components/Dashboard/ContractorDashboard";
import AppLayout from "@/components/Layout/AppLayout";

export default function Dashboard() {
  const { currentUserData } = useAuth();

  return (
    <AppLayout>
      {currentUserData?.role === "job_poster" ? (
        <JobPosterDashboard />
      ) : (
        <ContractorDashboard />
      )}
    </AppLayout>
  );
}

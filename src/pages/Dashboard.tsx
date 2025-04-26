
import { useAuth } from "@/contexts/AuthContext";
import JobPosterDashboard from "@/components/Dashboard/JobPosterDashboard";
import ContractorDashboard from "@/components/Dashboard/ContractorDashboard";
import AppLayout from "@/components/Layout/AppLayout";
import { useTranslation } from "react-i18next";

export default function Dashboard() {
  const { currentUser, currentUserData } = useAuth();
  const { t } = useTranslation();

  // Check both current user object and user data from DB
  if (!currentUser || !currentUserData) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <p>{t('loadingUserData')}</p>
        </div>
      </AppLayout>
    );
  }

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


import AppLayout from "@/components/Layout/AppLayout";
import ManageProfile from "@/components/Contractors/ManageProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ManageProfilePage() {
  const { currentUserData } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    // Make sure to show users instructions when they land on the page
    if (currentUserData?.role === 'contractor') {
      toast({
        title: t("manageYourProfile"),
        description: t("addYourDetailsAndShowcaseProjects")
      });
    }
  }, [currentUserData?.role, t]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {currentUserData?.role === 'contractor' ? (
          <ManageProfile />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>{t("onlyContractorsCanManageProfiles")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

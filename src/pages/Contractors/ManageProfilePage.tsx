
import AppLayout from "@/components/Layout/AppLayout";
import ManageProfile from "@/components/Contractors/ManageProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export default function ManageProfilePage() {
  const { currentUserData } = useAuth();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {currentUserData?.role === 'contractor' ? (
          <ManageProfile />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Only contractor accounts can manage profiles.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

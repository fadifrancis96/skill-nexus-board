
import AppLayout from "@/components/Layout/AppLayout";
import ManageProfile from "@/components/Contractors/ManageProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";

export default function ManageProfilePage() {
  const { currentUserData } = useAuth();

  useEffect(() => {
    // Make sure to show users instructions when they land on the page
    if (currentUserData?.role === 'contractor') {
      toast({
        title: "Manage Your Profile",
        description: "Add your details and showcase your completed projects here."
      });
    }
  }, [currentUserData?.role]);

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

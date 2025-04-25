
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [currentUser, loading, navigate]);

  return null;
};

export default Index;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import JobsPage from "./pages/Jobs/JobsPage";
import JobDetailPage from "./pages/Jobs/JobDetailPage";
import NewJobPage from "./pages/Jobs/NewJobPage";
import MyJobsPage from "./pages/Jobs/MyJobsPage";
import JobOffersPage from "./pages/Jobs/JobOffersPage";
import MyOffersPage from "./pages/Offers/MyOffersPage";
import Unauthorized from "./pages/Unauthorized";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs" 
              element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs/:id" 
              element={
                <ProtectedRoute>
                  <JobDetailPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs/new" 
              element={
                <ProtectedRoute requiredRole={["job_poster"]}>
                  <NewJobPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-jobs" 
              element={
                <ProtectedRoute requiredRole={["job_poster"]}>
                  <MyJobsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/jobs/:id/offers" 
              element={
                <ProtectedRoute requiredRole={["job_poster"]}>
                  <JobOffersPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-offers" 
              element={
                <ProtectedRoute requiredRole={["contractor"]}>
                  <MyOffersPage />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

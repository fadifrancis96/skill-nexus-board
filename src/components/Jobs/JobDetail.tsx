
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import OfferForm from "@/components/Offers/OfferForm";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/types";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, currentUserData } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobPosterName, setJobPosterName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const jobDoc = await getDoc(doc(db, "jobs", id));
        
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          
          // Get job poster name
          const posterDoc = await getDoc(doc(db, "users", jobData.createdBy));
          if (posterDoc.exists()) {
            const posterData = posterDoc.data();
            setJobPosterName(posterData.displayName || "Unknown User");
          }
          
          setJob({
            id: jobDoc.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            datePosted: jobData.datePosted.toDate(),
            createdBy: jobData.createdBy,
            status: jobData.status,
            category: jobData.category,
            budget: jobData.budget,
          });
        } else {
          toast({
            title: "Error",
            description: "Job not found",
            variant: "destructive",
          });
          navigate("/jobs");
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const isJobPoster = currentUserData?.id === job.createdBy;
  const isContractor = currentUserData?.role === "contractor";

  return (
    <div>
      <div className="mb-6">
        <Link to="/jobs" className="text-primary hover:underline">
          ← Back to Jobs
        </Link>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
              <div className="flex items-center mb-4 text-sm text-muted-foreground">
                <span>{job.location}</span>
                <span className="mx-2">•</span>
                <span>Posted {new Date(job.datePosted).toLocaleDateString()}</span>
                {job.category && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{job.category}</span>
                  </>
                )}
                {job.budget && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Budget: ${job.budget}</span>
                  </>
                )}
              </div>
              <p className="text-sm">
                Posted by: {jobPosterName}
              </p>
            </div>
            <span
              className={`
                px-3 py-1 rounded-full text-xs font-semibold
                ${job.status === 'open' ? 'bg-green-100 text-green-800' : 
                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                  'bg-gray-100 text-gray-800'}
              `}
            >
              {job.status === 'open' ? 'Open' : 
               job.status === 'in_progress' ? 'In Progress' : 
               'Completed'}
            </span>
          </div>
          
          <Separator className="my-4" />
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-2">Job Description</h2>
            <p className="whitespace-pre-line">{job.description}</p>
          </div>
          
          {isJobPoster && (
            <div className="mt-6 flex space-x-4">
              <Button asChild>
                <Link to={`/jobs/${job.id}/offers`}>View Offers</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isContractor && job.status === "open" && (
        <Card>
          <CardHeader>
            <CardTitle>Submit an Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferForm jobId={job.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

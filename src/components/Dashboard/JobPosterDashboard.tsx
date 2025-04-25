import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Job, Offer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function JobPosterDashboard() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pendingOffers, setPendingOffers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      try {
        const jobsQuery = query(
          collection(db, "jobs"),
          where("createdBy", "==", currentUser.uid)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        
        const jobsData: Job[] = [];
        let totalPendingOffers = 0;
        
        for (const doc of jobsSnapshot.docs) {
          const jobData = doc.data();
          
          const offersQuery = query(
            collection(db, `jobs/${doc.id}/offers`),
            where("status", "==", "pending")
          );
          
          const offersSnapshot = await getDocs(offersQuery);
          const pendingOffersCount = offersSnapshot.size;
          totalPendingOffers += pendingOffersCount;
          
          jobsData.push({
            id: doc.id,
            title: jobData.title,
            description: jobData.description,
            location: jobData.location,
            datePosted: jobData.datePosted?.toDate() || new Date(),
            createdBy: jobData.createdBy,
            status: jobData.status,
            category: jobData.category,
            budget: jobData.budget,
          });
        }
        
        jobsData.sort((a, b) => b.datePosted.getTime() - a.datePosted.getTime());
        
        setJobs(jobsData);
        setPendingOffers(totalPendingOffers);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentUser]);

  const activeJobs = jobs.filter(
    (job) => job.status === "open" || job.status === "in_progress"
  );
  const completedJobs = jobs.filter((job) => job.status === "completed");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Job Poster Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{activeJobs.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Pending Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{pendingOffers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{completedJobs.length}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Recent Jobs</h2>
        <Button asChild>
          <Link to="/jobs/new">Post a New Job</Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <p>Loading jobs...</p>
        </div>
      ) : jobs.length > 0 ? (
        <div className="space-y-4">
          {jobs.slice(0, 5).map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      <Link to={`/jobs/${job.id}`} className="hover:text-primary">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Location: {job.location} • Posted:{" "}
                      {new Date(job.datePosted).toLocaleDateString()}
                    </p>
                    <p className="line-clamp-2">{job.description}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-semibold
                      ${job.status === 'open' ? 'bg-green-100 text-green-800' : 
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {job.status === 'open' ? 'Open' : 
                       job.status === 'in_progress' ? 'In Progress' : 
                       'Completed'}
                    </span>
                    <Link 
                      to={`/jobs/${job.id}/offers`} 
                      className="text-sm text-primary hover:underline mt-2"
                    >
                      View Offers
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {jobs.length > 5 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" asChild>
                <Link to="/my-jobs">View All Jobs</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">You haven't posted any jobs yet.</p>
            <Button asChild>
              <Link to="/jobs/new">Post Your First Job</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

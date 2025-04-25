
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface JobListProps {
  filter?: "my-jobs" | "all";
  userId?: string;
}

interface JobData extends DocumentData {
  title: string;
  description: string;
  location: string;
  datePosted: {
    toDate: () => Date;
  };
  createdBy: string;
  status: 'open' | 'in_progress' | 'completed';
  category?: string;
  budget?: number;
}

export default function JobList({ filter = "all", userId }: JobListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        let jobsQuery;
        
        if (filter === "my-jobs" && userId) {
          console.log("Fetching jobs for user ID:", userId);
          // Using a simple query without orderBy to avoid index issues
          jobsQuery = query(
            collection(db, "jobs"),
            where("createdBy", "==", userId)
          );
        } else {
          jobsQuery = query(
            collection(db, "jobs"),
            where("status", "==", "open")
          );
        }
        
        const jobsSnapshot = await getDocs(jobsQuery);
        console.log(`Found ${jobsSnapshot.docs.length} jobs`);
        
        const jobsData = jobsSnapshot.docs.map((doc) => {
          const data = doc.data() as JobData;
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            location: data.location,
            datePosted: data.datePosted?.toDate() || new Date(),
            createdBy: data.createdBy,
            status: data.status,
            category: data.category,
            budget: data.budget,
          };
        });
        
        setJobs(jobsData);
        setFilteredJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [filter, userId]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredJobs(jobs);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(lowercasedSearch) ||
          job.description.toLowerCase().includes(lowercasedSearch) ||
          job.location.toLowerCase().includes(lowercasedSearch) ||
          (job.category && job.category.toLowerCase().includes(lowercasedSearch))
      );
      setFilteredJobs(filtered);
    }
  }, [searchTerm, jobs]);

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search jobs by title, description, location, or category"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading jobs...</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      <Link to={`/jobs/${job.id}`} className="hover:text-primary">
                        {job.title}
                      </Link>
                    </h2>
                    <div className="flex items-center mb-3 text-sm text-muted-foreground">
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
                          <span>${job.budget}</span>
                        </>
                      )}
                    </div>
                    <p className="line-clamp-3 mb-4">{job.description}</p>
                    <Button asChild size="sm">
                      <Link to={`/jobs/${job.id}`}>View Details</Link>
                    </Button>
                  </div>
                  {filter === "my-jobs" && (
                    <div>
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">No jobs found. {filter === "all" ? "Check back later for new opportunities." : "You haven't posted any jobs yet."}</p>
            {filter === "my-jobs" && (
              <Button asChild>
                <Link to="/jobs/new">Post a Job</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

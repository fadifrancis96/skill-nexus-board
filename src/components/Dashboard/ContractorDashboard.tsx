import { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Job, Offer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ContractorDashboard() {
  const { currentUser } = useAuth();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [myOffers, setMyOffers] = useState<Array<Offer & { jobId: string, jobTitle: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) return;
      
      setLoading(true);
      try {
        // Fetch recent available jobs without orderBy
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "open"),
          limit(5)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsData = jobsSnapshot.docs.map((doc) => {
          const data = doc.data();
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
        
        // Sort jobs manually by date
        const sortedJobs = jobsData.sort((a, b) => 
          b.datePosted.getTime() - a.datePosted.getTime()
        );
        
        setRecentJobs(sortedJobs);
        
        // Fetch all jobs to find my offers
        const allJobsQuery = query(collection(db, "jobs"));
        const allJobsSnapshot = await getDocs(allJobsQuery);
        
        const jobMap = new Map();
        allJobsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          jobMap.set(doc.id, {
            id: doc.id,
            title: data.title,
            status: data.status,
          });
        });
        
        const myOffersPromises = Array.from(jobMap.keys()).map(async (jobId) => {
          const offersQuery = query(
            collection(db, `jobs/${jobId}/offers`),
            where("contractorId", "==", currentUser.uid)
          );
          
          const offersSnapshot = await getDocs(offersQuery);
          
          return offersSnapshot.docs.map((offerDoc) => {
            const offerData = offerDoc.data();
            return {
              id: offerDoc.id,
              jobId,
              jobTitle: jobMap.get(jobId).title,
              contractorId: offerData.contractorId,
              message: offerData.message,
              price: offerData.price,
              status: offerData.status,
              createdAt: offerData.createdAt?.toDate() || new Date(),
              contractorName: offerData.contractorName,
            };
          });
        });
        
        const offersArrays = await Promise.all(myOffersPromises);
        const allOffers = offersArrays.flat();
        
        // Sort offers by date
        const sortedOffers = allOffers.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        
        setMyOffers(sortedOffers);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  const pendingOffers = myOffers.filter(offer => offer.status === 'pending').length;
  const acceptedOffers = myOffers.filter(offer => offer.status === 'accepted').length;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Contractor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Available Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{recentJobs.length}</p>
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
            <CardTitle className="text-xl">Accepted Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">{acceptedOffers}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Recent Jobs</h2>
          <Button variant="outline" asChild>
            <Link to="/jobs">View All Jobs</Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <p>Loading jobs...</p>
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      <Link to={`/jobs/${job.id}`} className="hover:text-primary">
                        {job.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Location: {job.location} • Posted:{" "}
                      {new Date(job.datePosted).toLocaleDateString()}
                      {job.budget && ` • Budget: $${job.budget}`}
                    </p>
                    <p className="line-clamp-2">{job.description}</p>
                    <div className="mt-4">
                      <Button size="sm" asChild>
                        <Link to={`/jobs/${job.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No open jobs available at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">My Recent Offers</h2>
          <Button variant="outline" asChild>
            <Link to="/my-offers">View All My Offers</Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <p>Loading offers...</p>
          </div>
        ) : myOffers.length > 0 ? (
          <div className="space-y-4">
            {myOffers.slice(0, 3).map((offer) => (
              <Card key={`${offer.jobId}-${offer.id}`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        <Link to={`/jobs/${offer.jobId}`} className="hover:text-primary">
                          {offer.jobTitle}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Offered: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                      <p className="line-clamp-2">{offer.message}</p>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-semibold ml-4
                      ${offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        offer.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}
                    `}>
                      {offer.status === 'pending' ? 'Pending' : 
                       offer.status === 'accepted' ? 'Accepted' : 
                       'Rejected'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="mb-4">You haven't made any offers yet.</p>
              <Button asChild>
                <Link to="/jobs">Browse Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

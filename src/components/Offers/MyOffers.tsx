
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Offer } from "@/types";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface JobWithOffer extends Offer {
  jobId: string;
  jobTitle: string;
}

export default function MyOffers() {
  const { currentUserData } = useAuth();
  const [offers, setOffers] = useState<JobWithOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOffers = async () => {
      if (!currentUserData?.id) return;
      
      setLoading(true);
      try {
        // First, get all jobs
        const jobsQuery = query(collection(db, "jobs"));
        const jobsSnapshot = await getDocs(jobsQuery);
        
        const jobMap = new Map();
        jobsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          jobMap.set(doc.id, {
            title: data.title,
            status: data.status,
          });
        });
        
        // Then, for each job, check if there are offers from the current user
        const myOffersPromises = Array.from(jobMap.keys()).map(async (jobId) => {
          const offersQuery = query(
            collection(db, `jobs/${jobId}/offers`),
            where("contractorId", "==", currentUserData.id)
          );
          
          const offersSnapshot = await getDocs(offersQuery);
          
          return offersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              jobId: jobId,
              jobTitle: jobMap.get(jobId).title,
              contractorId: data.contractorId,
              contractorName: data.contractorName || currentUserData.email, // Add missing property
              message: data.message,
              price: data.price,
              status: data.status,
              createdAt: data.createdAt.toDate(),
            };
          });
        });
        
        const offersArrays = await Promise.all(myOffersPromises);
        const allOffers = offersArrays.flat();
        
        // Sort offers by date (newest first)
        allOffers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setOffers(allOffers);
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOffers();
  }, [currentUserData]);

  // Group offers by status
  const acceptedOffers = offers.filter(offer => offer.status === "accepted");
  const pendingOffers = offers.filter(offer => offer.status === "pending");
  const rejectedOffers = offers.filter(offer => offer.status === "rejected");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Offers</h1>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <p>Loading your offers...</p>
        </div>
      ) : offers.length > 0 ? (
        <div className="space-y-8">
          {/* Accepted Offers */}
          {acceptedOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Accepted Offers ({acceptedOffers.length})
              </h2>
              <div className="space-y-4">
                {acceptedOffers.map((offer) => (
                  <Card key={`${offer.jobId}-${offer.id}`} className="border-green-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold mb-1">
                            <Link to={`/jobs/${offer.jobId}`} className="hover:text-primary">
                              {offer.jobTitle}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your Offer: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                          <p className="line-clamp-2">{offer.message}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-4"
                            asChild
                          >
                            <Link to={`/jobs/${offer.jobId}`}>View Job</Link>
                          </Button>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Accepted
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Pending Offers */}
          {pendingOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Pending Offers ({pendingOffers.length})
              </h2>
              <div className="space-y-4">
                {pendingOffers.map((offer) => (
                  <Card key={`${offer.jobId}-${offer.id}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold mb-1">
                            <Link to={`/jobs/${offer.jobId}`} className="hover:text-primary">
                              {offer.jobTitle}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your Offer: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                          <p className="line-clamp-2">{offer.message}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-4"
                            asChild
                          >
                            <Link to={`/jobs/${offer.jobId}`}>View Job</Link>
                          </Button>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Rejected Offers */}
          {rejectedOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                Rejected Offers ({rejectedOffers.length})
              </h2>
              <div className="space-y-4">
                {rejectedOffers.map((offer) => (
                  <Card key={`${offer.jobId}-${offer.id}`} className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold mb-1">
                            <Link to={`/jobs/${offer.jobId}`} className="hover:text-primary">
                              {offer.jobTitle}
                            </Link>
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your Offer: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                          <p className="line-clamp-2">{offer.message}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-4"
                            asChild
                          >
                            <Link to={`/jobs/${offer.jobId}`}>View Job</Link>
                          </Button>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">You haven't submitted any offers yet.</p>
            <Button asChild>
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

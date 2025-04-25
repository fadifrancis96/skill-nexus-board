
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, getDocs, doc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job, Offer } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function OfferList() {
  const { id: jobId } = useParams<{ id: string }>();
  const { currentUserData } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobAndOffers = async () => {
      if (!jobId) return;
      
      setLoading(true);
      try {
        // Fetch job
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        
        if (!jobDoc.exists()) {
          toast({
            title: "Error",
            description: "Job not found",
            variant: "destructive",
          });
          navigate("/jobs");
          return;
        }
        
        const jobData = jobDoc.data();
        
        // Check if user is the job owner
        if (currentUserData?.id !== jobData.createdBy) {
          toast({
            title: "Unauthorized",
            description: "You don't have permission to view these offers",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
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
        
        // Fetch offers
        const offersQuery = query(collection(db, `jobs/${jobId}/offers`));
        const offersSnapshot = await getDocs(offersQuery);
        
        const offersData = offersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            jobId: jobId, // Add the missing jobId property
            contractorId: data.contractorId,
            contractorName: data.contractorName,
            message: data.message,
            price: data.price,
            status: data.status,
            createdAt: data.createdAt.toDate(),
          };
        });
        
        // Sort offers by date (newest first)
        offersData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setOffers(offersData);
      } catch (error) {
        console.error("Error fetching job and offers:", error);
        toast({
          title: "Error",
          description: "Failed to load offers",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobAndOffers();
  }, [jobId, currentUserData, navigate]);

  const handleAcceptOffer = async (offerId: string) => {
    if (!jobId || !job) return;
    
    setAcceptingOfferId(offerId);
    
    try {
      await runTransaction(db, async (transaction) => {
        // Update all offers to rejected except the accepted one
        const offersQuery = query(collection(db, `jobs/${jobId}/offers`));
        const offersSnapshot = await getDocs(offersQuery);
        
        offersSnapshot.docs.forEach((offerDoc) => {
          if (offerDoc.id === offerId) {
            transaction.update(offerDoc.ref, { status: "accepted" });
          } else {
            transaction.update(offerDoc.ref, { status: "rejected" });
          }
        });
        
        // Update job status to in_progress
        const jobRef = doc(db, "jobs", jobId);
        transaction.update(jobRef, { status: "in_progress" });
      });
      
      // Update local state
      setOffers(offers.map(offer => ({
        ...offer,
        status: offer.id === offerId ? "accepted" : "rejected"
      })));
      
      setJob(job ? { ...job, status: "in_progress" } : null);
      
      toast({
        title: "Offer accepted",
        description: "The job status has been updated to In Progress",
      });
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive",
      });
    } finally {
      setAcceptingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p>Loading offers...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const pendingOffers = offers.filter(offer => offer.status === "pending");
  const acceptedOffer = offers.find(offer => offer.status === "accepted");
  const rejectedOffers = offers.filter(offer => offer.status === "rejected");
  
  return (
    <div>
      <div className="mb-6">
        <Link to={`/jobs/${jobId}`} className="text-primary hover:underline">
          &larr; Back to Job
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Offers for "{job.title}"</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Job Status: 
          <span
            className={`
              ml-2 px-3 py-1 rounded-full text-xs font-semibold
              ${job.status === 'open' ? 'bg-green-100 text-green-800' : 
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'}
            `}
          >
            {job.status === 'open' ? 'Open' : 
             job.status === 'in_progress' ? 'In Progress' : 
             'Completed'}
          </span>
        </p>
      </div>
      
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No offers have been submitted for this job yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Accepted Offer */}
          {acceptedOffer && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Accepted Offer
              </h2>
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold mb-1">{acceptedOffer.contractorName}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Offered: ${acceptedOffer.price} • Submitted: {new Date(acceptedOffer.createdAt).toLocaleDateString()}
                      </p>
                      <p className="whitespace-pre-line">{acceptedOffer.message}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Accepted
                    </span>
                  </div>
                </CardContent>
              </Card>
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
                  <Card key={offer.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold mb-1">{offer.contractorName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Offered: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                          <p className="whitespace-pre-line mb-4">{offer.message}</p>
                          {job.status === "open" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm"
                                  disabled={!!acceptingOfferId}
                                >
                                  {acceptingOfferId === offer.id ? "Accepting..." : "Accept Offer"}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reject all other offers and change the job status to "In Progress".
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleAcceptOffer(offer.id)}
                                  >
                                    Accept Offer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
                  <Card key={offer.id} className="bg-gray-50">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold mb-1">{offer.contractorName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Offered: ${offer.price} • Submitted: {new Date(offer.createdAt).toLocaleDateString()}
                          </p>
                          <p className="whitespace-pre-line">{offer.message}</p>
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
      )}
    </div>
  );
}


import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ContractorProfile, CompletedJob } from "@/types";
import AppLayout from "@/components/Layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

export default function ContractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractorProfile = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch contractor profile
        const profileDoc = await getDoc(doc(db, "contractorProfiles", id));
        
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as ContractorProfile);
        } else {
          // If no dedicated profile exists yet, try to get basic user info
          const userDoc = await getDoc(doc(db, "users", id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile({
              userId: userDoc.id,
              displayName: userData.displayName || "Unnamed Contractor",
              bio: "This contractor hasn't created a profile yet.",
              skills: [],
              completedJobsCount: 0
            });
          }
        }

        // Fetch completed jobs
        const jobsQuery = query(
          collection(db, "completedJobs"),
          where("contractorId", "==", id)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedDate: doc.data().completedDate.toDate()
        } as CompletedJob));
        
        setCompletedJobs(jobsList);
      } catch (error) {
        console.error("Error fetching contractor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractorProfile();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-8">
          <p>Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Link to="/jobs" className="text-primary hover:underline mb-6 block">
          &larr; Back to Jobs
        </Link>

        {profile ? (
          <div className="space-y-8">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.profilePicture} />
                      <AvatarFallback className="text-2xl">
                        {profile.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                      {profile.rating && (
                        <div className="flex items-center text-yellow-500 mt-1">
                          {Array(5).fill(0).map((_, i) => (
                            <span key={i} className={i < Math.round(profile.rating || 0) ? "text-yellow-500" : "text-gray-300"}>
                              ★
                            </span>
                          ))}
                          <span className="ml-1 text-gray-600">({profile.rating})</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700">{profile.bio}</p>
                    
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-col space-y-1 text-sm">
                      <p>Completed Jobs: {profile.completedJobsCount}</p>
                      {profile.contactEmail && <p>Email: {profile.contactEmail}</p>}
                      {profile.phone && <p>Phone: {profile.phone}</p>}
                      {profile.website && (
                        <p>
                          Website: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {profile.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completed Jobs */}
            <div>
              <h2 className="text-xl font-bold mb-4">Completed Projects</h2>
              
              {completedJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    No completed projects to show yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {completedJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                        
                        {job.category && (
                          <Badge variant="outline" className="mb-2">{job.category}</Badge>
                        )}
                        
                        <p className="text-gray-500 text-sm mb-4">
                          Completed: {job.completedDate.toLocaleDateString()}
                          {job.clientName && <> • Client: {job.clientName}</>}
                        </p>
                        
                        <p className="mb-4">{job.description}</p>
                        
                        {job.images && job.images.length > 0 && (
                          <Carousel className="w-full">
                            <CarouselContent>
                              {job.images.map((image, index) => (
                                <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                                  <div className="p-1">
                                    <div className="overflow-hidden rounded-lg">
                                      <img
                                        src={image}
                                        alt={`Project image ${index + 1}`}
                                        className="object-cover w-full h-48 hover:scale-105 transition-transform duration-300"
                                      />
                                    </div>
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </Carousel>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Contractor profile not found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import OfferForm from "@/components/Offers/OfferForm";
import { Separator } from "@/components/ui/separator";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from "lucide-react";

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, currentUserData } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [jobPosterName, setJobPosterName] = useState<string>("");
  const [mapApiKey, setMapApiKey] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's an API key in localStorage
    const storedKey = localStorage.getItem('mapbox_key');
    if (storedKey) {
      setMapApiKey(storedKey);
    }
  }, []);

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
            address: jobData.address,
            latitude: jobData.latitude,
            longitude: jobData.longitude,
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

  useEffect(() => {
    if (!job || !job.latitude || !job.longitude || !mapContainer.current) {
      return;
    }

    // Initialize map if it doesn't exist
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([job.latitude, job.longitude], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.current);
      
      // Add marker
      L.marker([job.latitude, job.longitude], {
        icon: L.divIcon({
          className: 'bg-primary rounded-full w-4 h-4 -ml-2 -mt-2',
          iconSize: [16, 16],
        })
      }).addTo(map.current);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [job]);

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
  const hasLocation = job.latitude && job.longitude;

  return (
    <div>
      <div className="mb-6">
        <Link to="/jobs" className="text-primary hover:underline">
          &larr; Back to Jobs
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

          {hasLocation && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <MapPin className="mr-2" />
                Job Location
              </h2>
              {job.address && (
                <p className="mb-4">{job.address}</p>
              )}
              <div className="h-[300px] w-full rounded-lg overflow-hidden" ref={mapContainer} />
            </div>
          )}
          
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

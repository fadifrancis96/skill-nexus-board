
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types";
import AppLayout from "@/components/Layout/AppLayout";
import MapView from "@/components/Jobs/MapView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "@/components/Jobs/JobList";

export default function JobMapPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "open")
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsData = jobsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            description: data.description,
            location: data.location,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            datePosted: data.datePosted?.toDate() || new Date(),
            createdBy: data.createdBy,
            status: data.status,
            category: data.category,
            budget: data.budget,
          };
        });
        
        setJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Find Jobs Near You</h1>
        
        <Tabs defaultValue="map" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map">
            {loading ? (
              <div className="flex justify-center py-8">
                <p>Loading job locations...</p>
              </div>
            ) : (
              <MapView jobs={jobs} />
            )}
          </TabsContent>
          
          <TabsContent value="list">
            <JobList filter="all" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

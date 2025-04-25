
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters long",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters long",
  }),
  location: z.string().min(2, {
    message: "Location is required",
  }),
  address: z.string().min(5, {
    message: "Full address is required for accurate mapping",
  }),
  budget: z.string().optional(),
  category: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function JobForm() {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      address: "",
      budget: "",
      category: "",
    },
  });

  const watchAddress = form.watch("address");

  useEffect(() => {
    // Geocode the address when it changes
    const geocodeAddress = async () => {
      if (!watchAddress || watchAddress.length < 5) {
        setCoordinates(null);
        setGeocodingError(null);
        return;
      }

      try {
        // Get mapbox token from localStorage
        const mapboxToken = localStorage.getItem('mapbox_key');
        
        if (!mapboxToken) {
          setGeocodingError("Mapbox API key is missing. Please add it in the map view.");
          return;
        }
        
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            watchAddress
          )}.json?access_token=${mapboxToken}&limit=1`
        );

        if (!response.ok) {
          throw new Error("Geocoding failed");
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCoordinates({ lat, lng });
          setGeocodingError(null);
        } else {
          setGeocodingError("Could not find coordinates for this address");
          setCoordinates(null);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setGeocodingError("Error finding location. Please check your address.");
        setCoordinates(null);
      }
    };

    // Debounce the geocoding to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (watchAddress) {
        geocodeAddress();
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [watchAddress]);

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job",
        variant: "destructive",
      });
      return;
    }

    if (!coordinates) {
      toast({
        title: "Error",
        description: "Please enter a valid address for mapping",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log("Starting job creation process");

    try {
      const userId = currentUser.uid;
      console.log("Current user ID:", userId);
      
      toast({
        title: "Creating job",
        description: "Saving your job posting...",
      });
      
      console.log("Creating job document in Firestore");
      const jobData = {
        title: data.title,
        description: data.description,
        location: data.location,
        address: data.address,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        budget: data.budget ? parseFloat(data.budget) : null,
        category: data.category || null,
        datePosted: new Date(),
        createdBy: userId,
        status: "open",
      };
      
      console.log("Job data to be saved:", jobData);
      
      const docRef = await addDoc(collection(db, "jobs"), jobData);
      console.log("Job created with ID:", docRef.id);

      toast({
        title: "Job created",
        description: "Your job has been posted successfully",
      });
      
      navigate("/my-jobs");
    } catch (error: any) {
      console.error("Error creating job:", error);
      const errorMessage = error.message || "Failed to create job";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Website Redesign, Logo Design" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the job in detail. Include requirements, deliverables, and timeline." 
                    className="h-32"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Remote, New York, London"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="e.g., 500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Address (for Map)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 123 Main St, New York, NY 10001"
                    {...field} 
                  />
                </FormControl>
                {geocodingError && (
                  <p className="text-sm text-red-500">{geocodingError}</p>
                )}
                {coordinates && (
                  <p className="text-xs text-green-600">
                    ✓ Location found and will be displayed on the map
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Post Job"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

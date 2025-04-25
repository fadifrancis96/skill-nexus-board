
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Image, Upload } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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
  budget: z.string().optional(),
  category: z.string().optional(),
  photos: z
    .custom<FileList>()
    .transform((files) => files as FileList)
    .refine((files) => files?.length <= 3, "Maximum of 3 photos allowed")
    .refine(
      (files) => {
        if (files.length === 0) return true;
        return Array.from(files).every(
          (file) => file.size <= MAX_FILE_SIZE
        );
      },
      `Each file size should be less than 5MB`
    )
    .refine(
      (files) => {
        if (files.length === 0) return true;
        return Array.from(files).every((file) =>
          ACCEPTED_IMAGE_TYPES.includes(file.type)
        );
      },
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    )
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function JobForm() {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      budget: "",
      category: "",
    },
  });

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    const storage = getStorage();
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `jobs/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    
    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post a job",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = currentUser.uid;
      const photoUrls = await uploadPhotos(selectedFiles);

      await addDoc(collection(db, "jobs"), {
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget ? parseFloat(data.budget) : null,
        category: data.category || null,
        photos: photoUrls,
        datePosted: new Date(),
        createdBy: userId,
        status: "open",
      });

      toast({
        title: "Job created",
        description: "Your job has been posted successfully",
      });
      
      navigate("/my-jobs");
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (fileArray.length > 3) {
      toast({
        title: "Error",
        description: "Maximum 3 photos allowed",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFiles(fileArray);
    form.setValue("photos", files);
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
                  <FormLabel>Location</FormLabel>
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
            name="photos"
            render={() => (
              <FormItem>
                <FormLabel>Attach Photos (Optional)</FormLabel>
                <FormControl>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      <Upload className="text-gray-500" />
                    </div>
                    {selectedFiles.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Image className="w-4 h-4" />
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Maximum 3 photos, each less than 5MB. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                </FormControl>
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

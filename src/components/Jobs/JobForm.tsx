
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
import { Image, Upload, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  const uploadSinglePhoto = async (file: File, index: number, totalFiles: number): Promise<string> => {
    try {
      const storage = getStorage();
      const fileExtension = file.name.split('.').pop();
      const fileName = `job_${Date.now()}_${index}.${fileExtension}`;
      
      // Use a simpler storage path with less special characters
      const storageRef = ref(storage, `jobs/${fileName}`);
      
      console.log(`Starting upload of file: ${fileName}`);
      await uploadBytes(storageRef, file);
      console.log(`File uploaded, getting download URL for: ${fileName}`);
      
      const url = await getDownloadURL(storageRef);
      console.log(`Successfully got URL for file: ${fileName}`);
      
      setUploadProgress(Math.round(((index + 1) / totalFiles) * 100));
      
      return url;
    } catch (error: any) {
      console.error(`Error uploading file ${file.name}:`, error);
      throw new Error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
    }
  };

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    if (!files.length) {
      return [];
    }
    
    setUploadProgress(0);
    setUploadError(null);
    console.log(`Starting upload of ${files.length} photos`);
    
    const urls: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadSinglePhoto(files[i], i, files.length);
        urls.push(url);
      }
      
      return urls;
    } catch (error: any) {
      setUploadError(`Upload failed: ${error.message}`);
      throw error;
    }
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
    setUploadProgress(0);
    setUploadError(null);
    console.log("Starting job creation process");

    try {
      const userId = currentUser.uid;
      console.log("Current user ID:", userId);
      
      // Upload photos if any
      console.log("Selected files count:", selectedFiles.length);
      let photoUrls: string[] = [];
      
      if (selectedFiles.length > 0) {
        try {
          toast({
            title: "Uploading photos",
            description: "Please wait while we upload your photos",
          });
          
          photoUrls = await uploadPhotos(selectedFiles);
          console.log("Photo URLs after upload:", photoUrls);
          
          if (photoUrls.length > 0) {
            toast({
              title: "Photos uploaded",
              description: `Successfully uploaded ${photoUrls.length} photos`,
            });
          }
        } catch (uploadError: any) {
          console.error("Error during photo upload:", uploadError);
          toast({
            title: "Upload Error",
            description: uploadError.message || "Failed to upload one or more photos",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create job document
      toast({
        title: "Creating job",
        description: "Saving your job posting...",
      });
      
      console.log("Creating job document in Firestore");
      const jobData = {
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget ? parseFloat(data.budget) : null,
        category: data.category || null,
        photos: photoUrls,
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
      let errorMessage = "Failed to create job";
      
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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
    
    console.log("Files selected:", fileArray.map(f => `${f.name} (${f.size} bytes)`));
    setSelectedFiles(fileArray);
    form.setValue("photos", files);
    setUploadError(null);
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    // Create a new DataTransfer
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => {
      dataTransfer.items.add(file);
    });
    
    // Update the form value
    form.setValue("photos", dataTransfer.files);
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
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {selectedFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                          >
                            <Image className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeFile(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </button>
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
          
          {uploadError && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {uploadProgress > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploading photos: {uploadProgress}%</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
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

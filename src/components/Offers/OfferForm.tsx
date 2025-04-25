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
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Image, Upload } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  price: z.string().min(1, {
    message: "Please enter your price",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters long",
  }),
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

interface OfferFormProps {
  jobId: string;
}

export default function OfferForm({ jobId }: OfferFormProps) {
  const { currentUser, currentUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: "",
      message: "",
    },
  });

  useState(() => {
    const checkExistingOffers = async () => {
      if (!currentUser) return;
      
      try {
        const offersQuery = query(
          collection(db, `jobs/${jobId}/offers`),
          where("contractorId", "==", currentUser.uid)
        );
        
        const offersSnapshot = await getDocs(offersQuery);
        
        if (!offersSnapshot.empty) {
          setHasSubmittedBefore(true);
          toast({
            title: "You've already submitted an offer",
            description: "You can only submit one offer per job",
          });
        }
      } catch (error) {
        console.error("Error checking existing offers:", error);
      }
    };
    
    checkExistingOffers();
  });

  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    
    const storage = getStorage();
    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `offers/${jobId}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    
    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: FormData) => {
    if (!currentUser || !currentUserData) {
      toast({
        title: "Error",
        description: "You must be logged in to submit an offer",
        variant: "destructive",
      });
      return;
    }

    if (currentUserData.role !== "contractor") {
      toast({
        title: "Error",
        description: "Only contractors can submit offers",
        variant: "destructive",
      });
      return;
    }

    if (hasSubmittedBefore) {
      toast({
        title: "Error",
        description: "You've already submitted an offer for this job",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const photoUrls = await uploadPhotos(selectedFiles);

      await addDoc(collection(db, `jobs/${jobId}/offers`), {
        contractorId: currentUser.uid,
        contractorName: currentUserData.displayName || currentUserData.email,
        message: data.message,
        price: parseFloat(data.price),
        status: "pending",
        createdAt: new Date(),
        photos: photoUrls,
      });

      toast({
        title: "Offer submitted",
        description: "Your offer has been submitted successfully",
      });
      
      form.reset();
      setSelectedFiles([]);
      setHasSubmittedBefore(true);
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast({
        title: "Error",
        description: "Failed to submit offer",
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

  if (hasSubmittedBefore) {
    return (
      <div className="text-center py-4">
        <p className="font-medium text-primary">
          You have already submitted an offer for this job.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Price ($)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  placeholder="Enter your price"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message to Client</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Explain why you're a good fit for this job, your experience, and any questions you have."
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
          {isSubmitting ? "Submitting..." : "Submit Offer"}
        </Button>
      </form>
    </Form>
  );
}


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
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  price: z.string().min(1, {
    message: "Please enter your price",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters long",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface OfferFormProps {
  jobId: string;
}

export default function OfferForm({ jobId }: OfferFormProps) {
  const { currentUser, currentUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedBefore, setHasSubmittedBefore] = useState(false);

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
      await addDoc(collection(db, `jobs/${jobId}/offers`), {
        contractorId: currentUser.uid,
        contractorName: currentUserData.displayName || currentUserData.email,
        message: data.message,
        price: parseFloat(data.price),
        status: "pending",
        createdAt: new Date(),
      });

      toast({
        title: "Offer submitted",
        description: "Your offer has been submitted successfully",
      });
      
      form.reset();
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

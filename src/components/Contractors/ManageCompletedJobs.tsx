
import { useState } from "react";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CompletedJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { toast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Pencil, Trash2, ImagePlus } from "lucide-react";

interface ManageCompletedJobsProps {
  completedJobs: CompletedJob[];
  setCompletedJobs: React.Dispatch<React.SetStateAction<CompletedJob[]>>;
}

export default function ManageCompletedJobs({ completedJobs, setCompletedJobs }: ManageCompletedJobsProps) {
  const { currentUser } = useAuth();
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobClientName, setJobClientName] = useState("");
  const [jobCompletedDate, setJobCompletedDate] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const resetForm = () => {
    setJobTitle("");
    setJobDescription("");
    setJobCategory("");
    setJobClientName("");
    setJobCompletedDate("");
    setSelectedImages([]);
    setIsAddingJob(false);
    setEditingJobId(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddOrUpdateJob = async () => {
    if (!currentUser) return;

    if (!jobTitle || !jobDescription || !jobCompletedDate) {
      toast({ 
        title: "Missing information", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setUploading(true);
      const imageUrls: string[] = [];
      
      // Upload new images if any
      for (const image of selectedImages) {
        const imageRef = ref(storage, `completed-jobs/${currentUser.uid}/${Date.now()}-${image.name}`);
        await uploadBytes(imageRef, image);
        const url = await getDownloadURL(imageRef);
        imageUrls.push(url);
      }

      if (editingJobId) {
        // Update existing job
        const jobToUpdate = completedJobs.find(job => job.id === editingJobId);
        if (jobToUpdate) {
          const updatedJob: CompletedJob = {
            ...jobToUpdate,
            title: jobTitle,
            description: jobDescription,
            completedDate: new Date(jobCompletedDate),
            clientName: jobClientName || undefined,
            category: jobCategory || undefined,
            images: [...jobToUpdate.images, ...imageUrls]
          };

          await updateDoc(doc(db, "completedJobs", editingJobId), {
            title: updatedJob.title,
            description: updatedJob.description,
            completedDate: updatedJob.completedDate,
            clientName: updatedJob.clientName || null,
            category: updatedJob.category || null,
            images: updatedJob.images
          });

          // Update state
          setCompletedJobs(prev => 
            prev.map(job => job.id === editingJobId ? updatedJob : job)
          );

          toast({ title: "Success", description: "Project updated successfully" });
        }
      } else {
        // Add new job
        const newJob: Omit<CompletedJob, 'id'> = {
          contractorId: currentUser.uid,
          title: jobTitle,
          description: jobDescription,
          completedDate: new Date(jobCompletedDate),
          clientName: jobClientName || undefined,
          category: jobCategory || undefined,
          images: imageUrls
        };

        const docRef = await addDoc(collection(db, "completedJobs"), newJob);

        // Update state with the new job including its ID
        setCompletedJobs(prev => [...prev, { id: docRef.id, ...newJob }]);
        
        toast({ title: "Success", description: "New project added successfully" });
      }

      resetForm();
    } catch (error) {
      console.error("Error saving completed job:", error);
      toast({ 
        title: "Error", 
        description: "Failed to save project", 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditJob = (job: CompletedJob) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobDescription(job.description);
    setJobCategory(job.category || "");
    setJobClientName(job.clientName || "");
    setJobCompletedDate(job.completedDate.toISOString().split('T')[0]);
    setSelectedImages([]);
  };

  const handleDeleteJob = async () => {
    if (!currentUser || !deletingJobId) return;
    
    try {
      const jobToDelete = completedJobs.find(job => job.id === deletingJobId);
      
      if (jobToDelete) {
        // Delete images from storage
        for (const imageUrl of jobToDelete.images) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting image:", error);
            // Continue with deletion even if some images fail to delete
          }
        }
        
        // Delete the job document
        await deleteDoc(doc(db, "completedJobs", deletingJobId));
        
        // Update state
        setCompletedJobs(prev => prev.filter(job => job.id !== deletingJobId));
        
        toast({ title: "Success", description: "Project deleted successfully" });
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({ 
        title: "Error", 
        description: "Failed to delete project", 
        variant: "destructive" 
      });
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Completed Projects</h2>
        <Dialog open={isAddingJob} onOpenChange={setIsAddingJob}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90" size="lg">
              <ImagePlus className="mr-2 h-4 w-4" /> Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Completed Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="job-title">Project Title*</Label>
                <Input
                  id="job-title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job-description">Description*</Label>
                <Textarea
                  id="job-description"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-24"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job-category">Category</Label>
                  <Input
                    id="job-category"
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="job-client">Client Name</Label>
                  <Input
                    id="job-client"
                    value={jobClientName}
                    onChange={(e) => setJobClientName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="job-date">Completion Date*</Label>
                <Input
                  id="job-date"
                  type="date"
                  value={jobCompletedDate}
                  onChange={(e) => setJobCompletedDate(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job-images">Images</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="job-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="flex-1"
                  />
                  <ImagePlus className="h-5 w-5" />
                </div>
              </div>
              
              {/* Display selected images for upload */}
              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <Label>Selected Images ({selectedImages.length})</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Selected ${index}`}
                          className="h-20 w-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddOrUpdateJob} disabled={uploading}>
                {uploading ? "Saving..." : "Save Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {completedJobs.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="p-12 text-center">
            <ImagePlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">Showcase your work by adding completed projects with images</p>
            <Button onClick={() => setIsAddingJob(true)}>
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {completedJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                      {job.completedDate.toLocaleDateString()}
                      {job.category && <> • {job.category}</>}
                      {job.clientName && <> • Client: {job.clientName}</>}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleEditJob(job)}>
                          <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Project</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {/* Same form fields as add project */}
                          <div>
                            <Label htmlFor="edit-job-title">Project Title*</Label>
                            <Input
                              id="edit-job-title"
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-job-description">Description*</Label>
                            <Textarea
                              id="edit-job-description"
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              className="h-24"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="edit-job-category">Category</Label>
                              <Input
                                id="edit-job-category"
                                value={jobCategory}
                                onChange={(e) => setJobCategory(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="edit-job-client">Client Name</Label>
                              <Input
                                id="edit-job-client"
                                value={jobClientName}
                                onChange={(e) => setJobClientName(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-job-date">Completion Date*</Label>
                            <Input
                              id="edit-job-date"
                              type="date"
                              value={jobCompletedDate}
                              onChange={(e) => setJobCompletedDate(e.target.value)}
                              required
                            />
                          </div>
                          
                          {/* Existing images */}
                          {job.images.length > 0 && (
                            <div>
                              <Label>Existing Images</Label>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                {job.images.map((image, index) => (
                                  <div key={index} className="relative h-20">
                                    <img
                                      src={image}
                                      alt={`Project ${index}`}
                                      className="h-full w-full object-cover rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Add more images */}
                          <div>
                            <Label htmlFor="edit-job-images">Add More Images</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="edit-job-images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageSelect}
                                className="flex-1"
                              />
                              <ImagePlus className="h-5 w-5" />
                            </div>
                          </div>
                          
                          {/* Display newly selected images */}
                          {selectedImages.length > 0 && (
                            <div>
                              <Label>New Images ({selectedImages.length})</Label>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                {selectedImages.map((image, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`New ${index}`}
                                      className="h-20 w-full object-cover rounded"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(index)}
                                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="mt-6">
                          <DialogClose asChild>
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleAddOrUpdateJob} disabled={uploading}>
                            {uploading ? "Saving..." : "Update Project"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this project and all associated images.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              setDeletingJobId(job.id);
                              handleDeleteJob();
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <p className="mb-4">{job.description}</p>
                
                {job.images.length > 0 && (
                  <Carousel>
                    <CarouselContent>
                      {job.images.map((image, index) => (
                        <CarouselItem key={index} className="basis-full md:basis-1/2 lg:basis-1/3">
                          <img
                            src={image}
                            alt={`Project image ${index + 1}`}
                            className="object-cover w-full h-48 rounded-md"
                          />
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
  );
}

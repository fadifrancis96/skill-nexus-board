
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ContractorProfile, CompletedJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import ManageCompletedJobs from "./ManageCompletedJobs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Maximum file size: 1MB for Base64 (lower than Firebase Storage since we're storing in Firestore)
const MAX_FILE_SIZE = 1 * 1024 * 1024;
// Maximum dimensions for resizing
const MAX_IMAGE_DIMENSION = 500;

export default function ManageProfile() {
  const { currentUser, currentUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ContractorProfile>({
    userId: '',
    displayName: '',
    bio: '',
    skills: [],
    completedJobsCount: 0,
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // Try to get existing profile
        const profileDoc = await getDoc(doc(db, "contractorProfiles", currentUser.uid));
        
        if (profileDoc.exists()) {
          const profileData = profileDoc.data() as ContractorProfile;
          setProfile(profileData);
          if (profileData.profilePicture) {
            setProfileImagePreview(profileData.profilePicture);
          }
        } else {
          // Initialize with user data
          setProfile({
            userId: currentUser.uid,
            displayName: currentUserData?.displayName || '',
            bio: '',
            skills: [],
            completedJobsCount: 0,
            contactEmail: currentUser.email || undefined
          });
        }

        // Get completed jobs
        const jobsQuery = query(
          collection(db, "completedJobs"),
          where("contractorId", "==", currentUser.uid)
        );
        
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completedDate: doc.data().completedDate.toDate()
        } as CompletedJob));
        
        setCompletedJobs(jobsList);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, currentUserData]);

  // Process image to base64 and resize if needed
  const processImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
      
      setIsProcessing(true);
      setUploadProgress(0);

      console.log("Starting image processing...");
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onloadstart = () => {
        setUploadProgress(10);
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 50); // 50% for reading
          setUploadProgress(progress);
        }
      };
      
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setIsProcessing(false);
        reject(new Error("Failed to read file"));
      };
      
      reader.onload = async () => {
        setUploadProgress(60);
        try {
          const loadedImage = reader.result as string;
          console.log("Image loaded, now resizing if needed...");
          
          // Create an image element to get dimensions
          const img = new Image();
          img.onload = () => {
            setUploadProgress(70);
            
            let width = img.width;
            let height = img.height;
            let needsResize = false;
            
            // Check if image needs resizing
            if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
              needsResize = true;
              if (width > height) {
                height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
                width = MAX_IMAGE_DIMENSION;
              } else {
                width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
                height = MAX_IMAGE_DIMENSION;
              }
              console.log(`Resizing image to: ${width}x${height}`);
            }
            
            setUploadProgress(80);
            
            if (needsResize) {
              // Create canvas to resize the image
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              
              // Draw and resize image on canvas
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                setIsProcessing(false);
                reject(new Error("Could not get canvas context for resizing"));
                return;
              }
              
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert canvas to base64 with reduced quality
              const resizedImage = canvas.toDataURL("image/jpeg", 0.7);
              setUploadProgress(100);
              setIsProcessing(false);
              resolve(resizedImage);
            } else {
              // No need to resize, just use the original (but maybe compress)
              setUploadProgress(100);
              setIsProcessing(false);
              resolve(loadedImage);
            }
          };
          
          img.onerror = () => {
            console.error("Error loading image for resizing");
            setIsProcessing(false);
            reject(new Error("Failed to load image for processing"));
          };
          
          img.src = loadedImage;
          
        } catch (error) {
          console.error("Error processing image:", error);
          setIsProcessing(false);
          reject(error);
        }
      };
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    
    try {
      // Prepare the profile update object first
      const updatedProfile: ContractorProfile = {
        ...profile,
        completedJobsCount: completedJobs.length
      };

      // Only attempt to process image if one was selected
      if (profileImage) {
        try {
          // Check file size
          if (profileImage.size > MAX_FILE_SIZE) {
            throw new Error("Image file size must be less than 1MB");
          }
          
          toast({
            title: "Processing image...",
            description: "Please wait while we process your profile image"
          });
          
          console.log("Starting profile image processing");
          
          // Process and get base64 image
          const base64Image = await processImageToBase64(profileImage);
          
          // Update profile with the base64 image
          updatedProfile.profilePicture = base64Image;
          console.log("Profile image processed successfully");
          
          toast({
            title: "Image processed",
            description: "Your profile image was processed successfully"
          });
        } catch (uploadError: any) {
          console.error("Error processing profile image:", uploadError);
          toast({
            title: "Error",
            description: uploadError.message || "Failed to process profile image",
            variant: "destructive",
          });
          
          // Continue with profile update without the image
        }
      }

      console.log("Saving profile to Firestore...");
      // Save to Firestore
      await setDoc(doc(db, "contractorProfiles", currentUser.uid), updatedProfile);
      
      // Update local state with the saved data
      setProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });

      console.log("Profile updated successfully", updatedProfile);
      
      // Clear the file input after successful update
      setProfileImage(null);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      // Always reset saving state, even if there's an error
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skillInput.trim()]
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (1MB limit for base64 approach)
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "Image file size must be less than 1MB",
          variant: "destructive",
        });
        return;
      }
      
      setProfileImage(selectedFile);
      
      // Clean up previous preview URL to prevent memory leaks
      if (profileImagePreview && !profile.profilePicture) {
        URL.revokeObjectURL(profileImagePreview);
      }
      
      // Create a preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setProfileImagePreview(previewUrl);
      
      console.log("New image selected for preview");
    }
  };

  // Reset the file input
  const handleClearImage = () => {
    if (profileImagePreview && !profile.profilePicture) {
      URL.revokeObjectURL(profileImagePreview);
    }
    setProfileImage(null);
    setProfileImagePreview(profile.profilePicture || null);
    setUploadProgress(0);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (profileImagePreview && !profile.profilePicture) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview, profile.profilePicture]);

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  if (currentUserData?.role !== 'contractor') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Only contractor accounts can manage profiles.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Manage Your Profile</h1>
      
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="projects">Completed Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-center md:flex-row md:space-x-4 mb-6">
                    <div className="mb-4 md:mb-0">
                      <Avatar className="h-24 w-24">
                        <AvatarImage 
                          src={profileImagePreview || undefined}
                          alt={profile.displayName}
                        />
                        <AvatarFallback className="text-2xl">
                          {profile.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="profile-image">Profile Picture</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="flex-1"
                          disabled={isProcessing}
                        />
                        {profileImage && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClearImage}
                            size="sm"
                            disabled={isProcessing}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {isProcessing && (
                        <div className="mt-2 space-y-1">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Processing: {Math.round(uploadProgress)}%</p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Maximum file size: 1MB
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({...profile, displayName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      className="h-24"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={profile.contactEmail || ''}
                      onChange={(e) => setProfile({...profile, contactEmail: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label>Skills</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.skills.map((skill, index) => (
                        <div key={index} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-secondary-foreground hover:text-primary"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add skill..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddSkill}>Add</Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={saving || isProcessing} 
                  className="w-full sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="projects">
          <ManageCompletedJobs 
            completedJobs={completedJobs}
            setCompletedJobs={setCompletedJobs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

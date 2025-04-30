
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
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

// Maximum file size: 5MB for Firebase Storage
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
  const [isUploading, setIsUploading] = useState(false);

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

  // Upload image to Firebase Storage with progress monitoring
  const uploadImageToStorage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!currentUser?.uid) {
        reject(new Error("User not authenticated"));
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a storage reference
      const storageRef = ref(storage, `profile-images/${currentUser.uid}`);
      
      // Create the file metadata including the content type
      const metadata = {
        contentType: file.type,
      };
      
      // Upload the file and metadata
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      // Listen for state changes, errors, and completion of the upload
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          // Upload failed
          console.error("Error uploading image:", error);
          setIsUploading(false);
          reject(error);
        },
        () => {
          // Upload completed successfully, get the download URL
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            setIsUploading(false);
            resolve(downloadURL);
          }).catch((error) => {
            console.error("Error getting download URL:", error);
            setIsUploading(false);
            reject(error);
          });
        }
      );
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

      // Only attempt to upload image if one was selected
      if (profileImage) {
        try {
          // Check file size
          if (profileImage.size > MAX_FILE_SIZE) {
            throw new Error("Image file size must be less than 5MB");
          }
          
          toast({
            title: "Uploading image...",
            description: "Please wait while we upload your profile image"
          });
          
          // Upload image to Firebase Storage
          const imageUrl = await uploadImageToStorage(profileImage);
          
          // Update profile with the image URL
          updatedProfile.profilePicture = imageUrl;
          console.log("Profile image uploaded successfully");
          
          toast({
            title: "Image uploaded",
            description: "Your profile image was uploaded successfully"
          });
        } catch (uploadError: any) {
          console.error("Error uploading profile image:", uploadError);
          toast({
            title: "Error",
            description: uploadError.message || "Failed to upload profile image",
            variant: "destructive",
          });
          
          // Continue with profile update without the image
        }
      }

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
      
      // Check file size (5MB limit)
      if (selectedFile.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: "Image file size must be less than 5MB",
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
                          disabled={isUploading}
                        />
                        {profileImage && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClearImage}
                            size="sm"
                            disabled={isUploading}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {isUploading && (
                        <div className="mt-2 space-y-1">
                          <Progress value={uploadProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Uploading: {Math.round(uploadProgress)}%</p>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Maximum file size: 5MB
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
                  disabled={saving || isUploading} 
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

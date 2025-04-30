
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [skillInput, setSkillInput] = useState("");
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        // Try to get existing profile
        const profileDoc = await getDoc(doc(db, "contractorProfiles", currentUser.uid));
        
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as ContractorProfile);
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    setSaving(true);
    try {
      // Upload profile image if changed
      let profilePictureUrl = profile.profilePicture;
      
      if (profileImage) {
        const storageRef = ref(storage, `profile-images/${currentUser.uid}`);
        await uploadBytes(storageRef, profileImage);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      // Update profile with new data
      const updatedProfile: ContractorProfile = {
        ...profile,
        profilePicture: profilePictureUrl,
        completedJobsCount: completedJobs.length
      };

      await setDoc(doc(db, "contractorProfiles", currentUser.uid), updatedProfile);
      
      setProfile(updatedProfile);
      
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
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
      setProfileImage(e.target.files[0]);
    }
  };

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
                      src={profileImage 
                        ? URL.createObjectURL(profileImage) 
                        : profile.profilePicture
                      } 
                    />
                    <AvatarFallback className="text-2xl">
                      {profile.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <Label htmlFor="profile-image">Profile Picture</Label>
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="mt-1"
                  />
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
            
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ManageCompletedJobs 
        completedJobs={completedJobs}
        setCompletedJobs={setCompletedJobs}
      />
    </div>
  );
}

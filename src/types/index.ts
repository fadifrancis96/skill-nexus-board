
export type UserRole = 'job_poster' | 'contractor';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  datePosted: Date;
  createdBy: string;
  status: 'open' | 'in_progress' | 'completed';
  category?: string;
  budget?: number;
}

export interface Offer {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  message: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface CompletedJob {
  id: string;
  contractorId: string;
  title: string;
  description: string;
  completedDate: Date;
  clientName?: string;
  category?: string;
  images: string[];
}

export interface ContractorProfile {
  userId: string;
  displayName: string;
  bio: string;
  skills: string[];
  rating?: number;
  completedJobsCount: number;
  contactEmail?: string;
  phone?: string;
  website?: string;
  profilePicture?: string;
}

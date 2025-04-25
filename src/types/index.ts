
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

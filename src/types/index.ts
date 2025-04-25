
export type UserRole = 'job_poster' | 'contractor';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: Date;
}

export type JobStatus = 'open' | 'in_progress' | 'completed';

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  datePosted: Date;
  createdBy: string;
  status: JobStatus;
  budget?: number;
  category?: string;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected';

export interface Offer {
  id: string;
  contractorId: string;
  contractorName?: string;
  message: string;
  price: number;
  status: OfferStatus;
  createdAt: Date;
}

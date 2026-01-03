// Trainer Types based on API spec

export interface CreateTrainerInput {
  name: string;
  email: string;
  phone?: string;
  specialization: string[];
  bio?: string;
  certifications?: string[];
}

export interface UpdateTrainerInput {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string[];
  bio?: string;
  certifications?: string[];
  isActive?: boolean;
}

export interface TrainerQuery {
  search?: string;
  specialization?: string;
  isActive?: boolean;
}

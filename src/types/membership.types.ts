export interface CreateMembershipPlanInput {
    name: string;
    description?: string;
    duration: number;
    price: number;
    features: string[];
    maxCheckInsPerDay?: number;
    isActive?: boolean;
  }
  
  export interface UpdateMembershipPlanInput {
    name?: string;
    description?: string;
    duration?: number;
    price?: number;
    features?: string[];
    maxCheckInsPerDay?: number;
    isActive?: boolean;
  }
  
  export interface MembershipPlanQuery {
    active?: boolean;
    price?: number;
    duration?: number;
    search?: string;
  }
  
  export interface FindManyOptions {
    search?: string;
    isActive?: boolean;
    duration?: number;
  }
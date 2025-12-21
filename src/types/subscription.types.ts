export interface CreateSubscriptionInput {
    membershipPlanId: string;
  }
  
  export interface SubscriptionQuery {
    status?: "PENDING" | "ACTIVE" | "EXPIRED" | "CANCELED";
    userId?: string;
  }
  
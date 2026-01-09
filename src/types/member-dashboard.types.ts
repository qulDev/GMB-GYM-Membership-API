// Member Dashboard Types

export interface MemberDashboardStats {
  subscription: SubscriptionSummary | null;
  checkInStats: MemberCheckInStats;
  recommendedClasses: RecommendedClass[];
  upcomingBookedClasses: BookedClass[];
  recentActivity: RecentCheckIn[];
}

export interface SubscriptionSummary {
  id: string;
  planName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  features: string[];
  maxCheckInsPerDay: number;
}

export interface MemberCheckInStats {
  totalCheckIns: number;
  thisMonthCheckIns: number;
  todayCheckIns: number;
  remainingCheckInsToday: number;
  averageDurationMinutes: number;
}

export interface RecommendedClass {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  schedule: string;
  duration: number;
  capacity: number;
  bookedCount: number;
  availableSlots: number;
  trainer: {
    id: string;
    name: string;
    specialization: string[];
  };
  isBookable: boolean;
}

export interface BookedClass {
  id: string;
  bookingId: string;
  name: string;
  type: string | null;
  schedule: string;
  duration: number;
  status: string;
  trainer: {
    id: string;
    name: string;
  };
}

export interface RecentCheckIn {
  id: string;
  checkInTime: string;
  checkOutTime: string | null;
  duration: number | null;
}

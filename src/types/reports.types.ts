// Reports Types based on API spec

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayCheckIns: number;
  popularClasses: PopularClass[];
}

export interface PopularClass {
  id: string;
  name: string;
  type: string | null;
  bookedCount: number;
  capacity: number;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  daily: DailyRevenue[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactionCount: number;
}

export interface AttendanceReport {
  startDate: string;
  endDate: string;
  totalCheckIns: number;
  averageCheckInsPerDay: number;
  attendance: DailyAttendance[];
}

export interface DailyAttendance {
  date: string;
  checkIns: number;
  uniqueMembers: number;
}

export interface RevenueQueryParams {
  startDate: string;
  endDate: string;
}

export interface AttendanceQueryParams {
  startDate?: string;
  endDate?: string;
}

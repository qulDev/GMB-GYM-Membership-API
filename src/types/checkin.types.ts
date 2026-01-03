// Check-In/Out Types based on API spec

export interface CheckInData {
  id: string;
  userId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  duration: number | null;
  createdAt: Date;
}

export interface CheckInHistoryQuery {
  startDate?: string;
  endDate?: string;
}

export interface CheckInStatus {
  isCheckedIn: boolean;
  currentCheckIn: CheckInData | null;
}

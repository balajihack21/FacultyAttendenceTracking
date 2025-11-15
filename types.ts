export enum AttendanceStatus {
  OnTime = 'On-time',
  Late = 'Late',
  Absent = 'Absent',
  OnDuty = 'On-Duty',
}

export interface AttendanceRecord {
  id: string;
  empId: number;
  name: string;
  dept: string;
  inTime: string;
  status: AttendanceStatus;
  date: string;
  leaveApplicationId?: string;
}

export interface FacultyRecord {
  empId: number;
  name: string;
  dept: string;
  designation: string;
  salary: number;
  casualLeaves: number;
  username?: string;
  password?: string; // Stored as base64
  registered?: boolean;
}

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveApplicationRecord {
  id: string;
  empId: number;
  name: string;
  dept: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: LeaveStatus;
  submissionTimestamp: string;
}


export interface ChartData {
  name: string;
  value: number;
  // Fix: Add index signature to make the type compatible with Recharts' data prop.
  [key: string]: any;
}

export interface DepartmentChartData {
    name: string;
    [AttendanceStatus.OnTime]: number;
    [AttendanceStatus.Late]: number;
    [AttendanceStatus.Absent]: number;
    [AttendanceStatus.OnDuty]: number;
}

export interface FacultySummaryRecord {
  empId: number;
  name: string;
  onTime: number;
  late: number;
  absent: number;
  totalDays: number;
}

export interface MonthlySummary {
  empId: number;
  name: string;
  dept: string;
  designation: string;
  monthlySalary: number;
  presentDays: number;
  permissions: number;
  halfDayLeaves: number;
  casualLeavesAvailable: number;
  casualLeavesUsed: number;
  unpaidLeave: number;
  totalLeaves: number;
  payableDays: number;
  calculatedSalary: number;
}

export interface Settings {
  onTimeThreshold: string;
  permissionLimit: number;
  accountCreationEnabled: boolean;
  userAccountRequestEnabled: boolean;
}

export interface Holiday {
  id: string; // Will be the date string 'YYYY-MM-DD'
  date: string;
  description: string;
}
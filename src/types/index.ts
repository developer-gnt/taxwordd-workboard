export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';

export type NotificationType =
  | 'NEW_TASK_ASSIGNED'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'BLOCKED'
  | 'RETURNED_FOR_REVIEW'
  | 'COMPLETED'
  | 'STATUS_CHANGE'
  | 'MONTHLY_REPORT_AVAILABLE'
  | 'PERIOD_CLOSING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin: string; // 6 digits
  active: boolean;
  avatar?: string;
  initials: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  status: ProjectStatus;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory = 'PRD' | 'FRD' | 'TECH_SPEC' | 'DESIGN' | 'OTHER';

export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  category: DocumentCategory;
  dataUrl?: string;
  uploadedAt: string;
  uploadedByName?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  clientName: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  createdById: string;
  createdByName: string;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  status: TaskStatus;
  progress: number; // 0 - 100
  blocker?: string; // Required if status is BLOCKED
  nextAction: string; // Core principle: exactly one clear next action
  notes?: string;
  referenceLink?: string;
  estimatedEffort?: string; // e.g. "4h", "2 days"
  expectedCompletionDate?: string; // YYYY-MM-DD
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  carriedForward?: boolean;
  wasOverdue?: boolean;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

export interface MonthlyReportFilter {
  month: string; // YYYY-MM
  employeeId?: string;
  projectId?: string;
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface MonthlySummaryMetrics {
  totalTasks: number;
  completed: number;
  active: number;
  overdue: number;
  blocked: number;
  dueSoon: number;
  onTimeCompletion: number;
  completionRate: number; // percentage 0-100
  delayedOrCarriedForward: number;
}

export interface EmployeePerformanceSummary {
  employeeId: string;
  employeeName: string;
  role: UserRole;
  department?: string;
  assigned: number;
  completed: number;
  active: number;
  overdue: number;
  blocked: number;
  completionRate: number; // percentage
  onTimeCompletionRate: number; // percentage
}

export interface ProjectSummaryMetrics {
  projectId: string;
  projectName: string;
  clientName: string;
  status: ProjectStatus;
  totalTasks: number;
  completed: number;
  active: number;
  overdue: number;
  blocked: number;
  completionRate: number;
}

export interface DetailedTaskReportRow {
  taskId: string;
  title: string;
  ownerName: string;
  projectName: string;
  clientName: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  status: TaskStatus;
  priority: TaskPriority;
  isOnTime: boolean;
  isOverdue: boolean;
  wasCompletedLate: boolean;
  delayDays: number;
  isCarriedForward: boolean;
  nextAction: string;
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalActivities: number;
  totalNotifications: number;
  storageUsageBytes: number;
  lastBackupDate?: string;
}

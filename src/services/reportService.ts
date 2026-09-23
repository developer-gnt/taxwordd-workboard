import {
  Task,
  MonthlyReportFilter,
  MonthlySummaryMetrics,
  EmployeePerformanceSummary,
  ProjectSummaryMetrics,
  DetailedTaskReportRow,
  User,
} from '../types';
import { storageService } from './storageService';
import { getLocalDateString } from '../utils/dateUtils';
import {
  isTaskAssignedToUser,
  findUserByIdentifier,
  normalizeTasks,
} from '../utils/identityUtils';

export interface GeneratedMonthlyReport {
  filter: MonthlyReportFilter;
  monthLabel: string;
  generatedAt: string;
  summary: MonthlySummaryMetrics;
  employeePerformance: EmployeePerformanceSummary[];
  projectPerformance: ProjectSummaryMetrics[];
  detailedTasks: DetailedTaskReportRow[];
}

class ReportService {
  /**
   * Evaluates if a date string falls within a target YYYY-MM month
   */
  private isSameMonth(dateStr?: string, targetMonth?: string): boolean {
    if (!dateStr || !targetMonth) return false;
    return dateStr.startsWith(targetMonth);
  }

  public generateMonthlyReport(filter: MonthlyReportFilter): GeneratedMonthlyReport {
    const allUsers = storageService.getUsers();
    const allTasks = normalizeTasks(storageService.getTasks(), allUsers);
    const allProjects = storageService.getProjects();

    const targetMonth = filter.month; // e.g. '2026-09'
    const todayStr = getLocalDateString();

    // Compute month boundaries
    const [yearStr, monthNumStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthNumStr, 10) - 1; // 0-indexed
    const startDate = getLocalDateString(new Date(year, monthIndex, 1));
    const endDate = getLocalDateString(new Date(year, monthIndex + 1, 0));

    // Date-based task filtering for this month:
    let relevantTasks = allTasks.filter((t) => {
      const dueInMonth = t.dueDate ? (t.dueDate >= startDate && t.dueDate <= endDate) : false;
      const completedInMonth = t.completedAt ? this.isSameMonth(t.completedAt.split('T')[0], targetMonth) : false;
      const activeInMonth = t.createdAt.split('T')[0] <= endDate && (!t.completedAt || t.completedAt.split('T')[0] >= startDate);

      return dueInMonth || completedInMonth || activeInMonth;
    });

    // Apply user filters
    if (filter.employeeId) {
      const targetUser = allUsers.find((u) => u.id === filter.employeeId) || findUserByIdentifier(allUsers, filter.employeeId);
      if (targetUser) {
        relevantTasks = relevantTasks.filter((t) => isTaskAssignedToUser(t, targetUser));
      } else {
        relevantTasks = relevantTasks.filter((t) => t.assignedEmployeeId === filter.employeeId);
      }
    }
    if (filter.projectId) {
      relevantTasks = relevantTasks.filter((t) => t.projectId === filter.projectId);
    }
    if (filter.status && filter.status !== 'ALL') {
      relevantTasks = relevantTasks.filter((t) => t.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'ALL') {
      relevantTasks = relevantTasks.filter((t) => t.priority === filter.priority);
    }
    if (filter.dueDateFrom) {
      relevantTasks = relevantTasks.filter((t) => t.dueDate && t.dueDate >= filter.dueDateFrom!);
    }
    if (filter.dueDateTo) {
      relevantTasks = relevantTasks.filter((t) => t.dueDate && t.dueDate <= filter.dueDateTo!);
    }

    // 1. Calculate Monthly Summary Metrics
    let completedCount = 0;
    let onTimeCount = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let blockedCount = 0;
    let dueSoonCount = 0;
    let carriedForwardCount = 0;

    relevantTasks.forEach((t) => {
      const isDone = t.status === 'DONE';
      const isBlocked = t.status === 'BLOCKED';

      if (isDone) {
        completedCount++;
        // On-time check: completed on or before due date (if due date exists)
        const compDate = t.completedAt ? t.completedAt.split('T')[0] : t.updatedAt.split('T')[0];
        if (!t.dueDate || compDate <= t.dueDate) {
          onTimeCount++;
        }
      } else {
        activeCount++;
        if (isBlocked) blockedCount++;

        // Overdue check (only if due date is set)
        if (t.dueDate) {
          if (t.dueDate < todayStr) {
            overdueCount++;
          } else if (t.dueDate >= todayStr && t.dueDate <= this.addDays(todayStr, 3)) {
            dueSoonCount++;
          }
        }
      }

      if (t.carriedForward || t.createdAt.split('T')[0] < startDate) {
        carriedForwardCount++;
      }
    });

    const totalTasks = relevantTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const summary: MonthlySummaryMetrics = {
      totalTasks,
      completed: completedCount,
      active: activeCount,
      overdue: overdueCount,
      blocked: blockedCount,
      dueSoon: dueSoonCount,
      onTimeCompletion: onTimeCount,
      completionRate,
      delayedOrCarriedForward: carriedForwardCount,
    };

    // 2. Calculate Employee Performance Summary
    const employeeIds = Array.from(new Set(relevantTasks.map((t) => t.assignedEmployeeId)));
    // If filter has no specific employee, include all active employees
    const targetEmployees = filter.employeeId
      ? allUsers.filter((u) => u.id === filter.employeeId)
      : allUsers.filter((u) => u.role === 'EMPLOYEE' || u.role === 'MANAGER' || employeeIds.includes(u.id));

    const employeePerformance: EmployeePerformanceSummary[] = targetEmployees.map((emp) => {
      const empTasks = relevantTasks.filter((t) => isTaskAssignedToUser(t, emp));
      const assigned = empTasks.length;
      let completed = 0;
      let onTime = 0;
      let active = 0;
      let overdue = 0;
      let blocked = 0;

      empTasks.forEach((t) => {
        if (t.status === 'DONE') {
          completed++;
          const compDate = t.completedAt ? t.completedAt.split('T')[0] : t.updatedAt.split('T')[0];
          if (!t.dueDate || compDate <= t.dueDate) onTime++;
        } else {
          active++;
          if (t.status === 'BLOCKED') blocked++;
          if (t.dueDate && t.dueDate < todayStr) overdue++;
        }
      });

      const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      const onTimeRate = completed > 0 ? Math.round((onTime / completed) * 100) : assigned === 0 ? 100 : 0;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        department: emp.department,
        assigned,
        completed,
        active,
        overdue,
        blocked,
        completionRate: rate,
        onTimeCompletionRate: onTimeRate,
      };
    });

    // 3. Calculate Project Summary
    const projectPerformance: ProjectSummaryMetrics[] = allProjects
      .filter((p) => (filter.projectId ? p.id === filter.projectId : true))
      .map((proj) => {
        const projTasks = relevantTasks.filter((t) => t.projectId === proj.id);
        const total = projTasks.length;
        let completed = 0;
        let active = 0;
        let overdue = 0;
        let blocked = 0;

        projTasks.forEach((t) => {
          if (t.status === 'DONE') {
            completed++;
          } else {
            active++;
            if (t.status === 'BLOCKED') blocked++;
            if (t.dueDate && t.dueDate < todayStr) overdue++;
          }
        });

        return {
          projectId: proj.id,
          projectName: proj.projectName,
          clientName: proj.clientName,
          status: proj.status,
          totalTasks: total,
          completed,
          active,
          overdue,
          blocked,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      });

    // 4. Detailed Task Rows
    const detailedTasks: DetailedTaskReportRow[] = relevantTasks.map((t) => {
      const compDate = t.completedAt ? t.completedAt.split('T')[0] : undefined;
      const isDone = t.status === 'DONE';
      // A task is on-time if completed and (no dueDate or compDate <= dueDate)
      const isOnTime = isDone ? (!t.dueDate || (compDate ? compDate <= t.dueDate : true)) : false;
      // A task is overdue if still active and past due date
      const isOverdue = !isDone && t.dueDate ? t.dueDate < todayStr : false;
      // A task was completed but late (delayed)
      const wasCompletedLate = isDone && t.dueDate ? (t.wasOverdue === true || (compDate ? compDate > t.dueDate : false)) : false;
      // Calculate delay in days for completed-late tasks
      let delayDays = 0;
      if (wasCompletedLate && compDate && t.dueDate) {
        const d1 = new Date(t.dueDate);
        const d2 = new Date(compDate);
        delayDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      } else if (isOverdue && t.dueDate) {
        const d1 = new Date(t.dueDate);
        const d2 = new Date(todayStr);
        delayDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      }
      const isCarriedForward = !!t.carriedForward || t.createdAt.split('T')[0] < startDate;

      return {
        taskId: t.id,
        title: t.title,
        ownerName: t.assignedEmployeeName,
        projectName: t.projectName,
        clientName: t.clientName,
        createdAt: t.createdAt.split('T')[0],
        dueDate: t.dueDate,
        completedAt: compDate,
        status: t.status,
        priority: t.priority,
        isOnTime,
        isOverdue,
        wasCompletedLate,
        delayDays,
        isCarriedForward,
        nextAction: t.nextAction,
      };
    });

    const monthLabel = new Date(year, monthIndex, 1).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    return {
      filter,
      monthLabel,
      generatedAt: new Date().toISOString(),
      summary,
      employeePerformance,
      projectPerformance,
      detailedTasks,
    };
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return getLocalDateString(d);
  }

  /**
   * Generates and triggers download of CSV report
   */
  public exportReportToCSV(report: GeneratedMonthlyReport): void {
    const lines: string[] = [];

    // Header metadata
    lines.push(`"GNT WORKBOARD - MONTHLY OPERATIONAL REPORT"`);
    lines.push(`"Report Month","${report.monthLabel} (${report.filter.month})"`);
    lines.push(`"Generated At","${new Date(report.generatedAt).toLocaleString()}"`);
    lines.push('');

    // Summary KPIs
    lines.push(`"SUMMARY METRICS"`);
    lines.push(`"Total Tasks","Completed","Active","Overdue","Blocked","On-Time Completion","Completion Rate %"`);
    lines.push(
      [
        report.summary.totalTasks,
        report.summary.completed,
        report.summary.active,
        report.summary.overdue,
        report.summary.blocked,
        report.summary.onTimeCompletion,
        `${report.summary.completionRate}%`,
      ]
        .map((v) => `"${v}"`)
        .join(',')
    );
    lines.push('');

    // Employee Performance
    lines.push(`"EMPLOYEE PERFORMANCE SUMMARY"`);
    lines.push(`"Employee","Role","Department","Assigned","Completed","Active","Overdue","Blocked","Completion Rate","On-Time Rate"`);
    report.employeePerformance.forEach((e) => {
      lines.push(
        [
          e.employeeName,
          e.role,
          e.department || 'N/A',
          e.assigned,
          e.completed,
          e.active,
          e.overdue,
          e.blocked,
          `${e.completionRate}%`,
          `${e.onTimeCompletionRate}%`,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
    });
    lines.push('');

    // Project Performance
    lines.push(`"PROJECT SUMMARY"`);
    lines.push(`"Project Name","Client","Status","Total Tasks","Completed","Active","Overdue","Blocked","Completion Rate"`);
    report.projectPerformance.forEach((p) => {
      lines.push(
        [
          p.projectName,
          p.clientName,
          p.status,
          p.totalTasks,
          p.completed,
          p.active,
          p.overdue,
          p.blocked,
          `${p.completionRate}%`,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
    });
    lines.push('');

    // Detailed Tasks
    lines.push(`"DETAILED TASK BREAKDOWN"`);
    lines.push(`"Task ID","Title","Project","Client","Owner","Status","Priority","Created Date","Due Date","Completed Date","Delivery Status","Next Action"`);
    report.detailedTasks.forEach((t) => {
      let deliveryStatus = 'On Track';
      if (t.status === 'DONE') {
        deliveryStatus = t.isOnTime ? 'Delivered On-Time' : `Delivered Delayed${t.delayDays > 0 ? ` (${t.delayDays} day${t.delayDays !== 1 ? 's' : ''} late)` : ''}`;
      } else if (t.isOverdue) {
        deliveryStatus = `Overdue${t.delayDays > 0 ? ` (${t.delayDays} day${t.delayDays !== 1 ? 's' : ''})` : ''}`;
      } else if (t.status === 'BLOCKED') {
        deliveryStatus = 'Blocked';
      } else if (t.status === 'REVIEW') {
        deliveryStatus = 'In Review';
      } else if (t.status === 'IN_PROGRESS') {
        deliveryStatus = 'In Progress';
      } else {
        deliveryStatus = 'Not Started';
      }

      lines.push(
        [
          t.taskId,
          t.title,
          t.projectName,
          t.clientName,
          t.ownerName,
          t.status.replace('_', ' '),
          t.priority,
          t.createdAt,
          t.dueDate,
          t.completedAt || '-',
          deliveryStatus,
          t.nextAction,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
    });

    const csvContent = '\uFEFF' + lines.join('\r\n'); // Add UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GNT_Monthly_Report_${report.filter.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const reportService = new ReportService();

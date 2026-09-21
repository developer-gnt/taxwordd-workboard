import React from 'react';
import { useApp } from '../../context/AppContext';
import { BentoKpiCard } from '../../components/dashboard/BentoKpiCard';
import { CompletionTrendCard } from '../../components/dashboard/CompletionTrendCard';
import { TasksAttentionCard } from '../../components/dashboard/TasksAttentionCard';
import { WorkloadCard } from '../../components/dashboard/WorkloadCard';
import { ProjectProgressCard } from '../../components/dashboard/ProjectProgressCard';
import { RecentActivityCard } from '../../components/dashboard/RecentActivityCard';
import { getLocalDateString } from '../../utils/dateUtils';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { tasks = [], users = [], projects = [], activities = [], navigateTo } = useApp();
  const safeTasks = tasks || [];
  const safeUsers = users || [];
  const safeProjects = projects || [];
  const safeActivities = activities || [];
  const todayStr = getLocalDateString();

  // Derived counts
  const totalTasks = safeTasks.length;
  const activeTasks = safeTasks.filter((t) => t.status !== 'DONE').length;
  const dueTodayTasks = safeTasks.filter((t) => t.dueDate && t.dueDate === todayStr && t.status !== 'DONE').length;
  const overdueTasks = safeTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'DONE').length;
  const blockedTasks = safeTasks.filter((t) => t.status === 'BLOCKED').length;
  const completedTasks = safeTasks.filter((t) => t.status === 'DONE').length;

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* 1. Bento KPI Grid (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <BentoKpiCard
          id="kpi-total-tasks"
          label="Total Tasks"
          value={totalTasks}
          subtext="All tracked work"
          icon={Layers}
          colorScheme="slate"
          onClick={() => navigateTo('/admin/tasks', { quickFilter: 'all' })}
        />

        <BentoKpiCard
          id="kpi-active-tasks"
          label="Active"
          value={activeTasks}
          subtext="In progress or review"
          icon={Clock}
          colorScheme="blue"
          onClick={() => navigateTo('/admin/tasks', { status: 'IN_PROGRESS' })}
        />

        <BentoKpiCard
          id="kpi-due-today"
          label="Due Today"
          value={dueTodayTasks}
          subtext="Today's deadlines"
          icon={Calendar}
          colorScheme="amber"
          isUrgent={dueTodayTasks > 0}
          onClick={() => navigateTo('/admin/tasks', { quickFilter: 'today' })}
        />

        <BentoKpiCard
          id="kpi-overdue-tasks"
          label="Overdue"
          value={overdueTasks}
          subtext="Past deadline"
          icon={AlertCircle}
          colorScheme="rose"
          isUrgent={overdueTasks > 0}
          onClick={() => navigateTo('/admin/tasks', { quickFilter: 'overdue' })}
        />

        <BentoKpiCard
          id="kpi-blocked-tasks"
          label="Blocked"
          value={blockedTasks}
          subtext="Impediments flagged"
          icon={ShieldAlert}
          colorScheme="purple"
          isUrgent={blockedTasks > 0}
          onClick={() => navigateTo('/admin/tasks', { quickFilter: 'blocked' })}
        />

        <BentoKpiCard
          id="kpi-completed-tasks"
          label="Completed"
          value={completedTasks}
          subtext="Delivered work"
          icon={CheckCircle2}
          colorScheme="emerald"
          onClick={() => navigateTo('/admin/tasks', { quickFilter: 'completed' })}
        />
      </div>

      {/* 2. Middle Row: Velocity Chart & Urgent Attention Bento Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CompletionTrendCard tasks={safeTasks} />
        <TasksAttentionCard tasks={safeTasks} />
      </div>

      {/* 3. Bottom Row: Workload & Project Delivery & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <WorkloadCard users={safeUsers} tasks={safeTasks} />
        </div>
        <div className="lg:col-span-1">
          <ProjectProgressCard projects={safeProjects} tasks={safeTasks} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityCard activities={safeActivities} />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/navigation/Sidebar';
import { Topbar } from './components/navigation/Topbar';
import { LoginView } from './pages/auth/LoginView';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { EmployeeTasksView } from './pages/employee/EmployeeTasksView';
import { TaskTable } from './components/tasks/TaskTable';
import { ProjectList } from './components/projects/ProjectList';
import { TeamTable } from './components/team/TeamTable';
import { TeamsView } from './components/team/TeamsView';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { AdminSettings } from './pages/admin/AdminSettings';
import { EmployeeMonthlySummaryView } from './pages/employee/EmployeeMonthlySummaryView';
import { EmployeeProfileView } from './pages/employee/EmployeeProfileView';
import { BrowserNotificationBanner } from './components/notifications/BrowserNotificationBanner';

// Modals & Drawers
import { TaskCreateModal } from './components/tasks/TaskCreateModal';
import { EmployeeUpdateModal } from './components/tasks/EmployeeUpdateModal';
import { TaskEditModal } from './components/tasks/TaskEditModal';
import { TaskDetailDrawer } from './components/tasks/TaskDetailDrawer';
import { ProjectModal } from './components/projects/ProjectModal';
import { AddUserModal } from './components/team/AddUserModal';
import { EditUserModal } from './components/team/EditUserModal';
import { ResetPinModal } from './components/team/ResetPinModal';
import { ChangeRoleModal } from './components/team/ChangeRoleModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { Task, Project, User } from './types';

import { DraggableCreateTaskFAB } from './components/navigation/DraggableCreateTaskFAB';
import { authService } from './services/authService';

const MainAppLayout: React.FC = () => {
  const { currentUser, activeRoute, tasks, navigateTo } = useApp();

  // Mobile sidebar visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // YouTube-style collapsible sidebar state (persisted in localStorage)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gnt_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gnt_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Modal dialog states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskForUpdate, setSelectedTaskForUpdate] = useState<Task | null>(null);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<Task | null>(null);

  // Project modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<Project | null>(null);

  // User modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [selectedUserForResetPin, setSelectedUserForResetPin] = useState<User | null>(null);
  const [selectedUserForChangeRole, setSelectedUserForChangeRole] = useState<User | null>(null);

  if (!currentUser) {
    return <LoginView />;
  }

  // Determine Title & Subtitle based on activeRoute
  let pageTitle = 'Dashboard';
  let pageSubtitle = 'Operations overview';

  switch (activeRoute) {
    case '/admin/dashboard':
      pageTitle = 'Executive Operations Command';
      pageSubtitle = 'Full organization deliverable visibility & accountability metrics';
      break;
    case '/admin/tasks':
      pageTitle = 'Organization Deliverables Register';
      pageSubtitle = 'Master table of all company tasks, deadlines, owners, and next actions';
      break;
    case '/admin/projects':
      pageTitle = 'Parties & Client Accounts';
      pageSubtitle = 'Strategic party initiatives and deliverable progress tracking';
      break;
    case '/admin/team':
    case '/manager/team':
      pageTitle = 'Employees & Access Management';
      pageSubtitle = 'Accountability assignments, permissions, and security credentials';
      break;
    case '/admin/teams':
    case '/manager/teams':
      pageTitle = 'Functional Teams & Pods';
      pageSubtitle = 'Organize employees into operational units, assign leads, and monitor team workload';
      break;
    case '/admin/reports':
    case '/manager/reports':
      pageTitle = 'Monthly Performance Review';
      pageSubtitle = 'Objective deliverables audit, completion rates, and on-time execution analysis';
      break;
    case '/admin/settings':
      pageTitle = 'System settings';
      pageSubtitle = 'Database repository, JSON snapshots, and architecture configuration';
      break;
    case '/manager/dashboard':
      pageTitle = 'Operations & Delivery Dashboard';
      pageSubtitle = 'Team capacity, active blockers, and quality assurance oversight';
      break;
    case '/manager/tasks':
      pageTitle = 'Deliverables & Quality Review';
      pageSubtitle = 'Monitor progress, review submitted deliverables, and resolve impediments';
      break;
    case '/manager/projects':
      pageTitle = 'Parties & Client Accounts';
      pageSubtitle = 'Party deliverable completion and delivery velocity';
      break;
    case '/employee/tasks':
      pageTitle = 'My Task Deliverables';
      pageSubtitle = 'Single ownership • Maintain clear Next Actions and flag blockers early';
      break;
    case '/employee/monthly-summary':
      pageTitle = 'Monthly Performance Review';
      pageSubtitle = 'Your objective execution records and completion velocity for manager evaluation';
      break;
    case '/employee/profile':
      pageTitle = 'Account & Security Settings';
      pageSubtitle = 'Manage your profile details and update your 4-digit security PIN';
      break;
    case '/notifications':
    case '/admin/notifications':
    case '/manager/notifications':
    case '/employee/notifications':
      pageTitle = 'Operational Notifications';
      pageSubtitle = 'Task assignments, blocker escalations, and deadline warnings';
      break;
    default:
      pageTitle = 'TAX WORLDD';
      pageSubtitle = 'Operational Management System';
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] antialiased text-slate-800">
      {/* Sidebar (Desktop + Mobile) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        } flex flex-col min-h-screen min-w-0 transition-[padding] duration-200 ease-in-out`}
      >
        {/* Browser Notification Banner Prompt */}
        <BrowserNotificationBanner />

        {/* Topbar */}
        <Topbar
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onToggleSidebar={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
          onOpenCreateTask={() => setIsCreateTaskOpen(true)}
          title={pageTitle}
          subtitle={pageSubtitle}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Admin Routes */}
          {activeRoute === '/admin/dashboard' && <AdminDashboard />}
          {activeRoute === '/admin/tasks' && (
            <TaskTable
              tasks={tasks}
              onOpenEmployeeUpdate={(t) => setSelectedTaskForUpdate(t)}
              onOpenEditTask={(t) => setSelectedTaskForEdit(t)}
              isEmployeeView={false}
            />
          )}
          {activeRoute === '/admin/projects' && (
            <ProjectList
              onOpenCreateProject={() => {
                setSelectedProjectForEdit(null);
                setIsProjectModalOpen(true);
              }}
              onOpenEditProject={(p) => {
                setSelectedProjectForEdit(p);
                setIsProjectModalOpen(true);
              }}
            />
          )}
          {activeRoute === '/admin/team' && (
            <TeamTable
              onOpenAddUser={() => setIsAddUserModalOpen(true)}
              onOpenEditUser={(u) => setSelectedUserForEdit(u)}
              onOpenResetPin={(u) => setSelectedUserForResetPin(u)}
              onOpenChangeRole={(u) => setSelectedUserForChangeRole(u)}
            />
          )}
          {activeRoute === '/admin/teams' && (
            <TeamsView onSwitchToEmployees={() => navigateTo('/admin/team')} />
          )}
          {activeRoute === '/admin/reports' && <MonthlyReportView />}
          {activeRoute === '/admin/settings' && <AdminSettings />}

          {/* Manager Routes */}
          {activeRoute === '/manager/dashboard' && (
            <ManagerDashboard onOpenCreateTask={() => setIsCreateTaskOpen(true)} />
          )}
          {activeRoute === '/manager/tasks' && (
            <TaskTable
              tasks={tasks}
              onOpenEmployeeUpdate={(t) => setSelectedTaskForUpdate(t)}
              onOpenEditTask={(t) => setSelectedTaskForEdit(t)}
              isEmployeeView={false}
            />
          )}
          {activeRoute === '/manager/projects' && (
            <ProjectList
              onOpenCreateProject={() => {
                setSelectedProjectForEdit(null);
                setIsProjectModalOpen(true);
              }}
              onOpenEditProject={(p) => {
                setSelectedProjectForEdit(p);
                setIsProjectModalOpen(true);
              }}
            />
          )}
          {activeRoute === '/manager/team' && (
            <TeamTable
              onOpenAddUser={() => setIsAddUserModalOpen(true)}
              onOpenEditUser={(u) => setSelectedUserForEdit(u)}
              onOpenResetPin={(u) => setSelectedUserForResetPin(u)}
              onOpenChangeRole={(u) => setSelectedUserForChangeRole(u)}
            />
          )}
          {activeRoute === '/manager/teams' && (
            <TeamsView onSwitchToEmployees={() => navigateTo('/manager/team')} />
          )}
          {activeRoute === '/manager/reports' && <MonthlyReportView />}

          {/* Employee Routes */}
          {activeRoute === '/employee/tasks' && (
            <EmployeeTasksView
              onOpenEmployeeUpdate={(t) => setSelectedTaskForUpdate(t)}
            />
          )}
          {activeRoute === '/employee/monthly-summary' && <EmployeeMonthlySummaryView />}
          {activeRoute === '/employee/profile' && <EmployeeProfileView />}

          {/* Global Common Routes */}
          {(activeRoute === '/notifications' ||
            activeRoute === '/admin/notifications' ||
            activeRoute === '/manager/notifications' ||
            activeRoute === '/employee/notifications') && <NotificationCenter />}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <TaskCreateModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      <EmployeeUpdateModal
        task={selectedTaskForUpdate}
        isOpen={!!selectedTaskForUpdate}
        onClose={() => setSelectedTaskForUpdate(null)}
      />

      <TaskEditModal
        task={selectedTaskForEdit}
        isOpen={!!selectedTaskForEdit}
        onClose={() => setSelectedTaskForEdit(null)}
      />

      <TaskDetailDrawer
        onOpenEmployeeUpdate={(t) => setSelectedTaskForUpdate(t)}
        onOpenEditTask={(t) => setSelectedTaskForEdit(t)}
      />

      <ProjectModal
        project={selectedProjectForEdit}
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProjectForEdit(null);
        }}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
      />

      <EditUserModal
        user={selectedUserForEdit}
        isOpen={!!selectedUserForEdit}
        onClose={() => setSelectedUserForEdit(null)}
      />

      <ResetPinModal
        user={selectedUserForResetPin}
        isOpen={!!selectedUserForResetPin}
        onClose={() => setSelectedUserForResetPin(null)}
      />

      <ChangeRoleModal
        user={selectedUserForChangeRole}
        isOpen={!!selectedUserForChangeRole}
        onClose={() => setSelectedUserForChangeRole(null)}
      />

      {/* Mobile Draggable Floating Action Button */}
      {authService.canCreateTask(currentUser) && (
        <DraggableCreateTaskFAB onClick={() => setIsCreateTaskOpen(true)} />
      )}

      {/* Toast notifications container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}

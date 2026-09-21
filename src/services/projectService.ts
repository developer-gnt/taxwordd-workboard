import { Project, User, ProjectStatus } from '../types';
import { storageService } from './storageService';
import { authService } from './authService';
import { generateId } from '../utils/idUtils';

class ProjectService {
  public async getProjects(): Promise<Project[]> {
    return storageService.getProjects();
  }

  public async getProjectById(id: string): Promise<Project | null> {
    const projects = storageService.getProjects();
    return projects.find((p) => p.id === id) || null;
  }

  public async createProject(
    data: {
      projectName: string;
      clientName: string;
      status: ProjectStatus;
      description?: string;
    },
    actor: User
  ): Promise<{ success: boolean; message: string; project?: Project }> {
    if (!authService.canManageProjects(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can create projects.' };
    }

    if (!data.projectName.trim()) return { success: false, message: 'Project name is required.' };
    if (!data.clientName.trim()) return { success: false, message: 'Client name is required.' };

    const projects = storageService.getProjects();
    const newProject: Project = {
      id: generateId('proj'),
      projectName: data.projectName.trim(),
      clientName: data.clientName.trim(),
      status: data.status,
      description: data.description?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageService.saveProject(newProject);

    return { success: true, message: `Project "${newProject.projectName}" created successfully.`, project: newProject };
  }

  public async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>,
    actor: User
  ): Promise<{ success: boolean; message: string; project?: Project }> {
    if (!authService.canManageProjects(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can update project metadata.' };
    }

    const projects = storageService.getProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return { success: false, message: 'Project not found.' };

    const updated: Project = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updated;
    // Supabase-first: persist project update directly to cloud
    await storageService.saveProject(updated);

    // If projectName or clientName changed, update associated tasks for denormalized consistency
    if (updates.projectName || updates.clientName) {
      const tasks = storageService.getTasks();
      const tasksToSync: any[] = [];
      const syncedTasks = tasks.map((t) => {
        if (t.projectId === id) {
          const updated = {
            ...t,
            projectName: updates.projectName || t.projectName,
            clientName: updates.clientName || t.clientName,
            updatedAt: new Date().toISOString(),
          };
          tasksToSync.push(updated);
          return updated;
        }
        return t;
      });
      if (tasksToSync.length > 0) {
        // Supabase-first: push each changed task individually
        for (const t of tasksToSync) {
          storageService.saveTask(t).catch(() => {});
        }
        storageService.setTasks(syncedTasks, false); // update localStorage cache only
      }
    }

    return { success: true, message: `Project updated successfully.`, project: updated };
  }

  public async deleteProject(
    id: string,
    actor: User
  ): Promise<{ success: boolean; message: string }> {
    if (!authService.canManageProjects(actor)) {
      return { success: false, message: 'Unauthorized: Only Admins can delete projects.' };
    }

    // Safety guard: check for associated tasks
    const tasks = storageService.getTasks();
    const associatedTasks = tasks.filter((t) => t.projectId === id);
    if (associatedTasks.length > 0) {
      return {
        success: false,
        message: `Cannot delete project: ${associatedTasks.length} task(s) are currently associated with this project. Reassign or resolve these tasks first to prevent orphaned records.`,
      };
    }

    await storageService.deleteProject(id);

    return { success: true, message: 'Project deleted successfully.' };
  }
}

export const projectService = new ProjectService();

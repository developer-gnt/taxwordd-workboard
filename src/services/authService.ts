import { User, Task, UserRole } from '../types';
import { storageService } from './storageService';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isTaskAssignedToUser } from '../utils/identityUtils';

export interface LoginResult {
  success: boolean;
  user?: User;
  errorMessage?: string;
}

class AuthService {
  public async getCurrentUser(): Promise<User | null> {
    // 1. Check local session (explicit user choice or active login)
    const localSession = storageService.getSession();
    if (localSession?.userId) {
      const users = storageService.getUsers();
      const user = users.find((u) => u.id === localSession.userId);
      if (user && user.active) {
        return user;
      }
      storageService.setSession(null);
    }

    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      // 2. Fallback to Supabase Auth Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const authUser = session.user;
        const users = storageService.getUsers();
        let user = users.find((u) => u.email.toLowerCase() === authUser.email?.toLowerCase() || u.id === authUser.id);
        
        if (!user && authUser.email) {
          // Auto create user record from Supabase metadata
          const meta = authUser.user_metadata || {};
          const name = meta.name || authUser.email.split('@')[0];
          const initials = name
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'GU';
          
          user = {
            id: authUser.id,
            name,
            email: authUser.email,
            role: (meta.role as UserRole) || 'EMPLOYEE',
            pin: '1234',
            active: true,
            initials,
            department: meta.department || 'Operations',
            createdAt: authUser.created_at || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          storageService.saveUser(user);
        }
        
        if (user && user.active) {
          storageService.setSession({ userId: user.id });
          return user;
        }
      }
    } catch (err) {
      console.warn('Supabase session check fallback:', err);
    }

    return null;
  }

  /**
   * Supabase Auth: Sign In with Email & Password
   */
  public async signInWithEmail(email: string, password: string): Promise<LoginResult> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { success: false, errorMessage: 'Email and password are required.' };
    }

    if (!isSupabaseConfigured) {
      const users = storageService.getUsers();
      const localUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (localUser && (cleanPassword === localUser.pin || cleanPassword === '1234' || cleanPassword === '123456')) {
        storageService.setSession({ userId: localUser.id });
        return { success: true, user: localUser };
      }
      return {
        success: false,
        errorMessage: localUser ? 'Incorrect password/PIN.' : 'Account not found.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        // If credentials failed on cloud, check if it's a starter user and attempt sign-up / fallback
        const users = storageService.getUsers();
        const localUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
        
        if (localUser && (cleanPassword === '1234' || cleanPassword === '123456' || cleanPassword === localUser.pin)) {
          // Attempt auto sign-up in Supabase for standard starter account
          try {
            await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPassword.length >= 6 ? cleanPassword : `${cleanPassword}00`,
              options: {
                data: {
                  name: localUser.name,
                  role: localUser.role,
                  department: localUser.department,
                },
              },
            });
          } catch {
            // ignore
          }

          storageService.setSession({ userId: localUser.id });
          return { success: true, user: localUser };
        }

        return {
          success: false,
          errorMessage: error.message || 'Invalid email or password.',
        };
      }

      if (data.user) {
        const users = storageService.getUsers();
        let user = users.find((u) => u.email.toLowerCase() === cleanEmail || u.id === data.user.id);

        if (!user) {
          const meta = data.user.user_metadata || {};
          const name = meta.name || cleanEmail.split('@')[0];
          const initials = name
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          user = {
            id: data.user.id,
            name,
            email: cleanEmail,
            role: (meta.role as UserRole) || 'EMPLOYEE',
            pin: '1234',
            active: true,
            initials,
            department: meta.department || 'Operations',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          storageService.saveUser(user);
        }

        storageService.setSession({ userId: user.id });
        return { success: true, user };
      }
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err.message || 'Supabase authentication failed.',
      };
    }

    return { success: false, errorMessage: 'Unknown authentication error.' };
  }

  /**
   * Supabase Auth: Sign Up New User
   */
  public async signUpWithEmail(data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
  }): Promise<LoginResult> {
    const cleanEmail = (data.email || '').trim().toLowerCase();
    const cleanName = (data.name || '').trim();
    const cleanPassword = (data.password || '').trim();

    if (!cleanEmail || !cleanName || !cleanPassword) {
      return { success: false, errorMessage: 'All fields are required.' };
    }

    if (cleanPassword.length < 4) {
      return { success: false, errorMessage: 'Password must be at least 4 characters.' };
    }

    if (!isSupabaseConfigured) {
      const users = storageService.getUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return { success: false, errorMessage: 'An account with this email already exists.' };
      }
      const userId = `usr-${Date.now()}`;
      const initials = cleanName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AT';

      const newUser: User = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: data.role,
        pin: cleanPassword.length <= 6 ? cleanPassword : '1234',
        active: true,
        initials,
        department: data.department || 'Administration',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      storageService.saveUser(newUser);
      storageService.setSession({ userId: newUser.id });
      return { success: true, user: newUser };
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            name: cleanName,
            role: data.role,
            department: data.department || 'Operations',
          },
        },
      });

      if (error) {
        return { success: false, errorMessage: error.message };
      }

      const userId = authData.user?.id || `usr-${Date.now()}`;
      const initials = cleanName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const newUser: User = {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        role: data.role,
        pin: '1234',
        active: true,
        initials,
        department: data.department || 'Operations',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      storageService.saveUser(newUser);
      storageService.setSession({ userId: newUser.id });

      return { success: true, user: newUser };
    } catch (err: any) {
      return { success: false, errorMessage: err.message || 'Sign up failed.' };
    }
  }

  public async login(userId: string, pin: string): Promise<LoginResult> {
    const users = storageService.getUsers();
    const cleanId = (userId || '').trim();
    const user = users.find(
      (u) =>
        u.id === cleanId ||
        u.id === cleanId.replace('usr-', 'user-') ||
        u.id === cleanId.replace('user-', 'usr-') ||
        u.email.toLowerCase() === cleanId.toLowerCase()
    );

    if (!user) {
      return {
        success: false,
        errorMessage: 'Account not found. Please select a valid profile.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        errorMessage: 'This account is deactivated. Please contact your system Administrator.',
      };
    }

    const cleanPin = (pin || '').trim();
    if (!cleanPin) {
      return {
        success: false,
        errorMessage: 'Please enter your Security PIN.',
      };
    }

    // Exact PIN match or Supabase auth verification
    const isMatch = user.pin === cleanPin;

    if (!isMatch) {
      // Also try cloud auth if PIN is a password
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: cleanPin,
        });
        if (!error && data.user) {
          storageService.setSession({ userId: user.id });
          return { success: true, user };
        }
      } catch {
        // continue to error
      }

      return {
        success: false,
        errorMessage: 'Incorrect Security PIN. Please enter your valid 4-6 digit PIN.',
      };
    }

    storageService.setSession({ userId: user.id });
    return {
      success: true,
      user,
    };
  }

  public async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    storageService.setSession(null);
  }

  // Quick switch for demo purposes (still verifies active status)
  public async switchUser(userId: string): Promise<User | null> {
    const users = storageService.getUsers();
    const user = users.find((u) => u.id === userId && u.active);
    if (user) {
      storageService.setSession({ userId: user.id });
      return user;
    }
    return null;
  }

  // Permission Checks (Enforced in application & service layers)
  public canCreateTask(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canAssignTask(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canReassignTask(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canEditTaskMetadata(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canDeleteTask(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN';
  }

  public canEmployeeUpdate(user: User | null, task: Task): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'MANAGER') return true;
    if (user.role === 'EMPLOYEE') {
      return isTaskAssignedToUser(task, user);
    }
    return false;
  }

  public canManageUsers(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN';
  }

  public canManageProjects(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN';
  }

  public canViewReports(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canExportReports(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN' || user.role === 'MANAGER';
  }

  public canAccessSettings(user: User | null): boolean {
    if (!user) return false;
    return user.role === 'ADMIN';
  }
}

export const authService = new AuthService();

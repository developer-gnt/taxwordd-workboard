import { User, Task } from '../types';

/**
 * Normalizes any identity string (ID, email, name) for resilient comparison
 */
export function normalizeIdentity(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Checks if a candidate identifier (ID, email, name, or prefixed ID) matches a given User.
 * Used for legacy resolution and fallback compatibility.
 */
export function userMatches(user: User, identifier?: string | null): boolean {
  if (!identifier) return false;

  const target = normalizeIdentity(identifier);
  if (!target) return false;

  // Direct raw id match without prefix (e.g. user-123 vs usr-123 vs 123)
  const targetRaw = target.replace(/^(usr-|user-)/, '');
  const userRawId = normalizeIdentity(user.id).replace(/^(usr-|user-)/, '');

  if (targetRaw && userRawId && targetRaw === userRawId) {
    return true;
  }

  const candidates = [
    user.id,
    user.email,
    user.name,
  ]
    .filter(Boolean)
    .map(normalizeIdentity);

  return candidates.includes(target);
}

/**
 * Finds the canonical user record matching an identifier from an array of users.
 */
export function findUserByIdentifier(users: User[], identifier?: string | null): User | undefined {
  if (!identifier) return undefined;
  return users.find((u) => userMatches(u, identifier));
}

/**
 * Authoritative check if a task is assigned to a given user.
 * Supports canonical User.id as primary, with fallback for legacy email/name/prefix.
 */
export function isTaskAssignedToUser(task: Task, user: User): boolean {
  if (!user || !task) return false;

  const assigneeId = normalizeIdentity(task.assignedEmployeeId);
  const userId = normalizeIdentity(user.id);

  if (assigneeId && userId && assigneeId === userId) {
    return true;
  }

  // Fallback for legacy records
  return userMatches(user, task.assignedEmployeeId) || userMatches(user, task.assignedEmployeeName);
}

/**
 * Normalizes a task's assignment to guarantee canonical User.id and User.name.
 * If the task has legacy assignment data, it repairs it to the matched User.id.
 */
export function normalizeTaskAssignment(task: Task, users: User[]): Task {
  if (!task.assignedEmployeeId && !task.assignedEmployeeName) {
    return task;
  }

  const matchedUser = findUserByIdentifier(users, task.assignedEmployeeId) ||
                      findUserByIdentifier(users, task.assignedEmployeeName);

  if (!matchedUser) {
    return task;
  }

  if (
    task.assignedEmployeeId === matchedUser.id &&
    task.assignedEmployeeName === matchedUser.name
  ) {
    return task;
  }

  return {
    ...task,
    assignedEmployeeId: matchedUser.id,
    assignedEmployeeName: matchedUser.name,
  };
}

/**
 * Normalizes an array of tasks against a collection of users.
 */
export function normalizeTasks(tasks: Task[], users: User[]): Task[] {
  if (!users || users.length === 0) return tasks;
  return tasks.map((t) => normalizeTaskAssignment(t, users));
}

/**
 * Merges an incoming task into an existing task, respecting timestamps to prevent race conditions.
 */
export function mergeTaskWithTimestamp(existing: Task, incoming: Task): Task {
  if (
    existing.updatedAt &&
    incoming.updatedAt &&
    new Date(existing.updatedAt).getTime() > new Date(incoming.updatedAt).getTime()
  ) {
    return existing;
  }

  return {
    ...existing,
    ...incoming,
  };
}

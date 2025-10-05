export type Task = { 
  id: string; 
  title: string; 
  description?: string;
  dueAt?: string; 
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  tags?: string[];
};

export type CreateTaskInput = {
  title: string;
  description?: string;
  dueAt?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
};

export type TaskResult = {
  ok: boolean;
  task?: Task;
  error?: string;
};

// In-memory storage for demo (replace with database in production)
const taskStore = new Map<string, Task[]>();

export async function createTask(userId: string, input: CreateTaskInput): Promise<TaskResult> {
  try {
    if (!input.title || input.title.trim().length === 0) {
      return {
        ok: false,
        error: 'Task title is required'
      };
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: input.title.trim(),
      description: input.description?.trim(),
      dueAt: input.dueAt,
      status: 'open',
      priority: input.priority || 'medium',
      createdAt: now,
      updatedAt: now,
      tags: input.tags || [],
    };

    // Store the task
    const userTasks = taskStore.get(userId) || [];
    userTasks.push(task);
    taskStore.set(userId, userTasks);

    console.log(`[TASK] Created task for user ${userId}:`, {
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueAt: task.dueAt
    });

    return {
      ok: true,
      task,
    };
  } catch (error) {
    console.error('[CREATE TASK ERROR]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getTasks(
  userId: string, 
  status?: 'open' | 'in_progress' | 'done' | 'cancelled',
  limit = 50
): Promise<Task[]> {
  try {
    const userTasks = taskStore.get(userId) || [];
    
    let filteredTasks = userTasks;
    if (status) {
      filteredTasks = userTasks.filter(task => task.status === status);
    }

    // Sort by priority (high -> medium -> low) then by due date
    filteredTasks.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by due date (earliest first)
      if (a.dueAt && b.dueAt) {
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      }
      
      if (a.dueAt && !b.dueAt) return -1;
      if (!a.dueAt && b.dueAt) return 1;
      
      // If no due dates, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filteredTasks.slice(0, limit);
  } catch (error) {
    console.error('[GET TASKS ERROR]', error);
    return [];
  }
}

export async function updateTask(
  userId: string, 
  taskId: string, 
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'userId'>>
): Promise<TaskResult> {
  try {
    const userTasks = taskStore.get(userId) || [];
    const taskIndex = userTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return {
        ok: false,
        error: 'Task not found'
      };
    }

    // Update the task
    const updatedTask: Task = {
      ...userTasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    userTasks[taskIndex] = updatedTask;
    taskStore.set(userId, userTasks);

    console.log(`[TASK] Updated task ${taskId} for user ${userId}:`, updates);

    return {
      ok: true,
      task: updatedTask,
    };
  } catch (error) {
    console.error('[UPDATE TASK ERROR]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteTask(userId: string, taskId: string): Promise<TaskResult> {
  try {
    const userTasks = taskStore.get(userId) || [];
    const taskIndex = userTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return {
        ok: false,
        error: 'Task not found'
      };
    }

    const deletedTask = userTasks[taskIndex];
    userTasks.splice(taskIndex, 1);
    taskStore.set(userId, userTasks);

    console.log(`[TASK] Deleted task ${taskId} for user ${userId}`);

    return {
      ok: true,
      task: deletedTask,
    };
  } catch (error) {
    console.error('[DELETE TASK ERROR]', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function markTaskDone(userId: string, taskId: string): Promise<TaskResult> {
  return updateTask(userId, taskId, { 
    status: 'done',
    updatedAt: new Date().toISOString()
  });
}

export async function markTaskInProgress(userId: string, taskId: string): Promise<TaskResult> {
  return updateTask(userId, taskId, { 
    status: 'in_progress',
    updatedAt: new Date().toISOString()
  });
}

export async function getTaskStats(userId: string): Promise<{
  total: number;
  open: number;
  in_progress: number;
  done: number;
  overdue: number;
}> {
  try {
    const userTasks = taskStore.get(userId) || [];
    const now = new Date();
    
    const stats = {
      total: userTasks.length,
      open: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    };

    userTasks.forEach(task => {
      switch (task.status) {
        case 'open':
          stats.open++;
          break;
        case 'in_progress':
          stats.in_progress++;
          break;
        case 'done':
          stats.done++;
          break;
      }

      // Check if overdue
      if (task.dueAt && task.status !== 'done' && new Date(task.dueAt) < now) {
        stats.overdue++;
      }
    });

    return stats;
  } catch (error) {
    console.error('[GET TASK STATS ERROR]', error);
    return {
      total: 0,
      open: 0,
      in_progress: 0,
      done: 0,
      overdue: 0,
    };
  }
}

// Helper function to format task for display
export function formatTaskForDisplay(task: Task): string {
  const statusEmoji = {
    open: '📋',
    in_progress: '🔄',
    done: '✅',
    cancelled: '❌',
  };

  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  let result = `${statusEmoji[task.status]} ${priorityEmoji[task.priority]} ${task.title}`;
  
  if (task.dueAt) {
    const dueDate = new Date(task.dueAt);
    const isOverdue = dueDate < new Date() && task.status !== 'done';
    const dateStr = dueDate.toLocaleDateString();
    result += ` (Due: ${dateStr}${isOverdue ? ' ⚠️ OVERDUE' : ''})`;
  }

  if (task.tags && task.tags.length > 0) {
    result += ` [${task.tags.join(', ')}]`;
  }

  return result;
}

// Helper function to format task list for display
export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'No tasks found.';
  }

  const lines = tasks.map((task, index) => {
    return `${index + 1}. ${formatTaskForDisplay(task)}`;
  });

  return lines.join('\n');
}
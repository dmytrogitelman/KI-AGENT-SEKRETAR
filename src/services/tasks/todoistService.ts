import axios from 'axios';
import { logger } from '../../utils/logger';

export interface TodoistTask {
  id?: string;
  content: string;
  description?: string;
  dueDate?: Date;
  priority: 1 | 2 | 3 | 4; // 1 = Normal, 2 = High, 3 = Very High, 4 = Urgent
  labels?: string[];
  projectId?: string;
  isCompleted: boolean;
  createdAt?: Date;
  completedAt?: Date;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  order: number;
}

export class TodoistService {
  private apiToken: string;
  private baseUrl = 'https://api.todoist.com/rest/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async createTask(task: Omit<TodoistTask, 'id' | 'isCompleted' | 'createdAt'>): Promise<TodoistTask> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/tasks`,
        {
          content: task.content,
          description: task.description,
          due_date: task.dueDate?.toISOString(),
          priority: task.priority,
          labels: task.labels,
          project_id: task.projectId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const createdTask: TodoistTask = {
        id: response.data.id,
        content: response.data.content,
        description: response.data.description,
        dueDate: response.data.due ? new Date(response.data.due.date) : undefined,
        priority: response.data.priority,
        labels: response.data.labels,
        projectId: response.data.project_id,
        isCompleted: false,
        createdAt: new Date(response.data.created_at),
      };

      logger.info('Todoist task created', {
        taskId: createdTask.id,
        content: task.content,
      });

      return createdTask;
    } catch (error) {
      logger.error('Failed to create Todoist task', { error, task });
      throw error;
    }
  }

  async getTasks(projectId?: string): Promise<TodoistTask[]> {
    try {
      const params: any = {};
      if (projectId) {
        params.project_id = projectId;
      }

      const response = await axios.get(
        `${this.baseUrl}/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
          params,
        }
      );

      const tasks: TodoistTask[] = response.data.map((task: any) => ({
        id: task.id,
        content: task.content,
        description: task.description,
        dueDate: task.due ? new Date(task.due.date) : undefined,
        priority: task.priority,
        labels: task.labels,
        projectId: task.project_id,
        isCompleted: task.completed,
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      }));

      logger.info('Todoist tasks retrieved', {
        count: tasks.length,
        projectId,
      });

      return tasks;
    } catch (error) {
      logger.error('Failed to get Todoist tasks', { error, projectId });
      throw error;
    }
  }

  async getTask(taskId: string): Promise<TodoistTask | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      const task: TodoistTask = {
        id: response.data.id,
        content: response.data.content,
        description: response.data.description,
        dueDate: response.data.due ? new Date(response.data.due.date) : undefined,
        priority: response.data.priority,
        labels: response.data.labels,
        projectId: response.data.project_id,
        isCompleted: response.data.completed,
        createdAt: new Date(response.data.created_at),
        completedAt: response.data.completed_at ? new Date(response.data.completed_at) : undefined,
      };

      logger.info('Todoist task retrieved', { taskId });

      return task;
    } catch (error) {
      logger.error('Failed to get Todoist task', { error, taskId });
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<TodoistTask>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate.toISOString();
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.labels !== undefined) updateData.labels = updates.labels;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;

      await axios.post(
        `${this.baseUrl}/tasks/${taskId}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Todoist task updated', { taskId, updates });
    } catch (error) {
      logger.error('Failed to update Todoist task', { error, taskId, updates });
      throw error;
    }
  }

  async completeTask(taskId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/tasks/${taskId}/close`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      logger.info('Todoist task completed', { taskId });
    } catch (error) {
      logger.error('Failed to complete Todoist task', { error, taskId });
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      logger.info('Todoist task deleted', { taskId });
    } catch (error) {
      logger.error('Failed to delete Todoist task', { error, taskId });
      throw error;
    }
  }

  async getProjects(): Promise<TodoistProject[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/projects`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      const projects: TodoistProject[] = response.data.map((project: any) => ({
        id: project.id,
        name: project.name,
        color: project.color,
        order: project.order,
      }));

      logger.info('Todoist projects retrieved', {
        count: projects.length,
      });

      return projects;
    } catch (error) {
      logger.error('Failed to get Todoist projects', { error });
      throw error;
    }
  }

  async createProject(name: string, color?: string): Promise<TodoistProject> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/projects`,
        {
          name,
          color: color || 'blue',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const project: TodoistProject = {
        id: response.data.id,
        name: response.data.name,
        color: response.data.color,
        order: response.data.order,
      };

      logger.info('Todoist project created', {
        projectId: project.id,
        name: project.name,
      });

      return project;
    } catch (error) {
      logger.error('Failed to create Todoist project', { error, name });
      throw error;
    }
  }

  async getTasksByLabel(label: string): Promise<TodoistTask[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/tasks`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
          params: {
            label: label,
          },
        }
      );

      const tasks: TodoistTask[] = response.data.map((task: any) => ({
        id: task.id,
        content: task.content,
        description: task.description,
        dueDate: task.due ? new Date(task.due.date) : undefined,
        priority: task.priority,
        labels: task.labels,
        projectId: task.project_id,
        isCompleted: task.completed,
        createdAt: new Date(task.created_at),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
      }));

      logger.info('Todoist tasks by label retrieved', {
        count: tasks.length,
        label,
      });

      return tasks;
    } catch (error) {
      logger.error('Failed to get Todoist tasks by label', { error, label });
      throw error;
    }
  }
}






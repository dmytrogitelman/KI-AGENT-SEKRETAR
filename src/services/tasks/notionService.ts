import axios from 'axios';
import { logger } from '../../utils/logger';

export interface NotionTask {
  id?: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: Date;
  assignee?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  url: string;
}

export class NotionService {
  private apiToken: string;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async createTask(task: Omit<NotionTask, 'id' | 'createdAt' | 'updatedAt'>, databaseId: string): Promise<NotionTask> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pages`,
        {
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [
                {
                  text: {
                    content: task.title,
                  },
                },
              ],
            },
            Status: {
              select: {
                name: task.status,
              },
            },
            Priority: {
              select: {
                name: task.priority,
              },
            },
            ...(task.description && {
              Description: {
                rich_text: [
                  {
                    text: {
                      content: task.description,
                    },
                  },
                ],
              },
            }),
            ...(task.dueDate && {
              'Due Date': {
                date: {
                  start: task.dueDate.toISOString().split('T')[0],
                },
              },
            }),
            ...(task.assignee && {
              Assignee: {
                rich_text: [
                  {
                    text: {
                      content: task.assignee,
                    },
                  },
                ],
              },
            }),
            ...(task.tags && task.tags.length > 0 && {
              Tags: {
                multi_select: task.tags.map(tag => ({ name: tag })),
              },
            }),
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      const createdTask: NotionTask = {
        id: response.data.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignee: task.assignee,
        tags: task.tags,
        createdAt: new Date(response.data.created_time),
        updatedAt: new Date(response.data.last_edited_time),
      };

      logger.info('Notion task created', {
        taskId: createdTask.id,
        title: task.title,
        databaseId,
      });

      return createdTask;
    } catch (error) {
      logger.error('Failed to create Notion task', { error, task, databaseId });
      throw error;
    }
  }

  async getTasks(databaseId: string): Promise<NotionTask[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/databases/${databaseId}/query`,
        {
          sorts: [
            {
              property: 'Created',
              direction: 'descending',
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      const tasks: NotionTask[] = response.data.results.map((page: any) => {
        const properties = page.properties;
        return {
          id: page.id,
          title: properties.Name?.title?.[0]?.text?.content || 'Untitled',
          description: properties.Description?.rich_text?.[0]?.text?.content,
          status: properties.Status?.select?.name || 'Not Started',
          priority: properties.Priority?.select?.name || 'Medium',
          dueDate: properties['Due Date']?.date?.start ? new Date(properties['Due Date'].date.start) : undefined,
          assignee: properties.Assignee?.rich_text?.[0]?.text?.content,
          tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
          createdAt: new Date(page.created_time),
          updatedAt: new Date(page.last_edited_time),
        };
      });

      logger.info('Notion tasks retrieved', {
        count: tasks.length,
        databaseId,
      });

      return tasks;
    } catch (error) {
      logger.error('Failed to get Notion tasks', { error, databaseId });
      throw error;
    }
  }

  async getTask(taskId: string): Promise<NotionTask | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pages/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );

      const properties = response.data.properties;
      const task: NotionTask = {
        id: response.data.id,
        title: properties.Name?.title?.[0]?.text?.content || 'Untitled',
        description: properties.Description?.rich_text?.[0]?.text?.content,
        status: properties.Status?.select?.name || 'Not Started',
        priority: properties.Priority?.select?.name || 'Medium',
        dueDate: properties['Due Date']?.date?.start ? new Date(properties['Due Date'].date.start) : undefined,
        assignee: properties.Assignee?.rich_text?.[0]?.text?.content,
        tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
        createdAt: new Date(response.data.created_time),
        updatedAt: new Date(response.data.last_edited_time),
      };

      logger.info('Notion task retrieved', { taskId });

      return task;
    } catch (error) {
      logger.error('Failed to get Notion task', { error, taskId });
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<NotionTask>): Promise<void> {
    try {
      const updateProperties: any = {};

      if (updates.title !== undefined) {
        updateProperties.Name = {
          title: [
            {
              text: {
                content: updates.title,
              },
            },
          ],
        };
      }

      if (updates.status !== undefined) {
        updateProperties.Status = {
          select: {
            name: updates.status,
          },
        };
      }

      if (updates.priority !== undefined) {
        updateProperties.Priority = {
          select: {
            name: updates.priority,
          },
        };
      }

      if (updates.description !== undefined) {
        updateProperties.Description = {
          rich_text: [
            {
              text: {
                content: updates.description,
              },
            },
          ],
        };
      }

      if (updates.dueDate !== undefined) {
        updateProperties['Due Date'] = {
          date: {
            start: updates.dueDate.toISOString().split('T')[0],
          },
        };
      }

      if (updates.assignee !== undefined) {
        updateProperties.Assignee = {
          rich_text: [
            {
              text: {
                content: updates.assignee,
              },
            },
          ],
        };
      }

      if (updates.tags !== undefined) {
        updateProperties.Tags = {
          multi_select: updates.tags.map(tag => ({ name: tag })),
        };
      }

      await axios.patch(
        `${this.baseUrl}/pages/${taskId}`,
        {
          properties: updateProperties,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      logger.info('Notion task updated', { taskId, updates });
    } catch (error) {
      logger.error('Failed to update Notion task', { error, taskId, updates });
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await axios.patch(
        `${this.baseUrl}/pages/${taskId}`,
        {
          archived: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      logger.info('Notion task deleted', { taskId });
    } catch (error) {
      logger.error('Failed to delete Notion task', { error, taskId });
      throw error;
    }
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          filter: {
            value: 'database',
            property: 'object',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      const databases: NotionDatabase[] = response.data.results.map((db: any) => ({
        id: db.id,
        title: db.title?.[0]?.text?.content || 'Untitled Database',
        description: db.description?.[0]?.text?.content,
        url: db.url,
      }));

      logger.info('Notion databases retrieved', {
        count: databases.length,
      });

      return databases;
    } catch (error) {
      logger.error('Failed to get Notion databases', { error });
      throw error;
    }
  }

  async createDatabase(title: string, parentPageId: string): Promise<NotionDatabase> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/databases`,
        {
          parent: {
            type: 'page_id',
            page_id: parentPageId,
          },
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
          properties: {
            Name: {
              title: {},
            },
            Status: {
              select: {
                options: [
                  { name: 'Not Started', color: 'gray' },
                  { name: 'In Progress', color: 'blue' },
                  { name: 'Completed', color: 'green' },
                ],
              },
            },
            Priority: {
              select: {
                options: [
                  { name: 'Low', color: 'gray' },
                  { name: 'Medium', color: 'yellow' },
                  { name: 'High', color: 'orange' },
                  { name: 'Urgent', color: 'red' },
                ],
              },
            },
            'Due Date': {
              date: {},
            },
            Assignee: {
              rich_text: {},
            },
            Tags: {
              multi_select: {},
            },
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
        }
      );

      const database: NotionDatabase = {
        id: response.data.id,
        title: response.data.title?.[0]?.text?.content || title,
        url: response.data.url,
      };

      logger.info('Notion database created', {
        databaseId: database.id,
        title: database.title,
      });

      return database;
    } catch (error) {
      logger.error('Failed to create Notion database', { error, title, parentPageId });
      throw error;
    }
  }
}






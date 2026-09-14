import type { Board, BoardColumn, Project, TaskCard } from '../types/kanban';

const BASE_URL = '/api';

export const kanbanApi = {
  async getBoard(): Promise<Board> {
    const res = await fetch(`${BASE_URL}/board`);
    if (!res.ok) throw new Error('Failed to load board');
    return res.json();
  },

  async createTask(data: {
    columnId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<TaskCard> {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(
    id: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
    }
  ): Promise<TaskCard> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async moveTask(id: string, targetColumnId: string, newPosition: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/tasks/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetColumnId, newPosition }),
    });
    if (!res.ok) throw new Error('Failed to move task');
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async createColumn(boardId: string, name: string): Promise<BoardColumn> {
    const res = await fetch(`${BASE_URL}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, name }),
    });
    if (!res.ok) throw new Error('Failed to create column');
    return res.json();
  },

  async deleteColumn(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/columns/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete column');
  },
};

export const projectApi = {
  async listProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects`);
    if (!res.ok) throw new Error('Failed to load projects');
    return res.json();
  },

  async createProject(data: {
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(
    id: string,
    data: {
      name: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
    }
  ): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  },
};

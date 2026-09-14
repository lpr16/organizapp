import type { Board, BoardColumn, BoardLane, BpmnDiagram, Project, TaskCard } from '../types/kanban';

const BASE_URL = '/api';

export const kanbanApi = {
  async getBoard(): Promise<Board> {
    const res = await fetch(`${BASE_URL}/board`);
    if (!res.ok) throw new Error('Failed to load board');
    return res.json();
  },

  async createTask(data: {
    columnId: string;
    laneId?: string;
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

  async moveTask(
    id: string,
    targetColumnId: string,
    targetLaneId: string,
    newPosition: number
  ): Promise<void> {
    const res = await fetch(`${BASE_URL}/tasks/${id}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetColumnId, targetLaneId, newPosition }),
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

  async renameColumn(id: string, name: string): Promise<BoardColumn> {
    const res = await fetch(`${BASE_URL}/columns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to rename column');
    return res.json();
  },

  async reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
    const res = await fetch(`${BASE_URL}/columns/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, columnIds }),
    });
    if (!res.ok) throw new Error('Failed to reorder columns');
  },

  async deleteColumn(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/columns/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete column');
  },

  async createLane(boardId: string, name: string): Promise<BoardLane> {
    const res = await fetch(`${BASE_URL}/lanes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, name }),
    });
    if (!res.ok) throw new Error('Failed to create lane');
    return res.json();
  },

  async renameLane(id: string, name: string): Promise<BoardLane> {
    const res = await fetch(`${BASE_URL}/lanes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to rename lane');
    return res.json();
  },

  async reorderLanes(boardId: string, laneIds: string[]): Promise<void> {
    const res = await fetch(`${BASE_URL}/lanes/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId, laneIds }),
    });
    if (!res.ok) throw new Error('Failed to reorder lanes');
  },

  async deleteLane(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/lanes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lane');
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

export const diagramApi = {
  async listDiagrams(): Promise<BpmnDiagram[]> {
    const res = await fetch(`${BASE_URL}/diagrams`);
    if (!res.ok) throw new Error('Failed to load diagrams');
    return res.json();
  },

  async getDiagram(id: string): Promise<BpmnDiagram> {
    const res = await fetch(`${BASE_URL}/diagrams/${id}`);
    if (!res.ok) throw new Error('Failed to load diagram');
    return res.json();
  },

  async createDiagram(data: { name: string; xml?: string }): Promise<BpmnDiagram> {
    const res = await fetch(`${BASE_URL}/diagrams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create diagram');
    return res.json();
  },

  async updateDiagram(id: string, data: { name?: string; xml?: string }): Promise<BpmnDiagram> {
    const res = await fetch(`${BASE_URL}/diagrams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save diagram');
    return res.json();
  },

  async deleteDiagram(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/diagrams/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete diagram');
  },
};

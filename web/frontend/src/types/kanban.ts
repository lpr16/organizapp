export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskCard {
  id: string;
  columnId: string;
  laneId: string;
  title: string;
  description: string;
  priority: Priority;
  position: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  tasks: TaskCard[];
}

export interface BoardLane {
  id: string;
  boardId: string;
  name: string;
  position: number;
}

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  columns: BoardColumn[];
  lanes: BoardLane[];
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

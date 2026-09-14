export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskCard {
  id: string;
  columnId: string;
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

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  columns: BoardColumn[];
}

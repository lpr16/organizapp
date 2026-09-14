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
  projectId: string | null;
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
  seasonId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  name: string;
  notes: string;
  startsOn: string;
  endsOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BpmnDiagram {
  id: string;
  name: string;
  xml: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceTransaction {
  id: string;
  occurredOn: string;
  description: string;
  amountCents: number;
  type: TransactionType;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const FINANCE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Health',
  'Utilities',
  'Research',
  'Work',
  'Leisure',
  'Income',
  'Other',
] as const;

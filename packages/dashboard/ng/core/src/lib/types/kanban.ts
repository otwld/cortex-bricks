/**
 * Kanban card rendered by dashboard board demos.
 */
export interface KanbanCardType {
  id: string;
  title?: string;
  description?: string;
  progress?: number;
  assignees?: Assignee[];
  attachments?: number;
  comments?: Comment[];
  startDate?: string;
  dueDate?: string;
  completed?: boolean;
  priority?: object;
  taskList: TaskList;
}

/**
 * Kanban list containing ordered cards.
 */
export interface KanbanListType {
  listId: string;
  title?: string;
  cards: KanbanCardType[];
}

/**
 * Comment attached to a kanban card.
 */
export interface Comment {
  id?: string;
  name: string;
  image?: string;
  text: string;
}

/**
 * List identifier and display name used by kanban selectors.
 */
export interface ListName {
  listId?: string;
  title: string;
}

/**
 * Task group attached to a kanban card.
 */
export interface TaskList {
  id?: string;
  title: string;
  tasks: Task[];
}

/**
 * Checklist task inside a kanban task list.
 */
export interface Task {
  text: string;
  completed: boolean;
}

/**
 * User assigned to a kanban card.
 */
export interface Assignee {
  name: string;
  image: string;
}

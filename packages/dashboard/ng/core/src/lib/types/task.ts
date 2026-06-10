/**
 * Task item used by dashboard task-list demos.
 */
export interface Task {
  id: number;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  members?: Member[];
  completed?: boolean;
  status?: string;
  comments?: number;
  attachments?: number;
}

/**
 * Member assigned to a dashboard task item.
 */
export interface Member {
  name?: string;
  image?: string;
}

/**
 * Dialog state used by dashboard task-list demos.
 */
export interface DialogConfig {
  visible: boolean;
  header?: string;
  newTask?: boolean;
}

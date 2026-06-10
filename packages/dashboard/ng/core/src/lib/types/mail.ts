/**
 * Mail item used by dashboard mail demos.
 */
export interface Mail {
  id?: number | string;
  from?: string;
  to?: string;
  email?: string;
  image?: string;
  date?: string;
  message?: string;
  title?: string;
  important?: boolean;
  starred?: boolean;
  trash?: boolean;
  archived?: boolean;
  spam?: boolean;
  sent?: boolean;
}

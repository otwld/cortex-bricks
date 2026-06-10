/**
 * Customer country metadata used by dashboard table demos.
 */
export interface Country {
  name?: string;
  code?: string;
}

/**
 * Customer representative metadata used by dashboard table demos.
 */
export interface Representative {
  name?: string;
  image?: string;
}

/**
 * Customer row used by dashboard table demos.
 */
export interface Customer {
  id?: number;
  name?: string;
  country?: Country;
  company?: string;
  date?: string;
  status?: string;
  activity?: number;
  representative?: Representative;
}

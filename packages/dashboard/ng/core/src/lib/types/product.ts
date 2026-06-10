interface InventoryStatus {
  label: string;
  value: string;
}

/**
 * Product row used by dashboard ecommerce demos.
 */
export interface Product {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  inventoryStatus?: InventoryStatus;
  category?: string;
  image?: string;
  rating?: number;
}

export interface BatchReservation {
  batchId: string;
  quantity: number;
  expiryDate?: string;
}

export interface CartItem {
  productId: string;
  shopId: string; // Thêm shopId để reserve inventory
  productName?: string;
  price?: number;
  quantity: number;
  reservations?: BatchReservation[]; // Lưu thông tin batch đã reserve
  addedAt: Date;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: Date;
}

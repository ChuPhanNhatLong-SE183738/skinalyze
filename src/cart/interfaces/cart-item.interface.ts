export interface CartItem {
  productId: string;
  productName?: string;
  price?: number;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: Date;
}

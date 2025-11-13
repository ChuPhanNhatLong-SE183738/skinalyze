import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart, CartItem } from './interfaces/cart-item.interface';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { AddressService } from '../address/address.service';
import {
  calculateDistance,
  geocodeAddress,
  SHOP_LOCATIONS,
} from '../utils/location';

@Injectable()
export class CartService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly addressService: AddressService,
  ) {}

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  private calculateFinalPrice(
    sellingPrice: number,
    salePercentage: number | null,
  ): number {
    if (!salePercentage || salePercentage <= 0) {
      return sellingPrice;
    }

    const discount = (sellingPrice * salePercentage) / 100;
    const finalPrice = sellingPrice - discount;

    return Math.round(finalPrice);
  }

  async getCart(userId: string): Promise<Cart> {
    const cartKey = this.getCartKey(userId);
    const cart = await this.cacheManager.get<Cart>(cartKey);

    if (!cart) {
      // Return empty cart
      return {
        userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        updatedAt: new Date(),
      };
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;
    console.log('🔍 [DEBUG] Starting addToCart...', { userId, productId, quantity });

    try {
      //redis connection testing
      const testKey = `test:${Date.now()}`;
      await this.cacheManager.set(testKey, 'test', 10000); // 10s
      const testValue = await this.cacheManager.get(testKey);
      console.log('[DEBUG] Redis connection test:', { testValue });

      // Verify product exists
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Get current cart first to check if product exists
      const cart = await this.getCart(userId);
      console.log('[DEBUG] Current cart:', cart);

      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId === productId,
      );

      //RESERVE INVENTORY (only reserve the NEW quantity being added)
      const reserveResult = await this.inventoryService.reserveStock(
        productId,
        quantity,
      );

      if (!reserveResult.success) {
        throw new BadRequestException('Không đủ hàng trong kho');
      }

      const finalPrice = this.calculateFinalPrice(
        product.sellingPrice,
        product.salePercentage,
      );

      if (existingItemIndex > -1) {
        // Update quantity if product exists
        cart.items[existingItemIndex].quantity += quantity;
        // Update price (trường hợp sale percentage thay đổi)
        cart.items[existingItemIndex].price = finalPrice;
        cart.items[existingItemIndex].originalPrice = product.sellingPrice;
        cart.items[existingItemIndex].salePercentage = product.salePercentage || 0;
      } else {
        const newItem: CartItem = {
          productId,
          productName: product.productName,
          price: finalPrice,
          originalPrice: product.sellingPrice,
          salePercentage: product.salePercentage || 0,
          quantity,
          addedAt: new Date(),
          selected: true, // Mặc định chọn khi thêm vào cart
        };
        cart.items.push(newItem);
      }

      // Recalculate totals
      cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + (item.price || 0) * item.quantity,
        0,
      );
      cart.updatedAt = new Date();

      // Save to Redis with TTL (24 hours)
      const cartKey = this.getCartKey(userId);
      await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours in milliseconds
      console.log('[DEBUG] Cart saved to Redis with key:', cartKey, 'Items:', cart.items.length);

      return cart;
    } catch (error) {
      console.error('[DEBUG] Error in addToCart:', error);
      throw error;
    }
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const { quantity } = updateCartItemDto;

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in cart`,
      );
    }

    const oldQuantity = cart.items[itemIndex].quantity;
    const quantityDiff = quantity - oldQuantity;

    // Adjust inventory reservation based on quantity change
    if (quantityDiff > 0) {
      // Need to reserve MORE stock
      const reserveResult = await this.inventoryService.reserveStock(
        productId,
        quantityDiff,
      );
      if (!reserveResult.success) {
        throw new BadRequestException(
          `Cannot increase quantity. Only ${oldQuantity} available in stock.`,
        );
      }
    } else if (quantityDiff < 0) {
      // Need to release SOME stock
      await this.inventoryService.releaseReservation(
        productId,
        Math.abs(quantityDiff),
      );
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity;

    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );
    cart.updatedAt = new Date();

    // ✅ Save to Redis with TTL
    const cartKey = this.getCartKey(userId);
    await this.cacheManager.set(cartKey, cart);

    return cart;
  }

  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundException(
        `Product with ID ${productId} not found in cart`,
      );
    }

    const item = cart.items[itemIndex];

    // 🔥 RELEASE INVENTORY RESERVATION (simplified)
    await this.inventoryService.releaseReservation(
      item.productId,
      item.quantity,
    );

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );
    cart.updatedAt = new Date();

    // ✅ Save to Redis
    const cartKey = this.getCartKey(userId);
    if (cart.items.length === 0) {
      // Delete cart if empty
      await this.cacheManager.del(cartKey);
    } else {
      await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours
    }

    return cart;
  }

  /**
   * ✅ Toggle select/unselect item trong cart
   */
  async toggleSelectItem(
    userId: string,
    productId: string,
    selected: boolean,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);

    const item = cart.items.find((item) => item.productId === productId);

    if (!item) {
      throw new NotFoundException('Product not found in cart');
    }

    item.selected = selected;
    cart.updatedAt = new Date();

    // ✅ Save to Redis with TTL
    const cartKey = this.getCartKey(userId);
    await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours

    return cart;
  }

  /**
   * ✅ Select/unselect tất cả items
   */
  async toggleSelectAll(userId: string, selected: boolean): Promise<Cart> {
    const cart = await this.getCart(userId);

    cart.items.forEach((item) => {
      item.selected = selected;
    });
    cart.updatedAt = new Date();

    // ✅ Save to Redis with TTL
    const cartKey = this.getCartKey(userId);
    await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours

    return cart;
  }

  /**
   * ✅ Lấy danh sách items đã chọn để checkout
   */
  getSelectedItems(cart: Cart): CartItem[] {
    return cart.items.filter((item) => item.selected === true);
  }

  /**
   * ✅ Xóa tất cả items đã chọn khỏi cart (sau khi checkout)
   */
  async removeSelectedItems(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    // Giữ lại các items CHƯA được chọn
    cart.items = cart.items.filter((item) => item.selected !== true);

    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );
    cart.updatedAt = new Date();

    // ✅ Save to Redis
    const cartKey = this.getCartKey(userId);
    if (cart.items.length === 0) {
      // Delete cart if empty
      await this.cacheManager.del(cartKey);
    } else {
      await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours
    }

    return cart;
  }

  async clearCart(userId: string): Promise<void> {
    // 🔥 RELEASE ALL RESERVATIONS before clearing
    const cart = await this.getCart(userId);
    if (cart && cart.items.length > 0) {
      for (const item of cart.items) {
        await this.inventoryService.releaseReservation(
          item.productId,
          item.quantity,
        );
      }
    }

    const cartKey = this.getCartKey(userId);
    await this.cacheManager.del(cartKey);
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.totalItems;
  }

  /**
   * Xóa các items cụ thể theo productIds
   */
  async removeItemsByProductIds(userId: string, productIds: string[]): Promise<Cart> {
    const cart = await this.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Lọc bỏ items có productId trong danh sách
    cart.items = cart.items.filter(
      item => !productIds.includes(item.productId)
    );

    // Recalculate totals
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );

    const cartKey = this.getCartKey(userId);

    if (cart.items.length === 0) {
      // Nếu cart rỗng → xóa luôn
      await this.cacheManager.del(cartKey);
      return { userId, items: [], totalPrice: 0, totalItems: 0, updatedAt: new Date() };
    }

    // ✅ Lưu lại cart đã update với TTL
    cart.updatedAt = new Date();
    await this.cacheManager.set(cartKey, cart, 86400000); // 24 hours
    return cart;
  }
}
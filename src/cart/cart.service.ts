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

    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get current cart first to check if product exists
    const cart = await this.getCart(userId);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    // 🔥 RESERVE INVENTORY (only reserve the NEW quantity being added)
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

    // Save to Redis
    const cartKey = this.getCartKey(userId);
    await this.cacheManager.set(cartKey, cart);

    return cart;
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

    // Save to Redis
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

    // Save to Redis
    const cartKey = this.getCartKey(userId);
    if (cart.items.length === 0) {
      // Delete cart if empty
      await this.cacheManager.del(cartKey);
    } else {
      await this.cacheManager.set(cartKey, cart);
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

  // 🔄 Sync cart with inventory reservations
  async syncCartReservations(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);

    if (!cart || cart.items.length === 0) {
      return cart;
    }

    for (const item of cart.items) {
      // Release any existing reservation (ignore errors if nothing reserved)
      try {
        await this.inventoryService.releaseReservation(
          item.productId,
          item.quantity,
        );
      } catch (error) {
        // Ignore - nothing was reserved
        console.log(
          `No reservation to release for product ${item.productId}`,
        );
      }

      // Re-reserve correct amount from cart
      const reserveResult = await this.inventoryService.reserveStock(
        item.productId,
        item.quantity,
      );

      if (!reserveResult.success) {
        throw new BadRequestException(
          `Cannot reserve ${item.quantity} of ${item.productName}. Insufficient stock available. Please adjust quantity.`,
        );
      }
    }

    console.log(`✅ Synced reservations for cart ${userId}`);
    return cart;
  }
}

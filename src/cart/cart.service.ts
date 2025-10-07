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
    const { productId, quantity, addressId } = addToCartDto;

    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 🔥 TỰ ĐỘNG CHỌN SHOP GẦN NHẤT
    const shopId = await this.findNearestShop(
      userId,
      productId,
      quantity,
      addressId,
    );

    // 🔥 RESERVE INVENTORY (FEFO - First Expire First Out)
    const reserveResult = await this.inventoryService.reserveStock(
      shopId,
      productId,
      quantity,
    );

    if (!reserveResult.success) {
      throw new BadRequestException('Không đủ hàng trong kho');
    }

    // Get current cart
    const cart = await this.getCart(userId);

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId && item.shopId === shopId,
    );

    // Convert Date to string for Redis storage
    const reservations = reserveResult.reservations.map((r) => ({
      batchId: r.batchId,
      quantity: r.quantity,
      expiryDate: r.expiryDate ? r.expiryDate.toISOString() : undefined,
    }));

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
      // Merge reservations
      const existingReservations =
        cart.items[existingItemIndex].reservations || [];
      cart.items[existingItemIndex].reservations = this.mergeReservations(
        existingReservations,
        reservations,
      );
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        productId,
        shopId,
        productName: product.productName,
        price: product.sellingPrice,
        quantity,
        reservations: reservations,
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

  // Helper: Merge reservations
  private mergeReservations(existing: any[], newReservations: any[]): any[] {
    const merged = [...existing];
    for (const newRes of newReservations) {
      const existingRes = merged.find((r) => r.batchId === newRes.batchId);
      if (existingRes) {
        existingRes.quantity += newRes.quantity;
      } else {
        merged.push({ ...newRes });
      }
    }
    return merged;
  }

  // 🔥 TỰ ĐỘNG TÌM KHO GẦN NHẤT CÓ ĐỦ HÀNG
  private async findNearestShop(
    userId: string,
    productId: string,
    quantity: number,
    addressId?: string,
  ): Promise<string> {
    // 1. Lấy địa chỉ của user
    let userAddress;
    if (addressId) {
      userAddress = await this.addressService.findOne(addressId);
    } else {
      // Lấy địa chỉ đầu tiên của user (default)
      const addresses = await this.addressService.findByUserId(userId);
      if (!addresses || addresses.length === 0) {
        throw new BadRequestException(
          'Vui lòng thêm địa chỉ giao hàng trước khi mua hàng',
        );
      }
      userAddress = addresses[0]; // Lấy địa chỉ đầu tiên
    }

    // 2. Geocode địa chỉ user thành tọa độ
    const userLocation = geocodeAddress({
      district: userAddress.district,
      city: userAddress.city,
    });

    // 3. Query tất cả INVENTORY (kho) có sản phẩm này + còn hàng available
    const availableInventories =
      await this.inventoryService.findAvailableInventories(productId, quantity);

    if (!availableInventories || availableInventories.length === 0) {
      throw new BadRequestException(
        'Sản phẩm hiện không có sẵn tại bất kỳ kho nào',
      );
    }

    // 4. Tính khoảng cách từ user address đến mỗi inventory address
    let nearestInventory = availableInventories[0];
    let minDistance = Infinity;

    for (const inventory of availableInventories) {
      // Geocode inventory address
      const inventoryLocation = geocodeAddress({
        district: this.extractDistrict(inventory.address),
        city: 'Ho Chi Minh City', // Giả định HCM, có thể parse từ address
      });

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lon,
        inventoryLocation.lat,
        inventoryLocation.lon,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestInventory = inventory;
      }
    }

    console.log(
      `✅ Chọn kho: ${nearestInventory.shopId} tại ${nearestInventory.address} (cách ${minDistance.toFixed(2)} km)`,
    );

    return nearestInventory.shopId;
  }

  // Helper: Extract district from address string
  private extractDistrict(address: string): string {
    // Simple extraction: "123 Nguyen Hue, Quan 1, HCM" → "Quan 1"
    const parts = address.split(',');
    if (parts.length >= 2) {
      return parts[1].trim();
    }
    return 'Quận 1'; // Default
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

    // 🔥 RELEASE INVENTORY RESERVATIONS
    if (item.reservations && item.reservations.length > 0) {
      for (const reservation of item.reservations) {
        await this.inventoryService.releaseReservation(
          item.shopId,
          item.productId,
          reservation.batchId,
          reservation.quantity,
        );
      }
    }

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
        if (item.reservations && item.reservations.length > 0) {
          for (const reservation of item.reservations) {
            await this.inventoryService.releaseReservation(
              item.shopId,
              item.productId,
              reservation.batchId,
              reservation.quantity,
            );
          }
        }
      }
    }

    const cartKey = this.getCartKey(userId);
    await this.cacheManager.del(cartKey);
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.totalItems;
  }
}

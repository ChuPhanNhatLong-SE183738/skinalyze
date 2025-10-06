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

@Injectable()
export class CartService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly productsService: ProductsService,
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
    const { productId, quantity } = addToCartDto;

    // Verify product exists
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // Get current cart
    const cart = await this.getCart(userId);

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (existingItemIndex > -1) {
      // Update quantity if product exists
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      const newItem: CartItem = {
        productId,
        productName: product.productName,
        price: product.sellingPrice,
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
    const cartKey = this.getCartKey(userId);
    await this.cacheManager.del(cartKey);
  }

  async getCartItemCount(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.totalItems;
  }
}

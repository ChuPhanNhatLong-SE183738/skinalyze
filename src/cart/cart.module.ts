import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AddressModule } from '../address/address.module';

console.log('🔵 [CartModule] Module file loaded'); // ✅ Log 1

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('🔧 [Redis] useFactory called'); // ✅ Log 2

        const redisConfig = {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT') || '6379'),
          password: configService.get('REDIS_PASSWORD') || undefined,
          ttl: 0,
        };

        console.log('🔧 [Redis] Config:', {
          host: redisConfig.host,
          port: redisConfig.port,
          hasPassword: !!redisConfig.password,
        });

        try {
          const store = await redisStore(redisConfig);
          console.log('✅ [Redis] Store created successfully');
          return { store };
        } catch (error) {
          console.error('❌ [Redis] Failed to create store:', error);
          throw error;
        }
      },
    }),
    ProductsModule,
    InventoryModule,
    AddressModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {
  constructor() {
    console.log('🟢 [CartModule] Constructor called'); // ✅ Log 3
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Address } from './address/entities/address.entity';
import { ProductsModule } from './products/products.module';
import { AddressModule } from './address/address.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { BatchesModule } from './batches/batches.module';
import { Batch } from './batches/entities/batch.entity';
import { BatchItem } from './batches/entities/batch-item.entity';
import { StockMovementModule } from './stock-movement/stock-movement.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovement } from './stock-movement/entities/stock-movement.entity';
import { StockMovementItem } from './stock-movement/entities/stock-movement-item.entity';
import { ShopInventory } from './inventory/entities/inventory.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'Naruto1234@'),
        database: configService.get<string>('DB_DATABASE', 'skinalyze'),
        entities: [User, Product, Address, Category, Batch, BatchItem, StockMovement, StockMovementItem, ShopInventory],
        synchronize: configService.get<string>('NODE_ENV', 'development') !== 'production',
        logging: configService.get<string>('NODE_ENV', 'development') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    AddressModule,
    CategoriesModule,
    BatchesModule,
    StockMovementModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

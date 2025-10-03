import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Address } from './address/entities/address.entity';
import { ProductsModule } from './products/products.module';
import { AddressModule } from './address/address.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'Naruto1234@',
      database: process.env.DB_DATABASE || 'skinalyze',
      entities: [User, Product, Address],
      synchronize: process.env.NODE_ENV !== 'production', // Set to false in production
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    AddressModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

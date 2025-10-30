import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Dermatologist } from './dermatologists/entities/dermatologist.entity';
import { Customer } from './customers/entities/customer.entity';
import { SkinAnalysis } from './skin-analysis/entities/skin-analysis.entity';
import { Product } from './products/entities/product.entity';
import { Address } from './address/entities/address.entity';
import { ProductsModule } from './products/products.module';
import { AddressModule } from './address/address.module';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { BatchesModule } from './batches/batches.module';
import { Batch } from './batches/entities/batch.entity';
import { BatchItem } from './batches/entities/batch-item.entity';
import { InventoryModule } from './inventory/inventory.module';
import { Inventory } from './inventory/entities/inventory.entity';
import { CartModule } from './cart/cart.module';
import { CustomersModule } from './customers/customers.module';
import { SkinAnalysisModule } from './skin-analysis/skin-analysis.module';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { TransactionsModule } from './transactions/transactions.module';
import { Transaction } from './transactions/entities/transaction.entity';
import { ShippingLogsModule } from './shipping-logs/shipping-logs.module';
import { ShippingLog } from './shipping-logs/entities/shipping-log.entity';
import { DermatologistsController } from './dermatologists/dermatologists.controller';
import { DermatologistsModule } from './dermatologists/dermatologists.module';
import { EmailModule } from './email/email.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { TreatmentRoutinesModule } from './treatment-routines/treatment-routines.module';
import { RoutineDetailsModule } from './routine-details/routine-details.module';
import { TreatmentRoutine } from './treatment-routines/entities/treatment-routine.entity';
import { RoutineDetail } from './routine-details/entities/routine-detail.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';
import { FirebaseModule } from './firebase/firebase.module';
import { DeviceToken } from './users/entities/device-token.entity';
import { CustomerSubscriptionModule } from './customer-subscription/customer-subscription.module';
import { CustomerSubscription } from './customer-subscription/entities/customer-subscription.entity';
import { SubscriptionPlan } from './subscription-plans/entities/subscription-plan.entity';
import { SubscriptionPlansModule } from './subscription-plans/subscription-plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'Naruto1234@',
      database: process.env.DB_DATABASE || 'skinalyze',
      entities: [
        User,
        Product,
        Address,
        Category,
        Customer,
        Dermatologist,
        SkinAnalysis,
        Batch,
        BatchItem,
        Inventory,
        Order,
        OrderItem,
        Transaction,
        ShippingLog,
        Appointment,
        TreatmentRoutine,
        RoutineDetail,
        Notification,
        DeviceToken,
        SubscriptionPlan,
        CustomerSubscription,
      ],
      synchronize: process.env.NODE_ENV !== 'production', // Set to false in production
      logging: process.env.NODE_ENV === 'development',
    }),
    UsersModule,
    AuthModule,
    ProductsModule,
    AddressModule,
    CategoriesModule,
    BatchesModule,
    InventoryModule,
    CartModule,
    CustomersModule,
    SkinAnalysisModule,
    OrdersModule,
    TransactionsModule,
    ShippingLogsModule,
    DermatologistsModule,
    EmailModule,
    AppointmentsModule,
    TreatmentRoutinesModule,
    RoutineDetailsModule,
    NotificationsModule,
    FirebaseModule,
    SubscriptionPlansModule,
    CustomerSubscriptionModule,
  ],
  controllers: [AppController, DermatologistsController],
  providers: [AppService],
})
export class AppModule {}

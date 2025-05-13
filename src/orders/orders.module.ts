import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { CartModule } from 'src/cart/cart.module';

@Module({
  imports: [PrismaModule, AuthModule, CartModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}

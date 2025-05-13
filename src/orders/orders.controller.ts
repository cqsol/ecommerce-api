import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { AuthService } from '../auth/auth.service'; // To get customer_id
import { CreateOrderDto } from './dto';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('orders')
export class OrdersController {
      constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService, // Inject AuthService
  ) {}

private async getCustomerIdFromRequest(req: AuthRequest): Promise<number> {
    const userProfile = await this.authService.getCustomerProfileBySupabaseUserId(req.user.userId);
    // If getCustomerProfileBySupabaseUserId throws NotFoundException, it will propagate
    return userProfile.customer_id;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) // As per OpenAPI spec
  async createOrder(@Req() req: AuthRequest, @Body() createOrderDto: CreateOrderDto) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.ordersService.createOrder(customerId, createOrderDto);
  }

  @Get() // Matches GET /orders
  @HttpCode(HttpStatus.OK)
  async listMyOrders(@Req() req: AuthRequest) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.ordersService.listOrders(customerId);
  }

  @Get(':order_id') // Matches GET /orders/{order_id}
  @HttpCode(HttpStatus.OK)
  async getMyOrderById(
    @Req() req: AuthRequest,
    @Param('order_id', ParseIntPipe) order_id: number,
  ) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.ordersService.getOrderById(customerId, order_id);
  }
}
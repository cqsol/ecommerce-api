import { Controller, Get, Post, Put, Delete, Param, ParseIntPipe, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { AuthService } from '../auth/auth.service';

@UseGuards(AuthGuard('jwt')) // Protect all routes in this controller
@Controller('cart') // Base path /cart
export class CartController {
     constructor(
    private readonly cartService: CartService,
    private readonly authService: AuthService, // Inject AuthService
  ) {}

  private async getCustomerIdFromRequest(req: AuthRequest): Promise<number> {
    const userProfile = await this.authService.getCustomerProfileBySupabaseUserId(req.user.userId);
    // If getCustomerProfileBySupabaseUserId throws NotFoundException, it will propagate
    return userProfile.customer_id;
  }

  @Get()
  async getMyCart(@Req() req: AuthRequest) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.cartService.getCart(customerId);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK) // OpenAPI spec implies 200 OK for adding item, returning updated cart
  async addItem(@Req() req: AuthRequest, @Body() addToCartDto: AddToCartDto) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.cartService.addItemToCart(customerId, addToCartDto);
  }

  @Put('items/:product_id')
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @Req() req: AuthRequest,
    @Param('product_id', ParseIntPipe) product_id: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.cartService.updateItemQuantity(customerId, product_id, updateCartItemDto);
  }

  @Delete('items/:product_id')
  @HttpCode(HttpStatus.OK) // Returning the updated cart
  async removeItem(
    @Req() req: AuthRequest,
    @Param('product_id', ParseIntPipe) product_id: number,
  ) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.cartService.removeItemFromCart(customerId, product_id);
  }

  @Delete() // Matches DELETE /cart
  @HttpCode(HttpStatus.OK) // Returning the (now empty) cart
  async clearMyCart(@Req() req: AuthRequest) {
    const customerId = await this.getCustomerIdFromRequest(req);
    return this.cartService.clearCart(customerId);
  }
}

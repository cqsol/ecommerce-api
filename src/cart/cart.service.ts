import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';
import { Decimal } from '../../generated/prisma/runtime/library'; // Adjust path if your Prisma client output is different

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCartByCustomerId(customerId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { customer_id: customerId },
      include: {
        items: {
          include: {
            product: true, // Include product details for each cart item
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { customer_id: customerId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }
    return cart;
  }

  // Method to format cart for response
  private formatCartResponse(cartWithDetails: any) {
    const items = cartWithDetails.items.map(item => ({
      product_id: item.product_id,
      name: item.product.name,
      quantity: item.quantity,
      price_per_unit: item.product.price.toString(), // Ensure price is string
      subtotal: (new Decimal(item.product.price).times(item.quantity)).toString(),
    }));

    const grand_total = items.reduce((acc, item) => acc.plus(new Decimal(item.subtotal)), new Decimal(0));

    return {
      cart_id: cartWithDetails.cart_id.toString(), // cart_id is Int, but OpenAPI spec has string example
      items,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      grand_total: grand_total.toString(),
    };
  }

  async getCart(customerId: number) {
    const cart = await this.getOrCreateCartByCustomerId(customerId);
    return this.formatCartResponse(cart);
  }

  async addItemToCart(customerId: number, addToCartDto: AddToCartDto) {
    const { product_id, quantity } = addToCartDto;

    const product = await this.prisma.product.findUnique({ where: { product_id }});
    if (!product) {
      throw new NotFoundException(`Product with ID ${product_id} not found.`);
    }
    if (!product.is_active) {
        throw new BadRequestException(`Product "${product.name}" is not available.`);
    }
    // Basic stock check (more robust checks might be needed at checkout)
    if (product.stock_quantity < quantity) {
        throw new BadRequestException(`Not enough stock for "${product.name}". Available: ${product.stock_quantity}`);
    }

    const cart = await this.getOrCreateCartByCustomerId(customerId);

    // Upsert logic for cart item
    await this.prisma.cartItem.upsert({
      where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
      update: { quantity: { increment: quantity } }, // Or set to new quantity: quantity
      create: { cart_id: cart.cart_id, product_id, quantity },
    });

    const updatedCart = await this.getOrCreateCartByCustomerId(customerId); // Fetch again to get updated totals and items
    return this.formatCartResponse(updatedCart);
  }
    async updateItemQuantity(customerId: number, product_id: number, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    const cart = await this.getOrCreateCartByCustomerId(customerId);

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
      include: { product: true }
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${product_id} not found in cart.`);
    }

    if (quantity === 0) {
      // If quantity is 0, remove the item
      await this.prisma.cartItem.delete({
        where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
      });
    } else {
      // Basic stock check before updating quantity
      if (cartItem.product.stock_quantity < quantity) {
        throw new BadRequestException(`Not enough stock for "${cartItem.product.name}". Available: ${cartItem.product.stock_quantity}`);
      }
      await this.prisma.cartItem.update({
        where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
        data: { quantity },
      });
    }
    const updatedCart = await this.getOrCreateCartByCustomerId(customerId);
    return this.formatCartResponse(updatedCart);
  }

  async removeItemFromCart(customerId: number, product_id: number) {
    const cart = await this.getOrCreateCartByCustomerId(customerId);

    const cartItem = await this.prisma.cartItem.findUnique({
      where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
    });

    if (!cartItem) {
      throw new NotFoundException(`Product with ID ${product_id} not found in cart.`);
    }

    await this.prisma.cartItem.delete({
      where: { cart_id_product_id: { cart_id: cart.cart_id, product_id } },
    });
    const updatedCart = await this.getOrCreateCartByCustomerId(customerId);
    return this.formatCartResponse(updatedCart);
  }

  async clearCart(customerId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { customer_id: customerId },
    });

    if (cart) {
      // If a cart exists, delete all items associated with it
      await this.prisma.cartItem.deleteMany({
        where: { cart_id: cart.cart_id },
      });
    }
    // Even if the cart didn't exist or was already empty,
    // we return the state of the cart (which will be empty).
    const clearedCart = await this.getOrCreateCartByCustomerId(customerId); // This will ensure a cart record exists if it was somehow deleted
    return this.formatCartResponse(clearedCart);
  }
}
import { Injectable, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto';
import { CartService } from '../cart/cart.service'; // To get and clear the cart
import { Decimal } from '../../generated/prisma/runtime/library'; // Adjust path if your Prisma client output is different
import { OrderStatus, Prisma } from '../../generated/prisma'; // Import Prisma namespace for types

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createOrder(customerId: number, createOrderDto: CreateOrderDto) {
    const { shipping_address, billing_address } = createOrderDto;

    // 1. Get the user's cart with items and product details
    const cart = await this.prisma.cart.findUnique({
      where: { customer_id: customerId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cannot create an order from an empty cart.');
    }

    // Use a Prisma Transaction for atomicity
    // This ensures that if any step fails (e.g., stock update),
    // the entire operation is rolled back, preventing inconsistent data.
    try {
      const order = await this.prisma.$transaction(async (prisma) => {
        let totalAmount = new Decimal(0);
        const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        const productUpdates: Prisma.PrismaPromise<any>[] = [];

        // 2. Validate items, calculate total, prepare order items and stock updates
        for (const item of cart.items) {
          const product = item.product;

          if (!product || !product.is_active) {
            throw new ConflictException(`Product "${product?.name || item.product_id}" is no longer available.`);
          }
          if (product.stock_quantity < item.quantity) {
            throw new ConflictException(`Not enough stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
          }

          const itemPrice = new Decimal(product.price);
          totalAmount = totalAmount.plus(itemPrice.times(item.quantity));

          orderItemsData.push({
            product: { // Connect to an existing product
              connect: { product_id: item.product_id }
            },
            name_at_purchase: product.name, // Snapshot name
            quantity: item.quantity,
            price_at_purchase: itemPrice, // Snapshot price
          });

          productUpdates.push(
            prisma.product.update({
              where: { product_id: product.product_id },
              data: { stock_quantity: { decrement: item.quantity } },
            })
          );
        }

        // 3. Create the Order
        const newOrder = await prisma.order.create({
          data: {
            customer_id: customerId,
            total_amount: totalAmount,
            order_status: OrderStatus.PENDING, // Or initial status
            shipping_address,
            billing_address,
            items: {
              create: orderItemsData, // Create order items linked to the order
            },
          },
          include: { items: true }, // Include items in the response
        });

        // 4. Update Product Stock (within the transaction)
        await Promise.all(productUpdates);

        // 5. Clear the user's cart (within the transaction)
        await prisma.cartItem.deleteMany({
          where: { cart_id: cart.cart_id },
        });

        return newOrder;
      });

      // Format the order response if needed (similar to cart formatting)
      // For now, returning the raw Prisma order object
      return order;

    } catch (error) {
      // Catch specific errors thrown within the transaction
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error; // Re-throw client-friendly errors
      }
      console.error('Order creation failed:', error); // Log unexpected errors
      throw new InternalServerErrorException('Failed to create order due to an unexpected error.');
    }
  }

  async listOrders(customerId: number) {
    // Fetch orders for the given customer ID.
    // We'll select specific fields to match the OrderSummary schema in OpenAPI.
    const orders = await this.prisma.order.findMany({
      where: { customer_id: customerId },
      select: {
        order_id: true,
        order_date: true,
        total_amount: true,
        order_status: true,
      },
      orderBy: { order_date: 'desc' }, // Show most recent orders first
    });
    return orders;
  }

  async getOrderById(customerId: number, order_id: number) {
    const order = await this.prisma.order.findUnique({
      where: { order_id },
      include: {
        items: { // Include order items
          select: { // Select specific fields for order items
            order_item_id: true,
            product_id: true,
            name_at_purchase: true,
            quantity: true,
            price_at_purchase: true,
          }
        }
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found.`);
    }
    if (order.customer_id !== customerId) {
      throw new NotFoundException(`Order with ID ${order_id} not found for this customer.`); // Or ForbiddenException if you prefer 403
    }
    return order;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';
import { CreateProductDto, UpdateProductDto } from './dto';
// Make sure the Decimal import path is correct for your Prisma Client generation setup
// If your prisma client is in `../generated/prisma`:
import { Decimal } from '../../generated/prisma/runtime/library';
// If your prisma client is in `node_modules/.prisma/client` (default):
// import { Decimal } from '@prisma/client/runtime/library';

interface FindAllProductsParams {
  page: number;
  limit: number;
  is_active?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll({ page, limit, is_active }: FindAllProductsParams) {
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ProductWhereInput = {};

    if (typeof is_active === 'boolean') {
      where.is_active = is_active;
    }

    return this.prisma.product.findMany({
      skip,
      take,
      where,
    });
  }

  async create(createProductDto: CreateProductDto) {
    const { name, description, price, stock_quantity, image_url, is_active } = createProductDto;
    return this.prisma.product.create({
      data: {
        name,
        description,
        price: new Decimal(price), // Convert number from DTO to Decimal for Prisma
        stock_quantity,
        image_url,
        is_active,
      },
    });
  }

    async findOne(product_id: number) {
    const product = await this.prisma.product.findUnique({
      where: { product_id },
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${product_id}" not found`);
    }
    return product;
  }

    async update(product_id: number, updateProductDto: UpdateProductDto) {
    // First, check if the product exists
    const product = await this.prisma.product.findUnique({
      where: { product_id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${product_id}" not found`);
    }

    const dataToUpdate: Prisma.ProductUpdateInput = { ...updateProductDto };

    // Convert price to Decimal if it's provided in the DTO
    if (updateProductDto.price !== undefined) {
      dataToUpdate.price = new Decimal(updateProductDto.price);
    }

    return this.prisma.product.update({
      where: { product_id },
      data: dataToUpdate,
    });
  }

    async remove(product_id: number) {
    // First, check if the product exists to provide a clear NotFoundException
    const product = await this.prisma.product.findUnique({
      where: { product_id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${product_id}" not found`);
    }

    // If it exists, delete it
    return this.prisma.product.delete({ where: { product_id } });
  }

}
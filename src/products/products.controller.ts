import { Controller, Get, Post, Put, Delete, Body, Query, Param, ParseIntPipe, DefaultValuePipe, ParseBoolPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products') // This will make endpoints available under /products
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('is_active', new DefaultValuePipe(undefined), new ParseBoolPipe({ optional: true })) is_active?: boolean,
  ) {
    // Cap the limit to prevent excessively large requests
    if (limit > 100) {
        limit = 100; 
    }
    return this.productsService.findAll({ // Assuming findAll in service accepts an object
      page,
      limit,
      is_active,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) // Sets the status code to 201 Created on success
  async create(@Body() createProductDto: CreateProductDto) {
    // The ValidationPipe (configured globally in main.ts) will automatically validate createProductDto
    return this.productsService.create(createProductDto);
  }

  @Get(':product_id') // Matches GET /products/{product_id}
  async findOne(@Param('product_id', ParseIntPipe) product_id: number) {
    // ParseIntPipe ensures product_id is a number and handles potential errors if it's not.
    // The service will throw a NotFoundException if the product doesn't exist.
    return this.productsService.findOne(product_id);
  }


  @Put(':product_id') // Matches PUT /products/{product_id}
  async update(
    @Param('product_id', ParseIntPipe) product_id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    // ValidationPipe will validate updateProductDto
    return this.productsService.update(product_id, updateProductDto);
  }

  @Delete(':product_id') // Matches DELETE /products/{product_id}
  @HttpCode(HttpStatus.NO_CONTENT) // Typically, a successful DELETE returns 204 No Content
  async remove(@Param('product_id', ParseIntPipe) product_id: number) {
    // The service will throw a NotFoundException if the product doesn't exist.
    await this.productsService.remove(product_id);
    // No need to return anything in the body for a 204 response.
  }
}
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUrl,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @Type(() => Number) // Transform string to number before validation
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number; // Will be converted to Decimal in the service

  @IsNumber()
  @Min(0)
  stock_quantity: number;

  @IsOptional()
  @IsUrl()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true; // Default to true if not provided
}
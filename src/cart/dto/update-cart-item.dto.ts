import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0, {
    message: 'Quantity must be at least 0. Use 0 to remove the item.',
  }) // Allowing 0 to remove the item, or you can enforce Min(1) and have a separate delete endpoint.
  quantity: number;
}
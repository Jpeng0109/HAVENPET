import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'HVP-PREMIUM-WET' })
  @IsString()
  skuCode: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'wet_food' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ default: 'HAVENPET' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ example: 35.0 })
  @IsNumber()
  @Min(0)
  basePriceUsd: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePriceRmb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

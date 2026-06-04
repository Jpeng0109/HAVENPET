import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSkuDto {
  @ApiProperty({ example: 'HVP-TUNA-3KG' })
  @IsString()
  skuVariantCode: string;

  @ApiPropertyOptional({ example: 'Tuna' })
  @IsOptional()
  @IsString()
  flavour?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ example: '3kg' })
  @IsOptional()
  @IsString()
  weightLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceRmb?: number;

  @ApiPropertyOptional({ example: 540 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional({ description: 'Initial HQ central warehouse stock' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialHqStock?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'DE-MUNICH-01' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'HAVENPET Munich' })
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty()
  @IsString()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 0.19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ example: 0.05 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importDutyRate?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'Maersk' })
  @IsString()
  carrier: string;

  @ApiProperty({ example: 'MSKU1234567' })
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  containerId?: string;

  @ApiPropertyOptional({ example: 'MSC OSCAR' })
  @IsOptional()
  @IsString()
  vesselFlight?: string;

  @ApiPropertyOptional({ example: 'Shanghai' })
  @IsOptional()
  @IsString()
  originPort?: string;

  @ApiPropertyOptional({ example: 'Hamburg' })
  @IsOptional()
  @IsString()
  destinationPort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customsNotes?: string;
}

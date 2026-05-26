import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipmentMilestone } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddMilestoneDto {
  @ApiProperty({ enum: ShipmentMilestone })
  @IsEnum(ShipmentMilestone)
  milestone: ShipmentMilestone;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateShipmentDto } from './create-shipment.dto';

export class UpdateShipmentDto extends PartialType(
  OmitType(CreateShipmentDto, ['orderId'] as const),
) {}

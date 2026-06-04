import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.products.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }

  @Post()
  @Roles(UserRole.hq_admin)
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.hq_admin)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.hq_admin)
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }

  @Post(':productId/skus')
  @Roles(UserRole.hq_admin)
  createSku(@Param('productId') productId: string, @Body() dto: CreateSkuDto) {
    return this.products.createSku(productId, dto);
  }

  @Patch(':productId/skus/:skuId')
  @Roles(UserRole.hq_admin)
  updateSku(
    @Param('productId') _productId: string,
    @Param('skuId') skuId: string,
    @Body() dto: UpdateSkuDto,
  ) {
    return this.products.updateSku(skuId, dto);
  }

  @Delete(':productId/skus/:skuId')
  @Roles(UserRole.hq_admin)
  removeSku(@Param('productId') _productId: string, @Param('skuId') skuId: string) {
    return this.products.removeSku(skuId);
  }
}

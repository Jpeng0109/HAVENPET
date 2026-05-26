import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoresService } from './stores.service';

@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stores')
export class StoresController {
  constructor(private stores: StoresService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.stores.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.stores.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.hq_admin)
  create(@Body() dto: CreateStoreDto) {
    return this.stores.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.hq_admin)
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.stores.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.hq_admin)
  remove(@Param('id') id: string) {
    return this.stores.remove(id);
  }
}

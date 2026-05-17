import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminKeyGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Get('users/search')
  searchUsers(@Query('keyword') keyword = '') {
    return this.adminService.searchUsers(keyword);
  }

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }
}

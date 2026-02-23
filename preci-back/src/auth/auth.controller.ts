import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }

  // TODO: POST /auth/phone/send-otp
  // TODO: POST /auth/phone/verify
  // TODO: POST /auth/google
  // TODO: POST /auth/refresh
  // TODO: POST /auth/logout
}

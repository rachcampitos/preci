import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleUser } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly mobileScheme: string;
  private readonly allowedOrigins: string[];
  private readonly googleConfigured: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:8100',
    );
    this.mobileScheme = this.configService.get('MOBILE_APP_SCHEME', 'preci');
    this.allowedOrigins = [
      'https://preci-5uk.pages.dev',
      'http://localhost:4200',
      'http://localhost:8100',
    ];
    this.googleConfigured = !!(
      this.configService.get('GOOGLE_CLIENT_ID') &&
      this.configService.get('GOOGLE_CLIENT_SECRET')
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }

  @Post('email/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestEmailOtp(dto.email);
  }

  @Post('email/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(dto.email, dto.otp);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  // ── Google OAuth ──────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    if (!this.googleConfigured) {
      throw new BadRequestException(
        'Google OAuth no esta configurado en el servidor',
      );
    }
    // Guard redirects to Google consent screen
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    try {
      let platform = 'web';
      let redirectUri = '';

      const stateParam = req.query.state as string;
      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          platform = state.platform || 'web';
          redirectUri = state.redirectUri || '';
        } catch {}
      }

      const result = await this.authService.googleLogin(req.user);

      const params = new URLSearchParams({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        user: JSON.stringify({
          id: String(result.user._id),
          email: result.user.email,
          displayName: result.user.displayName,
          avatarUrl: result.user.avatarUrl,
        }),
        is_new_user: result.isNewUser ? 'true' : 'false',
      });

      if (platform === 'mobile') {
        res.redirect(
          `${this.mobileScheme}://oauth/callback?${params.toString()}`,
        );
        return;
      }

      // Web: validate redirect_uri if provided
      if (redirectUri) {
        try {
          const origin = new URL(redirectUri).origin;
          if (this.allowedOrigins.includes(origin)) {
            res.redirect(`${redirectUri}?${params.toString()}`);
            return;
          }
        } catch {}
      }

      res.redirect(`${this.frontendUrl}/auth/google/callback?${params.toString()}`);
    } catch {
      const errorUrl =
        `${this.frontendUrl}/auth/login?error=google_auth_failed`;
      res.redirect(errorUrl);
    }
  }
}

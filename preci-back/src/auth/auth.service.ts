import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthProvider, UserDocument } from '../users/schemas/user.schema';
import { EmailService } from '../email/email.service';

const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_MINUTES = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      phone: user.phone,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.usersService.findById(userId);
  }

  async requestEmailOtp(email: string): Promise<{ message: string }> {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        authProvider: AuthProvider.EMAIL,
      });
    }

    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.usersService.setEmailOtp(String(user._id), otp, expiry);
    await this.emailService.sendOtp(email, otp);

    return { message: 'Codigo enviado. Revisa tu correo electronico.' };
  }

  async verifyEmailOtp(
    email: string,
    otp: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserDocument;
  }> {
    const baseUser = await this.usersService.findByEmail(email);
    if (!baseUser) {
      throw new UnauthorizedException('No existe una cuenta con ese email');
    }

    const userId = String(baseUser._id);
    const userWithOtp = await this.usersService.getEmailOtp(userId);

    if (!userWithOtp || !userWithOtp.emailOtp) {
      throw new BadRequestException(
        'No hay un codigo pendiente. Solicita uno nuevo.',
      );
    }

    const attempts = userWithOtp.emailOtpAttempts ?? 0;
    if (attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException(
        'Demasiados intentos fallidos. Solicita un nuevo codigo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (userWithOtp.emailOtpExpiry && userWithOtp.emailOtpExpiry < new Date()) {
      await this.usersService.clearEmailOtp(userId);
      throw new BadRequestException(
        'El codigo ha expirado. Solicita uno nuevo.',
      );
    }

    if (userWithOtp.emailOtp !== otp) {
      await this.usersService.incrementOtpAttempts(userId);
      const remaining = OTP_MAX_ATTEMPTS - (attempts + 1);
      throw new UnauthorizedException(
        `Codigo incorrecto. Te quedan ${remaining} intento(s).`,
      );
    }

    await this.usersService.clearEmailOtp(userId);

    const tokens = await this.generateTokens(baseUser);

    return { ...tokens, user: baseUser };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    let payload: { sub: string; phone?: string; email?: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    const newPayload = {
      sub: user._id,
      phone: user.phone,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(newPayload);
    return { accessToken };
  }

  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    googleId: string;
    picture?: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: UserDocument;
    isNewUser: boolean;
  }> {
    let isNewUser = false;

    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user) {
      const existingByEmail = await this.usersService.findByEmail(
        googleUser.email,
      );

      if (existingByEmail) {
        await this.usersService.linkGoogleAccount(
          String(existingByEmail._id),
          googleUser.googleId,
        );
        user = existingByEmail;
      } else {
        user = await this.usersService.createFromGoogle(googleUser);
        isNewUser = true;
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta esta desactivada');
    }

    const tokens = await this.generateTokens(user);

    return { ...tokens, user, isNewUser };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

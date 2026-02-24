import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = (await super.canActivate(context)) as boolean;
    return result;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const platform = (request.query.platform as string) || 'web';
    const redirectUri = (request.query.redirect_uri as string) || '';

    return {
      state: JSON.stringify({ platform, redirectUri }),
      scope: ['email', 'profile'],
    };
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err) throw err;
    if (!user) {
      throw new UnauthorizedException(
        'Autenticacion con Google cancelada o fallida',
      );
    }
    return user as TUser;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<Request>();
    const sid = (req as any).cookies?.sid as string | undefined;

    const userId = await this.auth.getUserIdFromSession(sid);
    if (!userId) throw new UnauthorizedException('Unauthenticated');

    (req as any).userId = userId;
    return true;
  }
}

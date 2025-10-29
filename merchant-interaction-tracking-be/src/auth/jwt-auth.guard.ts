import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Bypass auth in development when explicitly enabled
    if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
      return true;
    }
    return super.canActivate(context);
  }
}


import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Bypass auth in development when explicitly enabled
    // NOTE: /auth/check endpoint should always require authentication
    const request = context.switchToHttp().getRequest();
    const isCheckEndpoint = request.url === '/auth/check' || request.url?.includes('/auth/check');
    
    // Không bypass auth cho /auth/check endpoint - luôn yêu cầu authentication
    if (isCheckEndpoint) {
      return super.canActivate(context);
    }
    
    // Bypass cho các endpoint khác trong development
    if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
      return true;
    }
    return super.canActivate(context);
  }
}


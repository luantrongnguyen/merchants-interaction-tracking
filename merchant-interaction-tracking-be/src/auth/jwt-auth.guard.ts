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
    
    // CHỈ bypass auth khi BYPASS_AUTH === 'true' (không bypass trong production)
    // Trong production, luôn yêu cầu authentication thật
    if (process.env.BYPASS_AUTH === 'true') {
      // Set default user khi bypass auth để tránh lỗi khi controller truy cập req.user
      if (!request.user) {
        request.user = {
          email: 'dev@example.com',
          sub: 'dev-user',
          name: 'Development User',
        };
      }
      return true;
    }
    
    // Trong production hoặc khi không có BYPASS_AUTH, yêu cầu authentication thật
    return super.canActivate(context);
  }
}


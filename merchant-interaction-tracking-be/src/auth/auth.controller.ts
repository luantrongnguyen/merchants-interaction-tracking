import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

interface LoginDto {
  user: {
    email: string;
    name: string;
    picture: string;
    sub: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto.user);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Đăng nhập thất bại'
      };
    }
  }

  @Post('logout')
  async logout() {
    return {
      success: true,
      message: 'Đăng xuất thành công'
    };
  }

  @Get('check')
  @UseGuards(JwtAuthGuard)
  async checkAuth(@Request() req) {
    return {
      success: true,
      isAuthenticated: true,
      user: req.user
    };
  }
}

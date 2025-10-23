import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

export interface User {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private googleSheetsService: GoogleSheetsService,
  ) {}

  async validateUser(user: User): Promise<boolean> {
    try {
      // Check if email has @mangoforsalon.com domain
      const isMangoDomain = user.email.toLowerCase().endsWith('@mangoforsalon.com');
      
      if (!isMangoDomain) {
        console.log(`Unauthorized access attempt from: ${user.email} - Not a Mango domain`);
        return false;
      }
      
      // Get authorized emails from Google Sheets for additional validation
      const authorizedEmails = await this.googleSheetsService.getAuthorizedEmails();
      
      // Check if user's email is in the authorized list
      const isAuthorized = authorizedEmails.includes(user.email.toLowerCase());
      
      if (!isAuthorized) {
        console.log(`Unauthorized access attempt from: ${user.email} - Not in authorized list`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  async login(user: User) {
    const isValid = await this.validateUser(user);
    
    if (!isValid) {
      throw new UnauthorizedException('Chỉ email có domain @mangoforsalon.com mới được truy cập');
    }

    const payload = { 
      email: user.email, 
      sub: user.sub,
      name: user.name,
      picture: user.picture
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub
      }
    };
  }

  async validateToken(payload: any): Promise<User> {
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub
    };
  }
}

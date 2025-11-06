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
      // Normalize email: trim whitespace and convert to lowercase
      const normalizedEmail = (user.email || '').trim().toLowerCase();
      
      if (!normalizedEmail) {
        console.log(`Unauthorized access attempt: Empty email`);
        return false;
      }
      
      // Check if email has @mangoforsalon.com domain
      const isMangoDomain = normalizedEmail.endsWith('@mangoforsalon.com');
      
      if (!isMangoDomain) {
        console.log(`Unauthorized access attempt from: ${normalizedEmail} - Not a Mango domain`);
        return false;
      }
      
      console.log(`Authorized access from: ${normalizedEmail} - Mango domain confirmed`);
      return true;
      
      // Optional: Get authorized emails from Google Sheets for additional validation
      // const authorizedEmails = await this.googleSheetsService.getAuthorizedEmails();
      // const isAuthorized = authorizedEmails.includes(normalizedEmail);
      // if (!isAuthorized) {
      //   console.log(`Unauthorized access attempt from: ${normalizedEmail} - Not in authorized list`);
      //   return false;
      // }
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  async login(user: User) {
    // Normalize email before validation
    const normalizedEmail = (user.email || '').trim().toLowerCase();
    user.email = normalizedEmail;
    
    const isValid = await this.validateUser(user);
    
    if (!isValid) {
      throw new UnauthorizedException('Chỉ email có domain @mangoforsalon.com mới được truy cập hệ thống');
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

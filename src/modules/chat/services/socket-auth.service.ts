import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  email_verified: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class SocketAuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  /**
   * Verify and decode JWT token from socket connection
   */
  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  /**
   * Extract token from socket handshake headers
   */
  extractTokenFromHandshake(handshake: any): string {
    const authHeader = handshake.headers?.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return parts[1];
  }

  /**
   * Authenticate socket connection using JWT token
   */
  authenticateSocket(handshake: any): JwtPayload {
    const token = this.extractTokenFromHandshake(handshake);
    return this.verifyToken(token);
  }
}

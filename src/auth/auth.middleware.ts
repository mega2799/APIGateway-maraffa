import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      this.logger.warn(`✗ AUTH ${req.method} ${req.originalUrl} — no token`);
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify(token);
      req.headers['x-user-id'] = payload.sub as string;
      this.logger.log(`✓ AUTH ${req.method} ${req.originalUrl} — user: ${payload.sub}`);
      next();
    } catch (err: any) {
      this.logger.warn(`✗ AUTH ${req.method} ${req.originalUrl} — ${err.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

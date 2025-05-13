import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// This interface defines the expected shape of the JWT payload from Supabase.
// You might need to adjust it based on the actual claims Supabase includes.
interface SupabaseJwtPayload {
  sub: string; // The Supabase User ID (UUID)
  email: string;
  role?: string; // e.g., 'authenticated', 'anon', or custom roles
  // Add other claims you expect from Supabase JWT, like app_metadata or user_metadata if needed
  // exp: number; // Expiration time
  // aud: string; // Audience
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // Naming the strategy 'jwt'
  constructor(
    private readonly configService: ConfigService,
    // You could inject PrismaService here if you need to fetch more user details
    // during validation, but it's often better to keep the strategy lean.
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Ensure tokens are not expired
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<any> {
    // The object returned here will be attached to the request as `req.user`
    // We are primarily interested in the Supabase user ID (`payload.sub`) and email.
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
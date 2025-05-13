import { Request } from 'express';

// This interface extends the Express Request to include the user property
// populated by our JwtStrategy.
export interface AuthRequest extends Request {
  user: {
    userId: string; // Matches what JwtStrategy's validate method returns
    email: string;
    role?: string;
  };
}
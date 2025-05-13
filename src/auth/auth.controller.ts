import { Controller, Get, UseGuards, Req, Post, Body, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto, UpsertProfileDto } from './dto'; // Assuming index.ts in dto folder
import { AuthRequest } from './interfaces/auth-request.interface'; // Import your custom interface

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // This endpoint is called by the client after successful Supabase authentication.
    // The client includes the Supabase JWT in the Authorization header.
    // This endpoint ensures a local customer profile exists or is created/updated.
    @UseGuards(AuthGuard('jwt'))
    @Post('sync-profile') // Or Patch if you prefer for updates
    @HttpCode(HttpStatus.OK)
    async syncProfile(@Req() req: AuthRequest, @Body() upsertProfileDto: UpsertProfileDto) {
        // Now req.user is strongly typed based on AuthRequest
        return this.authService.findOrCreateCustomerProfile(
            req.user.userId,
            req.user.email,
            upsertProfileDto.first_name,
            upsertProfileDto.last_name
        );
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me') // Endpoint to get the current user's local profile
    async getMyProfile(@Req() req: AuthRequest) {
        // req.user is strongly typed here as well
        return this.authService.getCustomerProfileBySupabaseUserId(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('me') // Using PATCH as it's a partial update, PUT is also acceptable
    @HttpCode(HttpStatus.OK)
    async updateMyProfile(@Req() req: AuthRequest, @Body() updateProfileDto: UpdateProfileDto) {
        const supabaseUser = req.user as { userId: string; email: string; role?: string };
        return this.authService.updateMyProfile(
            supabaseUser.userId,
            updateProfileDto
        );
    }
}
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';
// We don't need JwtService here for issuing tokens if Supabase handles it.

@Injectable()
export class AuthService {
        constructor(private prisma: PrismaService) { }

    async getCustomerProfileBySupabaseUserId(supabaseUserId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { supabase_user_id: supabaseUserId },
            // Select specific fields to return, excluding sensitive ones if any
            select: {
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
                supabase_user_id: true,
                registration_date: true,
            }
        });

        if (!customer) {
            // This could mean the profile sync hasn't happened yet, or the user doesn't have a local profile.
            // Depending on your flow, you might want to create it here or guide the user.
            throw new NotFoundException(`Customer profile for user ID ${supabaseUserId} not found.`);
        }
        return customer;
    }

    async findOrCreateCustomerProfile(supabaseUserId: string, email: string, firstName?: string, lastName?: string) {
        try {
            return await this.prisma.customer.upsert({
                where: { supabase_user_id: supabaseUserId },
                update: { email, first_name: firstName, last_name: lastName }, // Update if names are provided
                create: { supabase_user_id: supabaseUserId, email, first_name: firstName || '', last_name: lastName || '' },
            });
        } catch (error) {
            // Handle potential errors, e.g., if email unique constraint is violated by another supabase_user_id
            // This scenario should be rare if supabase_user_id is the primary link.
            throw new InternalServerErrorException('Could not create or update customer profile.');
        }
    }

        async updateMyProfile(supabaseUserId: string, updateProfileDto: UpdateProfileDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { supabase_user_id: supabaseUserId },
        });

        if (!customer) {
            throw new NotFoundException(`Customer profile for user ID ${supabaseUserId} not found.`);
        }

        const updatedCustomer = await this.prisma.customer.update({
            where: { supabase_user_id: supabaseUserId },
            data: {
                first_name: updateProfileDto.first_name ?? customer.first_name,
                last_name: updateProfileDto.last_name ?? customer.last_name,
            },
            select: { // Return the updated profile, similar to getCustomerProfileBySupabaseUserId
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true, // Email is not updated here, just returned
                supabase_user_id: true,
                registration_date: true,
            }
        });
        return updatedCustomer;
    }
}

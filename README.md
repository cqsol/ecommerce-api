# Simple E-commerce API

This project is a core e-commerce platform API built with NestJS, Prisma, and Supabase (PostgreSQL). It allows users to browse products, manage their shopping carts, place orders, and manage their profiles. Authentication is handled via Supabase.

The detailed API specification can be found in `./api-spec/openapi.json`.

## Features

*   **Product Management:**
    *   List products with pagination and filtering.
    *   Get product details by ID.
    *   Create, update, and delete products.
*   **Authentication (via Supabase):**
    *   Client-side registration and login handled by Supabase.
    *   API validates Supabase-issued JWTs.
    *   Endpoint to sync Supabase user data to a local customer profile.
*   **Profile Management:**
    *   Get current user's profile.
    *   Update current user's profile (first name, last name).
*   **Shopping Cart:**
    *   Get current user's cart.
    *   Add items to the cart.
    *   Update item quantities in the cart.
    *   Remove items from the cart.
    *   Clear all items from the cart.
*   **Order Management:**
    *   Create a new order (checkout from cart).
    *   List orders for the current user.
    *   Get order details by ID.

## Tech Stack

*   **Backend Framework:** NestJS
*   **ORM:** Prisma
*   **Database:** Supabase (PostgreSQL)
*   **Authentication Provider:** Supabase Auth
*   **Language:** TypeScript

## Prerequisites

*   Node.js (LTS version recommended, e.g., v18 or v20)
*   npm or yarn
*   A Supabase account and an active project.

## Setup & Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd ecommerce-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the project root (`/Users/puripat/Code/learn-nest/ecommerce-api/.env`).
    Add the following environment variables, replacing the placeholder values with your actual Supabase credentials:

    ```env
    DATABASE_URL="postgresql://postgres:[YOUR-SUPABASE-DB-PASSWORD]@[YOUR-SUPABASE-HOST]:5432/postgres"
    SUPABASE_JWT_SECRET="your-long-supabase-jwt-secret-from-the-dashboard"
    ```
    *   `DATABASE_URL`: Your Supabase PostgreSQL connection string.
    *   `SUPABASE_JWT_SECRET`: Your Supabase project's JWT secret (found in Project Settings > API > JWT Settings).

4.  **Run Prisma migrations:**
    This command will set up your database schema in your Supabase instance based on `/Users/puripat/Code/learn-nest/ecommerce-api/prisma/schema.prisma` and also generate the Prisma Client.
    ```bash
    npx prisma migrate dev
    ```

5.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```

## Running the Application

*   **Development mode (with hot-reloading):**
    ```bash
    npm run start:dev
    ```
    The API will typically be available at `http://localhost:3000`.

## API Endpoints Overview

The API provides endpoints for managing products, user profiles, shopping carts, and orders. For a detailed list of endpoints, request/response schemas, and examples, please refer to the OpenAPI specification:
`/Users/puripat/Code/learn-nest/ecommerce-api/api-spec/openapi.json`

### Main Modules:
*   `/products`: Product catalog operations.
*   `/auth`: User profile synchronization (`/sync-profile`) and retrieval (`/me`). Core authentication (login/registration) is handled by Supabase on the client-side.
*   `/cart`: Shopping cart operations.
*   `/orders`: Order creation and history.

## Authentication Flow

1.  **Client-Side:** The client application (e.g., web or mobile app) uses the Supabase client library for user registration and login. Supabase issues a JWT upon successful authentication.
2.  **API Interaction:** The client sends this Supabase JWT in the `Authorization: Bearer <token>` header for all requests to protected API endpoints.
3.  **Profile Synchronization:** After a user authenticates with Supabase, the client should call the `/auth/sync-profile` endpoint on this API (with the Supabase JWT) to create or update the local customer profile associated with the Supabase user.
4.  **API Validation:** This NestJS API validates the incoming Supabase JWT using the `SUPABASE_JWT_SECRET`.

---

This README provides a starting point. Feel free to expand it with more details as your project grows!
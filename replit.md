# SocialMonitor AI - Social Media Monitoring Platform

## Overview

SocialMonitor AI is a comprehensive social media monitoring and brand intelligence platform that helps businesses discover opportunities by tracking competitor mentions, generating AI-powered replies, and setting up automated monitoring alerts. The application provides search capabilities across multiple social platforms and integrates with AI services to generate contextual responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Build System**: ESBuild for server bundling, Vite for client builds

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless
- **Schema Management**: Drizzle Kit for migrations and schema management
- **In-Memory Storage**: Fallback implementation with Map-based storage for development

## Key Components

### Core Features
1. **Brand Opportunities Search**: Discover mentions of competitors without brand presence
2. **Thread Discovery**: Find relevant conversations across social platforms
3. **AI Reply Generator**: Generate contextual AI-powered replies for social media threads
4. **Alert Management**: Set up automated monitoring with configurable parameters
5. **Export Reports**: Generate reports in multiple formats (PDF, CSV, Excel)

### Database Schema
- **Users**: User authentication and management
- **Alerts**: Automated monitoring configurations with platforms, keywords, and frequency settings
- **Search Results**: Cached search results from various platforms with JSON storage
- **Generated Replies**: AI-generated content with metadata including tone, creativity, and provider info

### UI Components
- Comprehensive form components for search parameters and alert configuration
- Results display components with platform-specific formatting
- Mobile-responsive design with dedicated mobile menu
- Tab-based navigation for organizing different search types and configurations

## Data Flow

1. **Search Process**: User inputs search criteria → API processes request → External API calls (Serper, social platforms) → Results stored in database → Display to user
2. **AI Reply Generation**: Thread URL input → OpenAI API integration → Generated reply → Store in database → Display with copy/regenerate options
3. **Alert System**: User configures alert → Stored in database → Scheduled execution → Results notification via email/webhook

## External Dependencies

### Third-Party APIs
- **Serper API**: Primary search service for discovering social media content across platforms
- **OpenAI API**: AI-powered reply generation with configurable models and creativity settings
- **Social Platforms**: Reddit, Quora, Facebook, Twitter integration for content discovery

### Development Tools
- **Replit Integration**: Runtime error overlay and cartographer for development environment
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **PostCSS**: CSS processing with autoprefixer

### Authentication & Session Management
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple
- **Environment Variables**: API key management for OpenAI and Serper services

## Deployment Strategy

### Build Process
- **Client**: Vite builds React application to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses tsx for hot reloading with Vite dev server integration
- **Production**: Compiled JavaScript execution with static file serving
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### API Structure
- **REST Endpoints**: Express routes for search, alerts, replies, and user management
- **Error Handling**: Centralized error middleware with status code mapping
- **Logging**: Request/response logging for API endpoints with performance metrics
- **Static Assets**: Vite-processed client assets served in production mode

The application follows a modern full-stack architecture with clear separation between client and server concerns, comprehensive error handling, and scalable data storage solutions optimized for social media monitoring workflows.
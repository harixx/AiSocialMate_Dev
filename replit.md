# SocialMonitor AI - Social Media Monitoring Platform

## Overview

SocialMonitor AI is a comprehensive social media monitoring and brand intelligence platform that helps businesses discover opportunities by tracking competitor mentions, generating AI-powered replies, and setting up automated monitoring alerts. The application provides search capabilities across multiple social platforms and integrates with AI services to generate contextual responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Reddit OAuth Integration & Comments System (July 29, 2025)
- ✓ Implemented complete Reddit OAuth 2.0 authentication system with proper client registration
- ✓ Created comprehensive Reddit app setup guide (`REDDIT_OAUTH_SETUP.md`) with step-by-step instructions
- ✓ Added intelligent fallback system: OAuth API → RSS feeds → educational error handling
- ✓ Built Reddit authentication UI component with real-time status monitoring
- ✓ Implemented secure state verification and token management for OAuth flow
- ✓ Added authentication status indicators and upgrade prompts in comment displays
- ✓ Created production-ready OAuth callback handling with proper error management
- ✓ Integrated Reddit authentication directly into Thread Discovery interface
- ✓ System now handles both authenticated (full API) and non-authenticated (RSS) access gracefully
- ✓ Added comprehensive documentation for Reddit app registration and environment configuration

### Reddit OAuth Authentication Fix (July 29, 2025)
- ✓ Fixed Reddit OAuth redirect URI to use proper Replit domain instead of localhost
- ✓ Updated Reddit callback route to redirect to Thread Discovery page with success/error messages
- ✓ Implemented automatic Replit domain detection for OAuth configuration
- ✓ Reddit authentication now works seamlessly within Replit environment
- ✓ Users can now authenticate with Reddit and return to the application properly

### Complete Replit Environment Migration (July 29, 2025)
- ✓ Successfully migrated from Replit Agent to standard Replit environment
- ✓ Fixed aggressive API polling causing performance issues (reduced from 2s to 10s intervals)
- ✓ Optimized Reddit authentication component to eliminate unnecessary network calls
- ✓ Configured PostgreSQL database with proper schema deployment and migrations
- ✓ Resolved all TypeScript compilation errors and import issues
- ✓ Fixed server startup issues and error handling mechanisms
- ✓ Implemented proper client/server separation with security best practices
- ✓ Enhanced error recovery and graceful degradation for missing services
- ✓ Auto-configured Reddit OAuth with Replit domain detection
- ✓ Application architecture optimized for Replit environment

### Replit Agent Migration & Multi-AI Provider Support (July 28, 2025)
- ✓ Successfully migrated from Replit Agent to standard Replit environment
- ✓ Added Google Gemini API integration alongside OpenAI support
- ✓ Implemented dynamic model selection based on AI provider choice
- ✓ Enhanced reply generator form with provider-specific model options
- ✓ Added Gemini API key configuration with validation and logging
- ✓ Updated backend routes to support multiple AI providers (OpenAI, Gemini, Claude)
- ✓ Configured PostgreSQL database with proper schema migration
- ✓ Verified all API integrations working properly (OpenAI, Gemini, Serper, Database)

### Environment Management Implementation (July 24, 2025)
- ✓ Implemented enterprise-grade environment variable management system
- ✓ Created centralized configuration management (`server/config.ts`)
- ✓ Added multiple fallback environment variable names for flexibility
- ✓ Implemented descriptive error messages with setup instructions
- ✓ Added configuration status logging for development debugging
- ✓ Created comprehensive environment template (`.env.example`)
- ✓ Updated deployment documentation with production-ready guides
- ✓ Fixed all environment variable references throughout the codebase
- ✓ Resolved TypeScript compilation errors and ES module compatibility
- ✓ Verified application runs successfully with proper configuration validation

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
- **OpenAI API**: AI-powered reply generation with GPT-4o, GPT-4, and GPT-3.5 Turbo models
- **Google Gemini API**: AI-powered reply generation with Gemini 2.5 Flash, Gemini 2.5 Pro, and legacy models
- **Claude API**: Ready for future integration with Claude 3.5 Sonnet and other models
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
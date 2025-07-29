# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup
```bash
npm run setup        # Install dependencies, generate Prisma client, run migrations
```

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run dev:daemon   # Start dev server in background, logs to logs.txt
```

### Testing and Quality
```bash
npm test            # Run all tests with Vitest
npm run lint        # Run ESLint
npm run build       # Build for production
```

### Database Management
```bash
npx prisma generate           # Generate Prisma client
npx prisma migrate dev        # Run database migrations
npm run db:reset             # Reset database (destructive)
```

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **UI**: React 19 + TypeScript + Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI Integration**: Anthropic Claude via Vercel AI SDK
- **Testing**: Vitest with React Testing Library

### Key Architectural Components

#### 1. Virtual File System (`src/lib/file-system.ts`)
- In-memory file system for generated components
- No files written to disk during generation
- Serializable for database persistence

#### 2. Chat System
- **Chat Context** (`src/lib/contexts/chat-context.tsx`): Manages chat state, integrates with AI SDK
- **File System Context** (`src/lib/contexts/file-system-context.tsx`): Manages virtual file operations
- **API Route** (`src/app/api/chat/route.ts`): Handles AI streaming responses with tool calls

#### 3. AI Tools Integration
- **str_replace_editor**: File creation and content manipulation
- **file_manager**: File operations (rename, delete)
- Tools defined in `src/lib/tools/`

#### 4. Component Generation Flow
1. User input → Chat API → Claude AI
2. AI uses tools to manipulate virtual file system  
3. File system updates trigger UI refresh
4. Live preview renders generated components

### Project Structure Patterns
- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: Reusable React components organized by feature
- `src/lib/`: Core utilities, contexts, and business logic
- `src/actions/`: Server actions for database operations
- All components use TypeScript and Tailwind CSS

### Testing Strategy
- Component tests in `__tests__/` directories alongside components
- Test environment configured for jsdom with React Testing Library
- Focus on user interactions and component behavior

### Database Schema
The database uses SQLite with Prisma ORM. Key models:

#### User Model
- `id`: Unique identifier (cuid)
- `email`: Unique email address
- `password`: Hashed password
- `projects`: One-to-many relation to Project

#### Project Model  
- `id`: Unique identifier (cuid)
- `name`: Project name
- `userId`: Optional foreign key to User (nullable for anonymous projects)
- `messages`: JSON string storing chat history
- `data`: JSON string storing virtual file system state
- `user`: Many-to-one relation to User (cascading delete)

### Environment Variables
```bash
ANTHROPIC_API_KEY=     # Optional - fallback to mock responses without it
DATABASE_URL=          # Prisma database connection (file:./prisma/dev.db)
NEXTAUTH_SECRET=       # Authentication secret
NEXTAUTH_URL=          # Base URL for auth
```

### Development Notes
- Virtual file system enables real-time component generation without disk I/O
- Anonymous users can use the app; data saved to localStorage
- Authenticated users get persistent projects in database
- Monaco Editor provides syntax highlighting for generated code
- Live preview uses secure component rendering with error boundaries
# MindMap Collaboration & Sharing Features

## Overview

This document describes the collaboration, sharing, export, AI assistant, and internationalization features implemented in the MindMap application.

## Features Implemented

### 1. Real-time Collaborative Editing ✅

**Status**: MVP Complete

**Description**: Multiple users can edit the same mind map simultaneously with real-time updates.

**Features**:
- **Presence Indicators**: See avatars and names of active users
- **Live Cursors**: Track cursor movements of other users in real-time
- **Per-Node Locking**: Prevent concurrent edits with optimistic locking
- **Real-time Broadcasting**: Changes appear instantly for all users
- **Automatic Cleanup**: Locks released when users disconnect

**Technical Implementation**:
- Socket.io for WebSocket communication
- Database-backed presence tracking
- JWT authentication for secure connections
- 5-minute stale lock timeout

**API Endpoints**:
- WebSocket: `/api/socket` (requires custom server setup)

**Components**:
- `PresenceIndicators.tsx`: Display active users
- `CursorIndicator.tsx`: Show remote cursors
- `useSocket.ts`: React hook for WebSocket operations

---

### 2. Shareable Links ✅

**Status**: MVP Complete

**Description**: Create shareable links with role-based access control and optional security.

**Features**:
- **Role-based Access**: Owner, Editor, Viewer permissions
- **Password Protection**: Optional password for extra security
- **Expiry Dates**: Set automatic link expiration
- **Multiple Links**: Create multiple links with different permissions
- **Link Management**: View, copy, and delete share links

**Technical Implementation**:
- Unique tokens generated with UUID
- Bcrypt password hashing
- Server-side permission validation
- Database-backed link tracking

**API Endpoints**:
- `POST /api/maps/[id]/share` - Create share link
- `GET /api/maps/[id]/share` - List all share links
- `DELETE /api/maps/[id]/share` - Delete share link
- `GET /api/shared/[token]` - Access shared map
- `PATCH /api/shared/[token]` - Update shared map (if permitted)

**Components**:
- `ShareDialog.tsx`: Share link management UI

---

### 3. Export Utilities ✅

**Status**: MVP Complete

**Description**: Export mind maps in multiple formats for documentation and backup.

**Formats Supported**:
- **Markdown**: Hierarchical document with citations
- **Plain Text**: Simple text export
- **JSON**: Structured data for backup/import
- **PNG**: High-quality image export (client-side)
- **JPG**: Compressed image export (client-side)

**Features**:
- **Include Metadata**: Title, description, summary
- **Include Citations**: Source references and links
- **Include Attachments**: Links and notes
- **References Section**: Consolidated citations list
- **Client-side Image Export**: Uses html-to-image library

**Technical Implementation**:
- Server-side text export generation
- Client-side canvas-to-image conversion
- Hierarchical tree traversal
- Citation deduplication

**API Endpoints**:
- `GET /api/maps/[id]/export?format=markdown|text|json`

**Components**:
- `ExportMenu.tsx`: Export format selection
- `ExportService.ts`: Export logic

---

### 4. AI Assistant Panel ✅

**Status**: MVP Complete

**Description**: Ask questions about mind map content and get AI-powered answers.

**Features**:
- **Natural Language Q&A**: Ask questions in plain English
- **Source References**: Answers include node citations
- **Confidence Scores**: Shows answer reliability
- **Multi-provider Support**: Works with OpenAI and Google Gemini
- **Conversation History**: Track questions and answers
- **Multi-language Support**: Specify response language

**Technical Implementation**:
- Context building from all map nodes
- AI-powered answer generation
- Node ID extraction and source linking
- User API key usage (no server keys needed)

**API Endpoints**:
- `POST /api/maps/[id]/assistant` - Ask a question

**Components**:
- `AssistantPanel.tsx`: Chat interface
- `AssistantService.ts`: AI integration logic

**Example Questions**:
- "What are the main phases of this project?"
- "Summarize the key concepts"
- "What are the risks mentioned?"

---

### 5. Template Gallery ✅

**Status**: MVP Complete

**Description**: Pre-built templates for common use cases to jumpstart mind map creation.

**Templates Included**:
- **Project Plan**: Comprehensive project structure
- **Study Notes**: Educational material organization
- **Timeline**: Chronological event tracking
- **Brainstorming**: Creative idea generation
- **Decision Analysis**: Pros/cons evaluation
- **Meeting Agenda**: Structured meeting planning
- **Content Strategy**: Content marketing planning
- **Product Roadmap**: Feature planning timeline
- **Research Summary**: Research findings synthesis
- **Book Summary**: Book analysis and insights

**Features**:
- **Category Filtering**: Browse by project, study, timeline, etc.
- **Search**: Find templates by name or description
- **Preview**: See template structure before use
- **Customization**: Enter your topic to customize
- **Multi-language**: Templates available in multiple languages

**Technical Implementation**:
- Static template definitions
- Dynamic prompt generation
- Topic placeholder replacement
- Integration with AI generation pipeline

**API Endpoints**:
- `GET /api/templates?category=&language=`

**Components**:
- `TemplateGallery.tsx`: Template browser UI
- `templates-data.ts`: Template definitions

---

### 6. Presentation Mode

**Status**: Planned (Nice-to-have)

**Description**: Slideshow view that steps through mind map branches.

**Planned Features**:
- Navigate through nodes in hierarchical order
- Full-screen presentation mode
- Keyboard shortcuts for navigation
- Auto-advance option
- Export to PDF slideshow

---

### 7. Internationalization (i18n) ✅

**Status**: MVP Scaffolding Complete

**Description**: Multi-language UI support using next-intl.

**Features**:
- **10 Languages Supported**: EN, ES, FR, DE, IT, PT, RU, ZH, JA, KO
- **UI Translation**: All interface elements
- **AI Generation**: Request mind maps in any language
- **Template Localization**: Templates in user's language
- **Dynamic Language Switching**: Change language on the fly

**Technical Implementation**:
- next-intl for i18n framework
- JSON message files per language
- Language detection from browser
- User preference storage

**Files**:
- `i18n.ts`: Configuration
- `messages/en.json`: English translations
- Additional language files needed for full support

**Usage**:
```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('mindmap');
t('title'); // "Mind Map"
```

---

## Database Schema Changes

### New Models

```prisma
model ShareLink {
  id          String
  mindMapId   String
  token       String    @unique
  role        String    // "owner" | "editor" | "viewer"
  password    String?   // Optional password (hashed)
  expiresAt   DateTime? // Optional expiry
  createdBy   String
  createdAt   DateTime
  updatedAt   DateTime
}

model UserPresence {
  id          String
  userId      String
  mindMapId   String
  userName    String
  cursorX     Float?
  cursorY     Float?
  color       String
  lastSeenAt  DateTime
  createdAt   DateTime

  @@unique([userId, mindMapId])
}

model MapTemplate {
  id          String
  name        String
  description String?
  category    String
  prompt      String
  language    String   @default("en")
  complexity  String   @default("moderate")
  isPublic    Boolean  @default(true)
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Model Extensions

```prisma
model MindMap {
  embeddings  Json?     // Vector embeddings for AI
  shareLinks  ShareLink[]
}

model MapNode {
  embeddings  Json?     // Vector embeddings
  lockedBy    String?   // User ID
  lockedAt    DateTime? // Lock timestamp
}
```

## Environment Variables

No new environment variables required for MVP features. Existing variables:
- `NEXTAUTH_URL`: Base URL for share links
- `DATABASE_URL`: PostgreSQL connection
- User API keys stored securely in database

## Testing

### Manual Testing Checklist

**Collaboration**:
- [ ] Open same map in two browser sessions
- [ ] Verify presence indicators appear
- [ ] Move cursor and verify it appears in other session
- [ ] Edit node and verify changes appear in real-time
- [ ] Lock node in one session, verify lock in other
- [ ] Disconnect and verify cleanup

**Sharing**:
- [ ] Create share link with viewer role
- [ ] Access link in incognito window
- [ ] Verify read-only access
- [ ] Create link with password
- [ ] Verify password prompt and validation
- [ ] Create link with expiry date
- [ ] Verify expiration behavior

**Export**:
- [ ] Export as Markdown
- [ ] Verify citations included
- [ ] Export as PNG
- [ ] Verify image quality
- [ ] Export as JSON
- [ ] Verify data structure

**AI Assistant**:
- [ ] Ask question about map content
- [ ] Verify answer references correct nodes
- [ ] Check confidence score
- [ ] Test with different languages

**Templates**:
- [ ] Browse template gallery
- [ ] Filter by category
- [ ] Select template and enter topic
- [ ] Verify prompt generation

## Known Limitations

1. **WebSocket Setup**: Requires custom server setup (see WEBSOCKET_SETUP.md)
2. **Vector Embeddings**: Basic JSON storage (no semantic search yet)
3. **Image Export Quality**: Depends on browser rendering
4. **Concurrent Edits**: Node-level locking only (not field-level)
5. **Template Marketplace**: User-created templates not supported yet
6. **Presentation Mode**: Not implemented yet
7. **Full i18n**: Only English messages provided (other languages need translation)

## Future Enhancements

### Nice-to-have Features
- Advanced permission system (custom roles)
- Slideshow export to PDF
- Full multilingual UI (all 30+ languages)
- Template marketplace for sharing
- WebSocket over WebRTC for P2P collaboration
- Operational transforms for conflict resolution
- Vector database for semantic search
- Email notifications for shared maps
- Audit log for changes
- Version history and rollback

## Performance Considerations

- **WebSocket Connections**: Limited by server resources
- **Presence Updates**: Throttled to reduce network traffic
- **Large Maps**: Image export may be slow
- **AI Responses**: Depend on provider API performance
- **Database Queries**: Optimized with indexes

## Security

- **Authentication**: JWT tokens required for all operations
- **Authorization**: Server-side permission checks
- **Password Hashing**: Bcrypt with salt rounds
- **Token Generation**: Cryptographically secure UUIDs
- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Applied to API endpoints
- **XSS Prevention**: React's built-in sanitization
- **CORS**: Configured for WebSocket connections

## Documentation

- **WEBSOCKET_SETUP.md**: WebSocket server configuration
- **FEATURES.md**: This file
- **API Documentation**: See individual route files
- **Component Documentation**: JSDoc comments in files

## Support

For issues or questions:
1. Check WEBSOCKET_SETUP.md for configuration
2. Review error logs in browser console
3. Verify database migrations are applied
4. Check API endpoint responses
5. Ensure user has valid API keys configured

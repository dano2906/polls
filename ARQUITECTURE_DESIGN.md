# Poll Application Architecture Document

## Overview

A comprehensive web application for creating, publishing, sharing, and completing polls. Built with TanStack Start for routing and server functions, ShadCN for UI components, Tailwind CSS for styling, and Turso (libSQL) for data persistence.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | TanStack Start | Full-stack React framework with file-based routing and server functions |
| UI Components | ShadCN/ui | Pre-built, accessible, customizable component library |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Database | Turso (libSQL) | Edge-hosted SQLite-compatible database |
| ORM | Drizzle ORM | Type-safe database queries |
| State Management | TanStack Query | Server state management and caching |
| Form Handling | React Hook Form + Zod | Form validation and submission |

---

## Application Architecture

### Directory Structure

```
src/
├── routes/
│   ├── __root.tsx              # Root layout with navigation
│   ├── index.tsx               # Landing page / Dashboard
│   ├── polls/
│   │   ├── index.tsx           # List all user polls
│   │   ├── create.tsx          # Poll creation wizard
│   │   ├── $pollId/
│   │   │   ├── index.tsx       # Poll detail/edit view
│   │   │   ├── results.tsx     # Poll results analytics
│   │   │   └── share.tsx       # Share configuration
│   └── p/
│       └── $shareCode.tsx      # Public poll voting page
├── components/
│   ├── ui/                     # ShadCN components
│   ├── poll/
│   │   ├── poll-builder.tsx    # Question/option builder
│   │   ├── poll-preview.tsx    # Live preview component
│   │   ├── poll-card.tsx       # Poll summary card
│   │   ├── question-types/     # Different question type components
│   │   ├── results-chart.tsx   # Visualization components
│   │   └── share-modal.tsx     # Share functionality modal
│   └── layout/
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── footer.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── client.ts           # Turso client configuration
│   │   └── migrations/         # Database migrations
│   ├── validators/             # Zod schemas
│   └── utils.ts                # Utility functions
├── server/
│   ├── functions/              # TanStack server functions
│   │   ├── polls.ts            # Poll CRUD operations
│   │   ├── responses.ts        # Response handling
│   │   └── analytics.ts        # Results aggregation
│   └── middleware/             # Auth, rate limiting
└── styles/
    └── globals.css             # Tailwind base styles
```

---

## Database Schema Design

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   polls     │       │  questions  │       │   options   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──────<│ id (PK)     │──────<│ id (PK)     │
│ title       │       │ poll_id(FK) │       │ question_id │
│ description │       │ text        │       │ text        │
│ share_code  │       │ type        │       │ order       │
│ status      │       │ required    │       │ created_at  │
│ settings    │       │ order       │       └─────────────┘
│ created_at  │       │ created_at  │
│ updated_at  │       └─────────────┘
│ closes_at   │
└─────────────┘
        │
        │       ┌─────────────┐       ┌─────────────┐
        │       │  responses  │       │   answers   │
        │       ├─────────────┤       ├─────────────┤
        └──────<│ id (PK)     │──────<│ id (PK)     │
                │ poll_id(FK) │       │ response_id │
                │ session_id  │       │ question_id │
                │ ip_hash     │       │ option_id   │
                │ completed   │       │ text_value  │
                │ created_at  │       │ created_at  │
                └─────────────┘       └─────────────┘
```

### Table Definitions

#### polls
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| title | TEXT | Poll title (required) |
| description | TEXT | Optional description |
| share_code | TEXT | Unique 8-char code for public URL |
| status | TEXT | draft, published, closed |
| settings | TEXT (JSON) | Configuration options |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| closes_at | INTEGER | Optional auto-close timestamp |

#### questions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| poll_id | TEXT | Foreign key to polls |
| text | TEXT | Question text |
| type | TEXT | single, multiple, text, rating, ranking |
| required | INTEGER | Boolean (0/1) |
| order | INTEGER | Display order |
| settings | TEXT (JSON) | Type-specific settings |

#### options
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| question_id | TEXT | Foreign key to questions |
| text | TEXT | Option text |
| order | INTEGER | Display order |

#### responses
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| poll_id | TEXT | Foreign key to polls |
| session_id | TEXT | Browser session identifier |
| ip_hash | TEXT | Hashed IP for duplicate prevention |
| completed | INTEGER | Boolean (0/1) |
| created_at | INTEGER | Unix timestamp |

#### answers
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (UUID) | Primary key |
| response_id | TEXT | Foreign key to responses |
| question_id | TEXT | Foreign key to questions |
| option_id | TEXT | Foreign key to options (nullable) |
| text_value | TEXT | For text-type questions |

---

## Feature Specifications

### 1. Poll Creation

#### User Flow
1. User clicks "Create Poll" from dashboard
2. Enters poll title and optional description
3. Adds questions using the question builder
4. Configures poll settings
5. Previews poll in real-time
6. Saves as draft or publishes immediately

#### Question Types
| Type | Description | UI Component |
|------|-------------|--------------|
| Single Choice | Select one option | Radio button group |
| Multiple Choice | Select multiple options | Checkbox group |
| Text Response | Free-form text input | Textarea |
| Rating Scale | 1-5 or 1-10 scale | Star rating / slider |
| Ranking | Order options by preference | Drag-and-drop list |

#### Poll Settings
```typescript
interface PollSettings {
  allowAnonymous: boolean;        // Allow responses without identification
  preventDuplicates: boolean;     // One response per device/IP
  showResultsToVoters: boolean;   // Show results after voting
  randomizeQuestions: boolean;    // Randomize question order
  randomizeOptions: boolean;      // Randomize option order per question
  requireAllQuestions: boolean;   // Must answer all to submit
  customTheme: {                  // Visual customization
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}
```

### 2. Poll Publishing

#### Status Workflow
```
┌───────┐     ┌───────────┐     ┌────────┐
│ Draft │────>│ Published │────>│ Closed │
└───────┘     └───────────┘     └────────┘
    │              │                 │
    └──────────────┴─────────────────┘
              (can revert)
```

#### Publishing Actions
- Generate unique share code (8 alphanumeric characters)
- Create shareable URL: `/p/{shareCode}`
- Set optional close date/time
- Enable/disable accepting responses

### 3. Poll Sharing

#### Share Methods
| Method | Implementation |
|--------|----------------|
| Direct Link | Copy shareable URL to clipboard |
| QR Code | Generate QR code for mobile access |
| Email | Pre-populated email template |
| Social Media | Platform-specific share intents |
| Embed | Iframe code for websites |

#### Social Platform Integration
- Twitter/X: Share with custom message and link
- Facebook: Open share dialog with preview
- LinkedIn: Professional share format
- WhatsApp: Mobile-friendly share link
- Telegram: Direct share with preview

#### Embed Options
```html
<!-- Standard embed -->
<iframe src="https://app.com/embed/p/{shareCode}" 
        width="100%" height="600" frameborder="0">
</iframe>

<!-- Responsive embed with auto-height -->
<script src="https://app.com/embed.js" 
        data-poll="{shareCode}">
</script>
```

### 4. Poll Completion (Voting)

#### Voter Experience
1. Access poll via share link
2. View poll title and description
3. Answer questions sequentially or all at once
4. Submit response
5. View results (if enabled) or thank you message

#### Duplicate Prevention Strategies
| Strategy | Pros | Cons |
|----------|------|------|
| IP Hash | Simple, no account needed | VPN bypass, shared IPs |
| Browser Fingerprint | More accurate | Privacy concerns |
| Session Cookie | Easy to implement | Cleared by users |
| Account Required | Most secure | Higher friction |

---

## UI/UX Design System

### Color Palette

```css
/* Primary Brand Colors */
--primary: 222.2 47.4% 11.2%;       /* Deep navy */
--primary-foreground: 210 40% 98%;

/* Semantic Colors */
--success: 142.1 76.2% 36.3%;       /* Green for completion */
--warning: 38 92% 50%;              /* Amber for alerts */
--destructive: 0 84.2% 60.2%;       /* Red for errors */

/* Neutral Palette */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;
--muted-foreground: 215.4 16.3% 46.9%;

/* Interactive States */
--accent: 210 40% 96.1%;
--accent-foreground: 222.2 47.4% 11.2%;
```

### Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page Title) | 2.25rem (36px) | 700 | 1.2 |
| H2 (Section) | 1.5rem (24px) | 600 | 1.3 |
| H3 (Card Title) | 1.25rem (20px) | 600 | 1.4 |
| Body | 1rem (16px) | 400 | 1.5 |
| Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 500 | 1.4 |

### Component Specifications

#### Poll Card (Dashboard)
```
┌─────────────────────────────────────────────┐
│  [Status Badge]                    [Menu ⋮] │
│                                             │
│  Poll Title Here                            │
│  Optional description text...               │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 5       │ │ 142     │ │ 68%     │       │
│  │Questions│ │Responses│ │Complete │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  Created: May 10, 2026    [View Results →] │
└─────────────────────────────────────────────┘
```

#### Question Builder
```
┌─────────────────────────────────────────────┐
│  Question 1                        [⋮] [×]  │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐    │
│  │ Enter your question here...         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Type: [Single Choice ▼]   ☑ Required      │
│                                             │
│  Options:                                   │
│  ┌─────────────────────────────────┐ [×]   │
│  │ Option 1                         │       │
│  └─────────────────────────────────┘       │
│  ┌─────────────────────────────────┐ [×]   │
│  │ Option 2                         │       │
│  └─────────────────────────────────┘       │
│                                             │
│  [+ Add Option]                             │
└─────────────────────────────────────────────┘
```

#### Share Modal
```
┌─────────────────────────────────────────────┐
│                Share Poll              [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  Share Link                                 │
│  ┌───────────────────────────────┐ [Copy]  │
│  │ https://app.com/p/abc123xy    │         │
│  └───────────────────────────────┘         │
│                                             │
│  ┌─────────┐                               │
│  │ [QR]    │  Scan to open on mobile       │
│  │ [CODE]  │                               │
│  └─────────┘                               │
│                                             │
│  Share on:                                  │
│  [Twitter] [Facebook] [LinkedIn] [Email]   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  Embed Code                                 │
│  ┌───────────────────────────────┐ [Copy]  │
│  │ <iframe src="..."></iframe>   │         │
│  └───────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Layout Adaptation |
|------------|-------|-------------------|
| Mobile | < 640px | Single column, stacked elements |
| Tablet | 640-1024px | Two columns, collapsible sidebar |
| Desktop | > 1024px | Full layout with persistent sidebar |

---

## Data Flow Architecture

### Poll Creation Flow
```
User Input → Form Validation → Server Function → Database
     │              │                │              │
     ▼              ▼                ▼              ▼
React Hook    Zod Schema      TanStack Start   Turso
Form                          createServerFn()
```

### Response Submission Flow
```
┌────────────┐     ┌──────────────┐     ┌─────────────┐
│  Voter     │────>│  Validation  │────>│  Duplicate  │
│  Submit    │     │  (Client)    │     │  Check      │
└────────────┘     └──────────────┘     └─────────────┘
                                              │
                         ┌────────────────────┘
                         ▼
                   ┌─────────────┐     ┌─────────────┐
                   │  Save       │────>│  Update     │
                   │  Response   │     │  Analytics  │
                   └─────────────┘     └─────────────┘
```

### Real-time Results (Optional Enhancement)
```
New Response → Turso Write → Change Detection → WebSocket Push
                                                     │
                        ┌────────────────────────────┘
                        ▼
                  Connected Clients (Results Page)
```

---

## API Design

### Server Functions

#### Polls
| Function | Method | Description |
|----------|--------|-------------|
| getPolls | GET | List user's polls with pagination |
| getPoll | GET | Get single poll with questions |
| createPoll | POST | Create new poll |
| updatePoll | PUT | Update poll details |
| deletePoll | DELETE | Soft delete poll |
| publishPoll | POST | Change status to published |
| closePoll | POST | Change status to closed |

#### Responses
| Function | Method | Description |
|----------|--------|-------------|
| submitResponse | POST | Submit poll response |
| checkDuplicate | GET | Verify if user already responded |
| getResponses | GET | Get paginated responses |
| exportResponses | GET | Export as CSV/JSON |

#### Analytics
| Function | Method | Description |
|----------|--------|-------------|
| getResults | GET | Aggregated results |
| getChartData | GET | Chart-ready data format |
| getInsights | GET | Statistical insights |

---

## Security Considerations

### Data Protection
- Hash IP addresses before storage (SHA-256)
- Sanitize all user inputs (XSS prevention)
- Use parameterized queries (SQL injection prevention)
- Rate limit API endpoints

### Poll Access Control
- Draft polls: Creator only
- Published polls: Anyone with link
- Results: Configurable (public/creator-only)
- Analytics: Creator only

### Session Management
- Generate unique session ID per browser
- Store in HttpOnly cookie
- Expire after 30 days of inactivity

---

## Performance Optimization

### Caching Strategy
| Data | Cache Duration | Invalidation |
|------|----------------|--------------|
| Poll metadata | 5 minutes | On update |
| Questions/Options | 5 minutes | On update |
| Results (public) | 30 seconds | On new response |
| Results (creator) | No cache | Real-time |

### Database Optimization
- Index on `polls.share_code` for quick lookups
- Index on `responses.poll_id` for results queries
- Composite index on `answers(response_id, question_id)`
- Use Turso edge replicas for read-heavy operations

### Client Optimization
- Lazy load results charts
- Prefetch poll data on hover
- Optimistic updates for form submissions
- Image optimization for social previews

---

## Future Enhancements

### Phase 2 Features
- User authentication and accounts
- Poll templates library
- Branching/conditional questions
- Scheduled publishing
- Response notifications

### Phase 3 Features
- Team workspaces
- Advanced analytics dashboard
- A/B testing for questions
- Multi-language support
- API access for integrations

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Vercel Edge   │
                    │   (TanStack     │
                    │    Start)       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Turso   │  │  Turso   │  │  Turso   │
        │  Primary │  │  Replica │  │  Replica │
        │  (Write) │  │  (Read)  │  │  (Read)  │
        └──────────┘  └──────────┘  └──────────┘
              │
              ▼
        ┌──────────┐
        │  Turso   │
        │  Backup  │
        └──────────┘
```

---

## Summary

This architecture provides a scalable, performant foundation for a poll application with:

- **Clean separation of concerns** via TanStack Start's file-based routing and server functions
- **Type-safe database operations** with Drizzle ORM and Turso
- **Modern, accessible UI** using ShadCN components with Tailwind CSS
- **Flexible sharing options** supporting multiple platforms and embed scenarios
- **Scalable data model** that accommodates various question types and response patterns

The design prioritizes user experience through intuitive flows, real-time previews, and responsive layouts while maintaining security and performance best practices.

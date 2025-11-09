# WishingWall Architecture

## Overview

WishingWall is a full-stack web application built with a RESTful API backend and a modern React frontend. The architecture is designed to support future mobile app development.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt password hashing, rate limiting, CORS
- **File Storage**: Local filesystem (can be migrated to S3/cloud storage)

### Frontend
- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form

## Architecture Patterns

### Backend Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   │   └── endpoints/    # Route handlers
│   ├── core/            # Core functionality
│   │   ├── config.py    # Settings
│   │   ├── database.py  # DB connection
│   │   ├── security.py # Auth utilities
│   │   ├── rate_limit.py # Rate limiting
│   │   └── email.py     # Email service
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   └── main.py          # FastAPI app
```

### Frontend Structure

```
frontend/
├── app/                 # Next.js app directory
│   ├── login/           # Authentication
│   ├── dashboard/       # Admin dashboard
│   ├── admin/wall/[id]/ # Wall management
│   ├── contribute/      # Contributor page
│   └── wall/[url]/      # Public wall view
├── lib/                 # Utilities
│   └── api.ts           # API client
└── store/               # State management
    └── authStore.ts     # Auth state
```

## Data Models

### User
- Admin users who create and manage walls
- Authentication via email/password
- JWT tokens for session management

### Wall
- Created by admins
- Has unique URL and passcode
- Can be public or private
- Contains multiple content items

### Contributor
- Invited by admins via email
- Access controlled via invite tokens
- Can post content to assigned wall

### Content
- Text, image, or text+image
- Posted by contributors
- Displayed in mosaic layout on wall

## API Design

### Authentication
- `POST /api/v1/auth/register` - Register new admin
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### Walls
- `POST /api/v1/walls` - Create wall
- `GET /api/v1/walls` - List user's walls
- `GET /api/v1/walls/{id}` - Get wall details
- `PUT /api/v1/walls/{id}` - Update wall
- `DELETE /api/v1/walls/{id}` - Delete wall
- `GET /api/v1/walls/public/{url}` - Public wall view

### Contributors
- `POST /api/v1/contributors/invite` - Invite contributor
- `GET /api/v1/contributors/wall/{id}` - List contributors
- `DELETE /api/v1/contributors/{id}` - Remove contributor
- `GET /api/v1/contributors/verify/{token}` - Verify invite token

### Content
- `POST /api/v1/content` - Create content (multipart/form-data)
- `GET /api/v1/content/wall/{id}` - Get wall contents
- `DELETE /api/v1/content/{id}` - Delete content

## Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Token expiration (7 days)
   - Role-based access control

2. **Input Validation**
   - Pydantic schemas for request validation
   - File type and size validation
   - SQL injection prevention via ORM

3. **Rate Limiting**
   - Login: 10 requests per 5 minutes
   - Registration: 5 requests per 5 minutes
   - IP-based tracking

4. **CORS**
   - Configured for specific origins
   - Credentials support

5. **File Upload Security**
   - File type validation (images only)
   - Size limits (10MB)
   - Secure filename generation

## Workflow

### Admin Workflow
1. Register/Login
2. Create wall → Get unique URL + passcode
3. Invite contributors via email
4. Manage contributors (add/remove)
5. Toggle wall visibility (public/private)
6. View wall

### Contributor Workflow
1. Receive email invite with token
2. Click invite link → Contributor page
3. Add content (text/image/both)
4. Submit → Content appears on wall

### Public View Workflow
1. Access wall via unique URL
2. Enter passcode
3. View all contributions in mosaic layout

## Future Enhancements

### Mobile App Support
- API is already RESTful and ready for mobile
- Consider adding GraphQL layer if needed
- OAuth2 for mobile authentication

### Scalability
- Move file storage to S3/cloud storage
- Use Redis for rate limiting
- Add database connection pooling
- Implement caching layer

### Features
- Video content support
- Audio messages
- Reactions/comments
- Scheduled posts
- Analytics dashboard

## Deployment

- **Backend**: Render (Python service)
- **Frontend**: Render (Node.js service)
- **Database**: Render PostgreSQL
- **File Storage**: Local (migrate to S3 for production)

See `DEPLOYMENT.md` for detailed deployment instructions.


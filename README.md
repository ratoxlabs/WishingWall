# WishingWall Platform

A web platform where users can post celebratory greetings, wishes, and messages to a person or team for birthdays, anniversaries, or achievements.

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
python -m app.core.db_init
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Edit with API URL
npm run dev
```

## 📋 Features

### User Roles
1. **Admin**: Creates accounts, manages walls, adds contributors
2. **Contributors**: Receive email invites, post content to walls

### Core Functionality
- ✅ **Wall Management**: Create walls with unique URLs and passcodes
- ✅ **Contributor Invites**: Email-based invitation system
- ✅ **Content Posting**: Text, images, or text+images
- ✅ **Mosaic Display**: Beautiful grid layout for all contributions
- ✅ **Public/Private Walls**: Control wall visibility
- ✅ **Secure Access**: JWT authentication, rate limiting, input validation

## 🏗️ Architecture

- **Backend**: Python with FastAPI (RESTful API for future mobile app support)
- **Frontend**: TypeScript with Next.js 14
- **Database**: PostgreSQL (via SQLAlchemy)
- **Hosting**: Render (configured)
- **Security**: JWT authentication, bcrypt password hashing, rate limiting, CORS

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 📁 Project Structure

```
WishingWall/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── api/v1/      # API endpoints
│   │   ├── core/        # Core functionality
│   │   ├── models/      # Database models
│   │   └── schemas/     # Pydantic schemas
│   ├── requirements.txt
│   └── render.yaml      # Render deployment config
├── frontend/             # Next.js TypeScript frontend
│   ├── app/             # Next.js app directory
│   ├── lib/             # Utilities
│   ├── store/           # State management
│   └── package.json
├── README.md
├── SETUP.md             # Setup instructions
├── DEPLOYMENT.md        # Deployment guide
└── ARCHITECTURE.md      # Architecture documentation
```

## 🔐 Security Features

- JWT-based authentication with token expiration
- Bcrypt password hashing
- Rate limiting on auth endpoints
- Input validation with Pydantic
- CORS configuration
- File upload validation (type and size)
- SQL injection prevention via ORM

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Local development setup
- [Deployment Guide](./DEPLOYMENT.md) - Render deployment instructions
- [Architecture](./ARCHITECTURE.md) - System architecture and design

## 🛠️ Development

### API Documentation
Once backend is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Environment Variables
See `.env.example` files in backend and frontend directories for required variables.

## 🚢 Deployment

The project is configured for deployment on Render. See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.

## 📝 License

This project is private and proprietary.


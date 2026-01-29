# FGC Money Match Platform

A production-ready, real-money competitive gaming platform for 1v1 skill-based matches. Built with clean architecture principles, full-stack TypeScript/React frontend and Python/FastAPI backend.

## 🎯 Features

### Authentication & User Management
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ User registration with email, username, and password
- ✅ Secure password hashing (Argon2)
- ✅ Role-based access control (PLAYER, ADMIN, MODERATOR)
- ✅ User profiles with display names, avatars, and regions
- ✅ Account status management (ACTIVE, SUSPENDED, BANNED)

### Matchmaking System
- ✅ Create matches (QUICK_DUEL, RANKED, DIRECT_CHALLENGE)
- ✅ Match acceptance system
- ✅ Match lifecycle management (CREATED → ACCEPTED → IN_PROGRESS → COMPLETED)
- ✅ Match cancellation with reasons
- ✅ Match history and filtering
- ✅ Real-time match status updates

### Ranking & Skill System
- ✅ ELO-like rating system
- ✅ Global leaderboard
- ✅ User-specific rankings
- ✅ Automatic rating updates on match completion
- ✅ Win/loss tracking and win streaks

### Payments & Escrow
- ✅ Player wallet system
- ✅ Secure escrow for match stakes
- ✅ Automatic fund locking on match creation
- ✅ Winner payout system
- ✅ Refund system for cancelled matches
- ✅ Transaction history and audit trail
- ✅ Stripe payment gateway integration (abstracted)

### Dispute Resolution
- ✅ Dispute creation with evidence
- ✅ Evidence submission system
- ✅ Admin dispute review interface
- ✅ Dispute resolution with refund/payout
- ✅ Full audit logging

### Admin Features
- ✅ User management (view, suspend, ban)
- ✅ Dispute resolution interface
- ✅ Match oversight
- ✅ System statistics
- ✅ Admin action logging

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- OR **Node.js 18+** and **Python 3.11+** for local development

### Option 1: Docker (Recommended - Easiest)

**Backend:**
```bash
cd backend
docker-compose up --build
```

This starts:
- ✅ Backend API at `http://localhost:8000`
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Automatic database migrations
- ✅ Initial role seeding

**Frontend:**
```bash
# In a new terminal
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Option 2: Local Development

**Backend Setup:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Seed initial roles
python scripts/seed_roles.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Setup:**
```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# Start development server
npm run dev
```

## 📁 Project Structure

```
FGCMM-benzura/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   │   ├── auth.py    # Authentication
│   │   │   ├── users.py   # User management
│   │   │   ├── matches.py # Matchmaking
│   │   │   ├── rankings.py # Rankings
│   │   │   ├── payments.py # Payments
│   │   │   ├── disputes.py # Disputes
│   │   │   └── admin.py   # Admin
│   │   ├── core/          # Core utilities
│   │   │   ├── config.py  # Configuration
│   │   │   ├── security.py # JWT & hashing
│   │   │   └── exceptions.py # Custom exceptions
│   │   ├── domain/        # Business logic
│   │   │   ├── entities/  # Domain entities
│   │   │   ├── repositories/ # Repository interfaces
│   │   │   └── services/  # Business services
│   │   ├── infrastructure/ # Infrastructure
│   │   │   ├── database/  # Database models
│   │   │   ├── repositories/ # Repository implementations
│   │   │   └── external/  # External services
│   │   └── schemas/       # Pydantic schemas
│   ├── alembic/           # Database migrations
│   ├── scripts/           # Utility scripts
│   ├── docker-compose.yml  # Docker setup
│   └── requirements.txt   # Python dependencies
│
└── src/                    # React frontend
    ├── pages/              # Page components
    │   ├── LandingPage.tsx
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── DiscoverPage.tsx
    │   ├── MatchesPage.tsx
    │   ├── LeaderboardPage.tsx
    │   └── ProfilePage.tsx
    ├── components/         # Reusable components
    ├── auth/              # Authentication context
    ├── lib/                # Utilities
    │   ├── api.ts         # API client
    │   └── utils.ts       # Helpers
    └── layouts/            # Layout components
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL 15** - Database
- **Redis 7** - Caching & sessions
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation
- **python-jose** - JWT tokens
- **argon2-cffi** - Password hashing
- **Docker** - Containerization

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router DOM** - Routing
- **TanStack React Query** - Data fetching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Framer Motion** - Animations

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login and get tokens
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `GET /me` - Get current user

### Users (`/api/v1/users`)
- `GET /me` - Get current user profile
- `PUT /me` - Update profile
- `GET /{user_id}` - Get user (public)

### Matches (`/api/v1/matches`)
- `POST /` - Create match
- `GET /` - List matches (with filters)
- `GET /me` - Get user's matches
- `GET /{match_id}` - Get match details
- `POST /{match_id}/accept` - Accept match
- `POST /{match_id}/start` - Start match
- `POST /{match_id}/complete` - Complete match
- `POST /{match_id}/cancel` - Cancel match

### Rankings (`/api/v1/rankings`)
- `GET /` - Get leaderboard
- `GET /me` - Get user's ranking

### Payments (`/api/v1/payments`)
- `GET /wallet` - Get wallet balance
- `POST /deposit` - Initiate deposit
- `POST /withdraw` - Request withdrawal

### Disputes (`/api/v1/disputes`)
- `POST /` - Create dispute
- `POST /{dispute_id}/evidence` - Add evidence
- `GET /{dispute_id}` - Get dispute
- `GET /` - List disputes

### Admin (`/api/v1/admin`)
- `GET /disputes` - List all disputes
- `POST /disputes/{id}/resolve` - Resolve dispute
- `GET /users` - List users
- `POST /users/{id}/suspend` - Suspend user
- `POST /users/{id}/ban` - Ban user
- `GET /stats` - System statistics

**Interactive API docs:** `http://localhost:8000/docs` (Swagger UI)

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:
```env
# Database
DATABASE_URL=postgresql+asyncpg://fgcmatch_user:fgcmatch_password@postgres:5432/fgcmatch_db

# Redis
REDIS_URL=redis://redis:6379/0

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-characters-long
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_ENV=development
DEBUG=True
LOG_LEVEL=INFO
API_V1_PREFIX=/api/v1

# Payment Gateway (Stripe)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PLATFORM_FEE_PERCENT=5

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

Create `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 🗄️ Database

The platform uses PostgreSQL with the following main tables:
- `users` - User accounts
- `roles` - System roles (PLAYER, ADMIN, MODERATOR)
- `player_profiles` - Player information
- `matches` - Match records
- `match_participants` - Match participants
- `match_results` - Match results
- `rankings` - Player rankings
- `wallets` - User wallets
- `transactions` - Financial transactions
- `escrow_accounts` - Escrow for matches
- `disputes` - Dispute records
- `dispute_evidence` - Dispute evidence
- `admin_actions` - Admin action logs
- `audit_logs` - System audit trail

**Migrations:** Managed with Alembic
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🏗️ Architecture

### Clean Architecture
- **Domain Layer**: Business logic, entities, interfaces
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: Database, external services
- **API Layer**: HTTP endpoints, request/response handling

### SOLID Principles
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

### Security Features
- ✅ Input validation with Pydantic
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Rate limiting ready
- ✅ Idempotency keys for financial operations
- ✅ Secure password hashing (Argon2)
- ✅ JWT token rotation

## 🧪 Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
npm test
```

### Code Style
- **Backend**: PEP 8, type hints, async/await
- **Frontend**: ESLint, TypeScript strict mode

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 📦 Deployment

### Docker Production
```bash
cd backend
docker-compose -f docker-compose.prod.yml up --build
```

### Production Checklist
- [ ] Set `DEBUG=False`
- [ ] Use strong `JWT_SECRET_KEY`
- [ ] Configure production database
- [ ] Set up Redis
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Configure logging
- [ ] Set up backup strategy

## 🔐 Security Notes

- All passwords are hashed with Argon2
- JWT tokens expire after 15 minutes (access) / 7 days (refresh)
- All financial operations use idempotency keys
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- CORS configured for allowed origins only

## 📝 License

This project is proprietary software.

## 🤝 Support

For issues or questions, please check the API documentation at `/docs` or review the codebase structure.

---

**Version:** 1.0.0  
**Last Updated:** January 2026

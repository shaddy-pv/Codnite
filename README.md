# Codnite - Full-Stack Coding Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-dc382d)](https://redis.io/)

A modern, full-stack coding platform built with React, Node.js, TypeScript, and PostgreSQL. Codnite provides a comprehensive environment for coding challenges, problem-solving, and community interaction.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - Secure JWT-based authentication with role-based access control
- **Coding Challenges** - Interactive coding challenges with multiple difficulty levels
- **Problem Solving** - Algorithm and data structure problems with test cases
- **Community Posts** - Share knowledge, ask questions, and engage with the community
- **User Profiles** - Comprehensive user profiles with achievements and statistics
- **Real-time Code Editor** - Syntax highlighting, auto-completion, and error detection
- **Leaderboard** - Track progress and compete with other users
- **Notifications** - Real-time notifications for interactions and updates

### Technical Features
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Type Safety** - Full TypeScript implementation
- **Performance Optimized** - Caching, lazy loading, and bundle optimization
- **Security Hardened** - Input validation, rate limiting, and security headers
- **Monitoring & Observability** - Prometheus metrics, Grafana dashboards, and health checks
- **CI/CD Pipeline** - Automated testing and deployment with GitHub Actions
- **Docker Support** - Containerized deployment with Docker and Docker Compose
- **Database Migrations** - Version-controlled database schema changes

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling and validation
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe development
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Zod** - Schema validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Compression** - Response compression

### Database & Cache
- **PostgreSQL** - Primary relational database
- **Redis** - Caching and session storage
- **Raw SQL** - Database queries and migrations
- **Connection Pooling** - Database connection management

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **GitHub Actions** - CI/CD pipeline

## 📦 Installation

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git** (v2.30 or higher)
- **Docker** (v20 or higher)
- **Docker Compose** (v2 or higher)
- **PostgreSQL** (v15 or higher)
- **Redis** (v7 or higher)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/codnite.git
   cd codnite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development services**:
   ```bash
   # Start database and Redis
   docker-compose up -d db redis
   
   # Run database migrations
   npm run migrate:up
   
   # Start development servers
   npm run start:dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

### Docker Deployment

1. **Build and start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations**:
   ```bash
   docker-compose exec app npm run migrate:up
   ```

3. **Access the application**:
   - Application: http://localhost:3000
   - Monitoring: http://localhost:3001 (Grafana)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/codnite_prod
POSTGRES_DB=codnite_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Authentication
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
BCRYPT_ROUNDS=12

# Application
NODE_ENV=production
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Monitoring
ENABLE_METRICS=true
LOG_LEVEL=info

# CDN
CDN_PROVIDER=cloudinary
CDN_URL=https://res.cloudinary.com/your-cloud

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@codnite.com
```

### Database Configuration

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE codnite_prod;
   CREATE USER codnite_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE codnite_prod TO codnite_user;
   ```

2. **Run migrations**:
   ```bash
   npm run migrate:up
   ```

3. **Seed initial data** (optional):
   ```bash
   npm run seed
   ```

## 🚀 Usage

### Development

1. **Start development servers**:
   ```bash
   npm run start:dev
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Run linting**:
   ```bash
   npm run lint
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

### Production Deployment

1. **Build Docker images**:
   ```bash
   docker-compose build
   ```

2. **Deploy with Docker Compose**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Run database migrations**:
   ```bash
   docker-compose exec app npm run migrate:up
   ```

4. **Verify deployment**:
   ```bash
   curl http://localhost/health
   ```

### Monitoring

1. **Access Grafana dashboards**:
   - URL: http://localhost:3001
   - Username: admin
   - Password: admin

2. **View Prometheus metrics**:
   - URL: http://localhost:9090

3. **Check application health**:
   - URL: http://localhost/health

## 📚 API Documentation

### Authentication Endpoints

```http
POST   /api/auth/register     # Register new user
POST   /api/auth/login        # Login user
POST   /api/auth/logout       # Logout user
GET    /api/auth/me          # Get current user
PUT    /api/auth/profile      # Update user profile
```

### User Endpoints

```http
GET    /api/users             # Get all users
GET    /api/users/:id         # Get user by ID
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
```

### Post Endpoints

```http
GET    /api/posts             # Get all posts
GET    /api/posts/:id         # Get post by ID
POST   /api/posts             # Create new post
PUT    /api/posts/:id         # Update post
DELETE /api/posts/:id         # Delete post
```

### Challenge Endpoints

```http
GET    /api/challenges        # Get all challenges
GET    /api/challenges/:id    # Get challenge by ID
POST   /api/challenges        # Create new challenge
PUT    /api/challenges/:id    # Update challenge
DELETE /api/challenges/:id    # Delete challenge
```

### Problem Endpoints

```http
GET    /api/problems          # Get all problems
GET    /api/problems/:id      # Get problem by ID
POST   /api/problems          # Create new problem
PUT    /api/problems/:id      # Update problem
DELETE /api/problems/:id      # Delete problem
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API endpoints and database interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test application performance

## 📊 Monitoring

### Health Checks

- **Application Health**: `GET /health`
- **Readiness Probe**: `GET /health/ready`
- **Liveness Probe**: `GET /health/live`
- **Metrics**: `GET /api/metrics`

### Key Metrics

- **Response Time**: 95th percentile < 200ms
- **Error Rate**: < 0.1%
- **Throughput**: > 1000 requests/second
- **Availability**: 99.9% uptime

### Alerting

- **Application Down**: Critical alert
- **High Error Rate**: High priority alert
- **High Response Time**: High priority alert
- **High CPU Usage**: Warning alert
- **High Memory Usage**: Warning alert

## 🔒 Security

### Security Features

- **HTTPS**: All communications encrypted
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: All inputs validated and sanitized
- **Rate Limiting**: Request rate limiting
- **Security Headers**: Helmet security middleware
- **CORS**: Cross-origin protection
- **SQL Injection Prevention**: Parameterized queries

### Security Checklist

- [ ] HTTPS enabled
- [ ] JWT tokens secure
- [ ] Passwords properly hashed
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] CORS configured
- [ ] SQL injection prevented

## 🚀 Performance

### Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Redis caching and browser caching
- **CDN**: Content delivery network
- **Database Optimization**: Indexes and query optimization
- **Image Optimization**: WebP format and lazy loading

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

## 📖 Documentation

### Available Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Guide](SECURITY.md)
- [Performance Guide](PERFORMANCE_GUIDE.md)
- [Testing Strategy](TESTING_STRATEGY.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

### Additional Resources

- [Database Schema](docs/database-schema.md)
- [Environment Variables](docs/environment-variables.md)
- [Docker Configuration](docs/docker.md)
- [Monitoring Setup](docs/monitoring.md)
- [Backup Procedures](docs/backup.md)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

### Code Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Node.js Community** - For the robust runtime
- **PostgreSQL Team** - For the reliable database
- **Redis Team** - For the fast caching solution
- **Tailwind CSS** - For the utility-first CSS framework
- **TypeScript Team** - For the type-safe JavaScript

## 📞 Support

### Getting Help

- **Documentation**: Check the docs/ directory
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions
- **Community**: Join our community channels

### Contact

- **Maintainers**: @maintainers
- **Community**: #codnite-community
- **Email**: support@codnite.com

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Real-time Collaboration** - Collaborative code editing
- [ ] **Mobile App** - React Native mobile application
- [ ] **AI Code Review** - Automated code review with AI
- [ ] **Video Tutorials** - Integrated video learning
- [ ] **Certification System** - Skill-based certifications
- [ ] **Company Challenges** - Corporate coding challenges
- [ ] **API Marketplace** - Third-party API integrations
- [ ] **Advanced Analytics** - Detailed user analytics

### Technical Improvements

- [ ] **Microservices Architecture** - Service decomposition
- [ ] **GraphQL API** - GraphQL implementation
- [ ] **WebSocket Support** - Real-time communication
- [ ] **Kubernetes Deployment** - Container orchestration
- [ ] **Service Mesh** - Service mesh implementation
- [ ] **Event Sourcing** - Event-driven architecture
- [ ] **CQRS** - Command Query Responsibility Segregation
- [ ] **Advanced Caching** - Multi-level caching strategy

---

**Made with ❤️ by the Codnite Team**

[![GitHub stars](https://img.shields.io/github/stars/your-username/codnite?style=social)](https://github.com/your-username/codnite)
[![GitHub forks](https://img.shields.io/github/forks/your-username/codnite?style=social)](https://github.com/your-username/codnite)
[![GitHub issues](https://img.shields.io/github/issues/your-username/codnite)](https://github.com/your-username/codnite/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/codnite)](https://github.com/your-username/codnite/pulls)
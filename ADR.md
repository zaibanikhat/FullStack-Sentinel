# Architecture Decision Record (ADR)

## 1. Node.js + Express over NestJS
- **Decision**: Chose Node.js with Express over NestJS
- **Rationale**:
  - Lighter weight for our microservices architecture
  - Faster development cycles for our small team
  - Simpler learning curve for new developers
  - Sufficient for our current scale and requirements
  - Easier to integrate with existing monitoring and logging tools

## 2. SQLite for Local Development
- **Decision**: Using SQLite for local development
- **Rationale**:
  - Zero-configuration database
  - Serverless architecture
  - Single file storage makes it easy to share and backup
  - Sufficient for development and testing environments
  - Can be easily migrated to PostgreSQL in production

## 3. Keyset Pagination over Offset
- **Decision**: Implemented keyset pagination instead of offset-based
- **Rationale**:
  - Better performance with large datasets
  - Consistent results when data changes between requests
  - No skipped or duplicate items
  - More efficient for infinite scroll interfaces
  - Works better with our time-series transaction data

## 4. Server-Sent Events (SSE) for Real-time Updates
- **Decision**: Chose SSE over WebSockets
- **Rationale**:
  - Simpler protocol (HTTP-based)
  - Built-in reconnection support
  - Unidirectional communication is sufficient for our use case
  - Lower overhead than WebSockets
  - Better compatibility with existing HTTP infrastructure

## 5. Rate Limiting Implementation
- **Decision**: Implemented in-memory rate limiting
- **Rationale**:
  - Simple to implement and maintain
  - No external dependencies
  - Sufficient for our current scale
  - Can be easily replaced with Redis if needed
  - Tracks both IP and API key for security

## 6. Transaction Schema Design
- **Decision**: Normalized transaction schema
- **Rationale**:
  - Separates transaction data from customer data
  - Supports efficient querying by multiple dimensions
  - Enables easy aggregation and reporting
  - Follows audit trail best practices
  - Allows for future expansion of transaction attributes

## 7. Dockerized Development Environment
- **Decision**: Containerized all services
- **Rationale**:
  - Consistent environments across development and production
  - Easy onboarding for new developers
  - Simplified dependency management
  - Reproducible builds
  - Easy to scale services independently

## 8. Monorepo Structure
- **Decision**: Separate `/web` and `/api` directories
- **Rationale**:
  - Clear separation of concerns
  - Independent versioning and deployment
  - Shared types and utilities
  - Simplified CI/CD pipelines
  - Better code organization

## 9. API Error Handling
- **Decision**: Standardized error responses
- **Rationale**:
  - 400 for client input validation errors
  - 401/403 for authentication/authorization
  - 429 for rate limiting
  - 500 for server errors
  - Consistent error response format
  - Helpful error messages in development

## 10. Mock API Layer
- **Decision**: Implemented mock API for frontend development
- **Rationale**:
  - Enables parallel development
  - No backend dependencies for frontend work
  - Faster development cycles
  - Consistent test data
  - Easy to switch to real API

## 11. Environment Configuration
- **Decision**: Environment-based configuration
- **Rationale**:
  - Separate configs for dev, test, and prod
  - Sensitive data not in version control
  - Easy to adjust settings per environment
  - Supports 12-factor app principles
  - Simplified deployment

## 12. Logging Strategy
- **Decision**: Structured logging with different levels
- **Rationale**:
  - Debug level for development
  - Info for normal operations
  - Error for issues that need attention
  - Structured format for log analysis
  - Easy integration with monitoring tools
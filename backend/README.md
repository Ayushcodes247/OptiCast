# OptiCast Backend API Documentation

> Comprehensive REST API documentation for user authentication and management endpoints

## 📋 Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
  - [Register](#register)
  - [Login](#login)
  - [Profile](#profile)
  - [Logout](#logout)
- [Authentication](#authentication)
- [Security](#security)
- [Database Models](#database-models)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

This API provides secure user authentication and profile management for the OptiCast application. All endpoints implement industry-standard security practices including JWT authentication, rate limiting, and secure cookie handling.

**API Base URL**: `http://localhost:4000/api/v1`

**Version**: 1.0.0

---

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Environment variables configured (.env file)

### Installation
```bash
npm install
```

### Running the Server (Development)
```bash
npm run dev
```

### Running the server (Production)
```bash
npm run start 
```

---

## API Endpoints

---

## Register

### Endpoint
```
POST /api/v1/users/register
```

### Description
Creates a new user account with the provided credentials. A JWT authentication token is generated upon successful registration and returned to the client.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Validation Rules
| Field | Type | Requirements |
|-------|------|--------------|
| `username` | string | Minimum 3 characters, maximum 50 characters |
| `email` | string | Valid email format (RFC 5322) |
| `password` | string | Minimum 8 characters |

### Response - Success (201)
```json
{
  "success": true,
  "message": "User registration completed successfully.",
  "user": {
    "_id": "user_object_id",
    "username": "john_doe",
    "email": "john@example.com",
    "pid": "unique_pid",
    "profilePic": "profile_picture_url",
    "createdAt": "2025-12-14T10:30:00.000Z",
    "updatedAt": "2025-12-14T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800
}
```

### Response - Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "john",
      "msg": "Username should be between 3 to 50 characters.",
      "path": "username",
      "location": "body"
    }
  ]
}
```

### Response - User Already Exists (400)
```json
{
  "success": false,
  "message": "User with this email already exists."
}
```

### Response - Server Error (500)
```json
{
  "success": false,
  "message": "User registration failed.",
  "error": "error_message"
}
```

### Cookies Set
- `auth_token`: JWT token (httpOnly, secure, sameSite=strict, 7 days expiry)

### Rate Limiting
- Applied: Yes (via routerRateLimiter)

---

## Login

### Endpoint
```
POST /api/v1/users/login
```

### Description
Authenticates a user with email and password credentials. Upon successful authentication, a JWT token is issued and set as a secure HTTP-only cookie.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "string",
  "password": "string"
}
```

### Validation Rules
| Field | Type | Requirements |
|-------|------|--------------|
| `email` | string | Valid email format (RFC 5322) |
| `password` | string | Minimum 8 characters |

### Response - Success (200)
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "user_object_id",
    "username": "john_doe",
    "email": "john@example.com",
    "profilePic": "profile_picture_url"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 604800
}
```

### Response - Validation Error (400)
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please provide a valid email address.",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Response - Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

### Response - Server Error (500)
```json
{
  "success": false,
  "message": "User login failed.",
  "error": "error_message"
}
```

### Cookies Set
- `auth_token`: JWT token (httpOnly, secure, sameSite=strict, 7 days expiry)

### Rate Limiting
- Applied: Yes (via routerRateLimiter)

---

## Profile

### Endpoint
```
GET /api/v1/users/profile
```

### Description
Retrieves the authenticated user's profile information. Requires a valid authentication token. The password field is excluded from the response for security.

### Request Headers
```
Authorization: Bearer <token>
Cookie: auth_token=<token>
```

### Authentication
- **Required**: Yes
- **Method**: JWT token (via cookie or Bearer token in Authorization header)
- **Middleware**: authentication.middleware.js

### Response - Success (200)
```json
{
  "success": true,
  "user": {
    "_id": "user_object_id",
    "username": "john_doe",
    "email": "john@example.com",
    "pid": "unique_pid",
    "profilePic": "profile_picture_url",
    "createdAt": "2025-12-14T10:30:00.000Z",
    "updatedAt": "2025-12-14T10:30:00.000Z"
  },
  "message": "User profile fetched successfully."
}
```

### Response - Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication token missing."
}
```

### Response - Invalid/Expired Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired authentication token."
}
```

### Response - Blacklisted Token (401)
```json
{
  "success": false,
  "message": "Token is blacklisted. Please login again."
}
```

### Response - User Not Found (401)
```json
{
  "success": false,
  "message": "User not found for the provided token."
}
```

### Response - Server Error (500)
```json
{
  "success": false,
  "message": "error_message",
  "error": "detailed_error_object"
}
```

### Rate Limiting
- Applied: Yes (via routerRateLimiter)

---

## Logout

### Endpoint
```
POST /api/v1/users/logout
```

### Description
Logs out the authenticated user by blacklisting their current JWT token and clearing the authentication cookie. The token is added to a blacklist collection to prevent further usage.

### Request Headers
```
Authorization: Bearer <token>
Cookie: auth_token=<token>
Content-Type: application/json
```

### Authentication
- **Required**: Yes
- **Method**: JWT token (via cookie or Bearer token in Authorization header)
- **Middleware**: authentication.middleware.js

### Response - Success (200)
```json
{
  "success": true,
  "message": "Logout successful."
}
```

### Response - No Token Provided (400)
```json
{
  "message": "No token provided."
}
```

### Response - Token Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Token must be a string."
  ]
}
```

### Response - Unauthorized (401)
```json
{
  "success": false,
  "message": "Authentication token missing."
}
```

### Response - Invalid/Expired Token (401)
```json
{
  "success": false,
  "message": "Invalid or expired authentication token."
}
```

### Response - Server Error (500)
```json
{
  "success": false,
  "message": "Error while logging out.",
  "error": "error_message"
}
```

### Actions Performed
1. Extracts token from cookies or Authorization header
2. Validates token format
3. Adds token to blacklist collection (prevents reuse)
4. Clears `auth_token` cookie

### Cookies Cleared
- `auth_token` (httpOnly, secure, sameSite=strict)

### Rate Limiting
- Applied: Yes (via routerRateLimiter)

---

## Common Features

### 🔐 Authentication Token
- **Format**: JWT (JSON Web Token)
- **Algorithm**: HS256
- **Secret**: `process.env.JWT_SECRET`
- **Expiry**: 7 days (604,800 seconds)
- **Storage Options**:
  - HTTP-only Cookie: `auth_token`
  - Authorization Header: `Bearer <token>`

### ⏱️ Rate Limiting
All endpoints are protected with intelligent rate limiting:
- **Per-Route Limiter**: Prevents abuse on specific endpoints
- **Global Master Limiter**: 200 requests per 15 minutes
- **Configuration**: `@configs/ratelimit.config.js`

### 🛡️ Security Features
- **Helmet Security Headers**: CORS, XSS, clickjacking protection
- **HSTS**: HTTP Strict Transport Security (1-year max age)
- **Cookie Security**:
  - `httpOnly`: Prevents XSS attacks
  - `secure`: HTTPS only in production
  - `sameSite=strict`: CSRF protection
- **Password Security**: Bcrypt hashing with salt rounds
- **Token Blacklisting**: Prevents token reuse after logout

### ⚠️ Error Handling
Consistent error response format across all endpoints:
| Status | Type | Description |
|--------|------|-------------|
| 400 | Validation Error | Invalid input data or malformed request |
| 401 | Authentication Error | Missing, invalid, or expired token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

---

## 🔐 Authentication

### How Authentication Works

1. **Registration**: User creates account → JWT token issued
2. **Login**: User provides credentials → JWT token issued
3. **Authenticated Requests**: Include token in cookies or Authorization header
4. **Token Verification**: Middleware validates token before processing request
5. **Logout**: Token added to blacklist → No longer accepted

### Token Storage Options

**Option 1: HTTP-Only Cookie (Recommended)**
```
Cookie: auth_token=<token>
```
- Automatically sent with every request
- Protected from XSS attacks
- Not accessible from JavaScript

**Option 2: Authorization Header**
```
Authorization: Bearer <token>
```
- Manual token management required
- Suitable for API clients and SPAs
- More flexible for cross-domain requests

---

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Get Profile (Using Cookie)
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Cookie: auth_token=<your_token>"
```

### Get Profile (Using Bearer Token)
```bash
curl -X GET http://localhost:5000/api/v1/users/profile \
  -H "Authorization: Bearer <your_token>"
```

### Logout User
```bash
curl -X POST http://localhost:5000/api/v1/users/logout \
  -H "Authorization: Bearer <your_token>"
```

---

## Database Models

### User Model (`@models/user.model`)

**Collection**: `users`

**Schema**:
| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | ✓ | ✓ | MongoDB auto-generated ID |
| `username` | String | ✓ | - | User's display name (3-50 chars) |
| `email` | String | ✓ | ✓ | User's email address |
| `password` | String | ✓ | - | Bcrypt hashed password |
| `pid` | String | ✓ | ✓ | Unique profile identifier |
| `profilePic` | String | - | - | Profile picture URL |
| `createdAt` | Date | ✓ | - | Account creation timestamp |
| `updatedAt` | Date | ✓ | - | Last update timestamp |

**Methods**:
- `hashPassword(password)`: Hashes password using bcrypt
- `comparePassword(password)`: Compares provided password with stored hash
- `generateAuthToken()`: Generates JWT token valid for 7 days
- `validateUser(userObject)`: Validates user data against schema

### BlackListToken Model (`@models/blackListToken.model`)

**Collection**: `blacklisttokens`

**Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | ✓ | MongoDB auto-generated ID |
| `token` | String | ✓ | Blacklisted JWT token |
| `createdAt` | Date | ✓ | Blacklist timestamp |
| `expiresAt` | Date | ✓ | Auto-delete timestamp (TTL index) |

**Purpose**: Stores tokens that have been logged out to prevent reuse. MongoDB TTL index automatically removes expired tokens.

---

## Environment Variables Required

Create a `.env` file in the backend root directory with the following variables:

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_key_here

# Environment
NODE_ENV=development  # or 'production'

# Database
MONGODB_URI=mongodb://localhost:27017/opticast
DB_NAME=opticast

# Server Port
PORT=5000

# Email Configuration (if using nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## Related Files & Architecture

### Configuration Files
- **`@configs/ratelimit.config.js`**: Rate limiting configuration
- **`@configs/passport.config.js`**: Passport.js authentication strategy
- **`@configs/nodemailer.config.js`**: Email service configuration
- **`@configs/DB/db.config.js`**: MongoDB connection setup
- **`@configs/DB/session.config.js`**: Express session store configuration

### Middleware
- **`@middlewares/user/authentication.middleware.js`**: JWT verification and token validation
- **`@middlewares/DB/db.middleware.js`**: Database connection status checker

### Controllers
- **`@controllers/user.controller.js`**: User authentication logic (register, login, profile, logout)
- **`@controllers/google.controller.js`**: Google OAuth integration

### Routes
- **`@routes/user/index.route.js`**: User authentication endpoints
- **`@routes/google/index.route.js`**: Google OAuth endpoints
- **`@routes/index.route.js`**: Main router

---

## Status Codes Summary

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | ✓ OK | Successful GET/POST request |
| 201 | ✓ Created | User registered successfully |
| 400 | ✗ Bad Request | Validation error, invalid data, or missing token |
| 401 | ✗ Unauthorized | Invalid/missing/expired token, or blacklisted token |
| 404 | ✗ Not Found | User or resource doesn't exist |
| 429 | ✗ Too Many Requests | Rate limit exceeded |
| 500 | ✗ Server Error | Unexpected server error |

---

## Troubleshooting

### Common Issues & Solutions

**Issue**: "Authentication token missing"
- **Cause**: No token provided in cookie or Authorization header
- **Solution**: 
  - Ensure token is included in request
  - Check if cookies are enabled in client
  - Verify Authorization header format: `Bearer <token>`

**Issue**: "Invalid or expired authentication token"
- **Cause**: Token signature is invalid or has expired
- **Solution**:
  - Re-login to get a fresh token
  - Verify `JWT_SECRET` environment variable is correct
  - Check system time synchronization

**Issue**: "Token is blacklisted"
- **Cause**: User logged out with this token
- **Solution**: User needs to login again to get a new token

**Issue**: "User with this email already exists"
- **Cause**: Email is already registered
- **Solution**: 
  - Use a different email address for registration
  - Try login instead
  - Use password reset if email is yours

**Issue**: "Too many requests, please try again later"
- **Cause**: Rate limit exceeded
- **Solution**: Wait 15 minutes before making new requests, or contact administrator

**Issue**: "Password should be at least 8 characters long"
- **Cause**: Password doesn't meet minimum requirements
- **Solution**: Use a password with at least 8 characters

---

## Testing the API

### Using cURL
```bash
# Test health
curl http://localhost:5000/api/v1/users/profile

# Test with token
curl -H "Authorization: Bearer <your_token>" http://localhost:5000/api/v1/users/profile
```

### Using Postman
1. Create a new collection
2. Set up endpoints for each route
3. Use "Tests" tab to capture token from responses
4. Automatically add token to subsequent requests using Postman variables

### Using Thunder Client / REST Client
1. Install extension in VS Code
2. Create `.rest` files for endpoint testing
3. Use inline scripts to extract and store tokens

---

## Best Practices

✅ **DO**:
- Store JWT tokens securely (HTTP-only cookies recommended)
- Implement token refresh mechanism for long-lived sessions
- Validate all user input on both client and server
- Use HTTPS in production
- Monitor rate limiting metrics
- Log authentication events for security audits
- Implement logout on all devices feature
- Hash passwords with appropriate salt rounds (10+)

❌ **DON'T**:
- Store tokens in localStorage (XSS vulnerability)
- Send sensitive data in URL parameters
- Share JWT_SECRET in code repositories
- Disable HTTPS in production
- Trust client-side validation alone
- Store plain-text passwords
- Ignore rate limiting warnings
- Use weak JWT secrets

---

## Support & Contribution

For issues, questions, or contributions:
- Create an issue on the project repository
- Submit pull requests with improvements
- Follow the existing code style and conventions

---

**Last Updated**: December 14, 2025  
**API Version**: 1.0.0  
**Status**: Production Ready ✓
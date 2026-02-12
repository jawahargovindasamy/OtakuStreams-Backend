
> **Version:** 1.0.0  
> **Last Updated:** 2026-02-12  
> **License:** ISC  
> **Repository:** https://github.com/jawahargovindasamy/OtakuStreams-Backend.git

Production-ready REST API for anime streaming applications with authentication, watchlist management, and progress tracking.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Support](#support)

---

## Overview

The Anime Streaming Backend API provides a complete server-side solution for anime streaming platforms. Built with **Node.js**, **Express**, and **MongoDB**, it offers secure user authentication, comprehensive watchlist management with five status categories, and continue-watching progress tracking.

### Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** MongoDB 6+ with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet, bcrypt, express-rate-limit
- **Email Service:** Nodemailer

---

## Features

### Authentication & Security

- JWT-based authentication with refresh token support
- Secure password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation and sanitization
- CORS protection
- Security headers via Helmet

### User Management

- User registration and login
- Profile management
- Password reset via email
- Account deletion

### Watchlist System

- Five status categories: `plan_to_watch`, `watching`, `on_hold`, `completed`, `dropped`
- Episode tracking and rating system (1-10)
- Personal notes for each anime
- Statistics and analytics
- Duplicate prevention

### Continue Watching

- Progress tracking per episode
- Timestamp synchronization (resume playback)
- Automatic history management
- Bulk history clearing

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** >= 6.0 (local or Atlas)
- **npm** >= 9.0.0
- **Email Service** (Gmail SMTP or other provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/jawahargovindasamy/OtakuStreams-Backend.git
cd OtakuStreams-Backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Setup

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/anime_streaming

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_EXPIRE=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=Anime Stream <noreply@animestream.com>

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

**Success Output:**

```
Server running in development mode on port 5000
MongoDB Connected: localhost
```

---

## Authentication

The API uses Bearer Token authentication. Include the JWT token in the Authorization header for protected endpoints.

### Obtaining a Token

**Register a new account:**

```bash
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d \'{
    "username": "animefan123",
    "email": "user@example.com",
    "password": "securepassword123"
  }\'
```

**Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d \'{
    "email": "user@example.com",
    "password": "securepassword123"
  }\'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "animefan123",
    "email": "user@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

Include the token in all subsequent requests:

```bash
curl -X GET http://localhost:5000/api/auth/me \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <jwt_token>` | Yes (protected routes) |
| `Content-Type` | `application/json` | Yes (POST/PUT/PATCH) |

---

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.yourdomain.com/api
Staging:     https://staging-api.yourdomain.com/api
```

---

## API Endpoints

### Authentication Endpoints

#### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "username": "animefan123",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation Rules:**

- `username`: 3-30 characters, alphanumeric + underscores only
- `email`: Valid email format
- `password`: Minimum 6 characters

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "animefan123",
    "email": "user@example.com",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

#### Login User

Authenticate existing user.

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "animefan123",
    "email": "user@example.com",
    "role": "user",
    "avatar": "",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### Get Current User

Retrieve authenticated user profile.

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "animefan123",
    "email": "user@example.com",
    "role": "user",
    "avatar": "",
    "createdAt": "2026-02-12T10:00:00.000Z",
    "updatedAt": "2026-02-12T10:00:00.000Z"
  }
}
```

---

#### Forgot Password

Generate random password and send via email.

**Endpoint:** `POST /api/auth/forgot-password`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**Note:** A random 12-character password is generated and sent to the user\'s email. For security, the same success message is returned even if the email doesn\'t exist in the system.

---

#### Reset Password (Authenticated)

Change password while logged in.

**Endpoint:** `POST /api/auth/reset-password`

**Authentication:** Required

**Request Body:**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword456"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

#### Logout

Invalidate user session (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### Update Profile

Update user profile information.

**Endpoint:** `PUT /api/users/profile`

**Authentication:** Required

**Request Body:**

```json
{
  "username": "newusername",
  "avatar": "https://cdn.example.com/avatar.jpg"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "newusername",
    "email": "user@example.com",
    "avatar": "https://cdn.example.com/avatar.jpg"
  }
}
```

---

#### Delete Account

Permanently delete user account and all associated data.

**Endpoint:** `DELETE /api/users/account`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

---

### Watchlist Endpoints

#### Add Anime to Watchlist

Add a new anime to user\'s watchlist.

**Endpoint:** `POST /api/watchlist`

**Authentication:** Required

**Request Body:**

```json
{
  "animeId": "attack-on-titan-001",
  "animeTitle": "Attack on Titan",
  "animeImage": "https://cdn.example.com/aot.jpg",
  "status": "watching",
  "rating": 9,
  "episodesWatched": 12,
  "totalEpisodes": 25,
  "notes": "Amazing storyline and animation!"
}
```

**Status Options:** `plan_to_watch`, `watching`, `on_hold`, `completed`, `dropped`

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "_id": "65c1234567890abcdef12345",
    "user": "507f1f77bcf86cd799439011",
    "animeId": "attack-on-titan-001",
    "animeTitle": "Attack on Titan",
    "animeImage": "https://cdn.example.com/aot.jpg",
    "status": "watching",
    "rating": 9,
    "episodesWatched": 12,
    "totalEpisodes": 25,
    "notes": "Amazing storyline and animation!",
    "createdAt": "2026-02-12T10:30:00.000Z",
    "updatedAt": "2026-02-12T10:30:00.000Z"
  }
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "message": "Anime already in watchlist. Use update endpoint to modify."
}
```

---

#### Get Watchlist

Retrieve user\'s watchlist with optional filtering.

**Endpoint:** `GET /api/watchlist`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `plan_to_watch`, `watching`, `on_hold`, `completed`, `dropped` |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |

**Example:** `GET /api/watchlist?status=watching&page=1&limit=10`

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "65c1234567890abcdef12345",
      "animeId": "attack-on-titan-001",
      "animeTitle": "Attack on Titan",
      "animeImage": "https://cdn.example.com/aot.jpg",
      "status": "watching",
      "rating": 9,
      "episodesWatched": 12,
      "totalEpisodes": 25,
      "notes": "Amazing storyline!",
      "updatedAt": "2026-02-12T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

#### Get Watchlist Statistics

Retrieve aggregated statistics for user\'s watchlist.

**Endpoint:** `GET /api/watchlist/stats`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "total": 45,
    "plan_to_watch": 20,
    "watching": 5,
    "on_hold": 3,
    "completed": 15,
    "dropped": 2,
    "averageRating": "8.4"
  }
}
```

---

#### Update Watchlist Item

Update status, rating, progress, or notes for a watchlist item.

**Endpoint:** `PUT /api/watchlist/:id`

**Authentication:** Required

**Request Body:**

```json
{
  "status": "completed",
  "rating": 10,
  "episodesWatched": 25,
  "notes": "Finally finished! Masterpiece ending."
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "65c1234567890abcdef12345",
    "status": "completed",
    "rating": 10,
    "episodesWatched": 25,
    "notes": "Finally finished! Masterpiece ending.",
    "updatedAt": "2026-02-12T11:00:00.000Z"
  }
}
```

---

#### Remove from Watchlist

Delete an anime from watchlist.

**Endpoint:** `DELETE /api/watchlist/:id`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Removed from watchlist"
}
```

---

#### Check Watchlist Status

Check if specific anime is in user\'s watchlist.

**Endpoint:** `GET /api/watchlist/check/:animeId`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "inWatchlist": true,
    "item": {
      "_id": "65c1234567890abcdef12345",
      "status": "watching",
      "rating": 9,
      "episodesWatched": 12
    }
  }
}
```

---

### Continue Watching Endpoints

#### Update Progress

Save or update watching progress for an anime.

**Endpoint:** `POST /api/continue-watching`

**Authentication:** Required

**Request Body:**

```json
{
  "animeId": "attack-on-titan-001",
  "animeTitle": "Attack on Titan",
  "animeImage": "https://cdn.example.com/aot.jpg",
  "currentEpisode": 13,
  "currentTime": 720,
  "duration": 1440,
  "episodeTitle": "Episode 13 - Primal Desire"
}
```

**Field Descriptions:**

- `currentTime`: Current playback position in seconds
- `duration`: Total episode duration in seconds
- `currentEpisode`: Episode number currently watching

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "65c1234567890abcdef12346",
    "user": "507f1f77bcf86cd799439011",
    "animeId": "attack-on-titan-001",
    "animeTitle": "Attack on Titan",
    "currentEpisode": 13,
    "currentTime": 720,
    "duration": 1440,
    "episodeTitle": "Episode 13 - Primal Desire",
    "lastWatched": "2026-02-12T11:30:00.000Z"
  }
}
```

---

#### Get Continue Watching List

Retrieve list of anime with saved progress, sorted by most recent.

**Endpoint:** `GET /api/continue-watching`

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Number of items (default: 20) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "65c1234567890abcdef12346",
      "animeId": "attack-on-titan-001",
      "animeTitle": "Attack on Titan",
      "animeImage": "https://cdn.example.com/aot.jpg",
      "currentEpisode": 13,
      "currentTime": 720,
      "duration": 1440,
      "episodeTitle": "Episode 13 - Primal Desire",
      "lastWatched": "2026-02-12T11:30:00.000Z"
    }
  ]
}
```

---

#### Get Specific Anime Progress

Retrieve progress for a specific anime.

**Endpoint:** `GET /api/continue-watching/:animeId`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "animeId": "attack-on-titan-001",
    "currentEpisode": 13,
    "currentTime": 720,
    "lastWatched": "2026-02-12T11:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "message": "No progress found for this anime"
}
```

---

#### Delete Progress Entry

Remove a specific anime from continue watching history.

**Endpoint:** `DELETE /api/watchlist/check/:animeId`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Progress deleted successfully"
}
```

---

#### Clear All History

Delete all continue watching entries for user.

**Endpoint:** `DELETE /api/continue-watching`

**Authentication:** Required

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "All watch history cleared"
}
```

---

## Error Handling

The API uses conventional HTTP response codes and returns structured error responses.

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (duplicate entry) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed validation errors"]
}
```

### Common Error Scenarios

| Scenario | Status Code | Message |
|----------|-------------|---------|
| Invalid email format | 422 | "Please provide a valid email" |
| Duplicate email | 409 | "Email already registered" |
| Wrong password | 401 | "Invalid credentials" |
| Missing token | 401 | "Not authorized to access this route" |
| Expired token | 401 | "Token expired, please login again" |
| Anime already in watchlist | 409 | "Anime already in watchlist" |
| Validation failed | 422 | "Validation failed" with details array |

---

## Rate Limiting

To protect the API from abuse, rate limiting is implemented on authentication endpoints.

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/register` | 5 requests | 15 minutes |
| `POST /api/auth/login` | 5 requests | 15 minutes |
| `POST /api/auth/forgot-password` | 5 requests | 15 minutes |
| All other endpoints | 100 requests | 15 minutes |

### Rate Limit Headers

When rate limit is approached, these headers are included in responses:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `Retry-After` | Seconds until limit resets (when exceeded) |

---

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  username: String (unique, 3-30 chars),
  email: String (unique, validated),
  password: String (hashed, bcrypt),
  avatar: String (URL),
  role: String (enum: [\'user\', \'admin\']),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Watchlist Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  animeId: String,
  animeTitle: String,
  animeImage: String,
  status: String (enum: [\'plan_to_watch\', \'watching\', \'on_hold\', \'completed\', \'dropped\']),
  rating: Number (1-10),
  episodesWatched: Number,
  totalEpisodes: Number,
  notes: String (max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
// Index: { user: 1, animeId: 1 } (unique)
```

### ContinueWatching Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  animeId: String,
  animeTitle: String,
  animeImage: String,
  currentEpisode: Number,
  currentTime: Number (seconds),
  duration: Number (seconds),
  episodeTitle: String,
  lastWatched: Date,
  createdAt: Date,
  updatedAt: Date
}
// Index: { user: 1, animeId: 1 } (unique)
// Index: { user: 1, lastWatched: -1 }
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/anime_streaming` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key-min-32-chars` |
| `JWT_EXPIRE` | Token expiration time | `7d` |
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASS` | SMTP password | `app-specific-password` |
| `EMAIL_FROM` | From address for emails | `Anime Stream <noreply@animestream.com>` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |

---

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique `JWT_SECRET` (32+ characters)
- [ ] Configure production MongoDB URI (Atlas recommended)
- [ ] Setup production email service (SendGrid/AWS SES)
- [ ] Enable MongoDB authentication
- [ ] Configure firewall rules
- [ ] Setup SSL/TLS certificates
- [ ] Configure process manager (PM2)
- [ ] Setup monitoring and logging
- [ ] Configure backup strategies

### PM2 Configuration (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: \'anime-api\',
    script: \'./index.js\',
    instances: \'max\',
    exec_mode: \'cluster\',
    env: {
      NODE_ENV: \'production\',
      PORT: 5000
    },
    error_file: \'./logs/err.log\',
    out_file: \'./logs/out.log\',
    log_date_format: \'YYYY-MM-DD HH:mm:ss Z\'
  }]
};
```

---

## Support

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/yourusername/OtakuStreams-Backend/issues)
- **Email:** support@yourdomain.com
- **Documentation:** [Full API Docs](https://docs.yourdomain.com)

### Common Issues

**MongoDB Connection Failed:**

```bash
# Ensure MongoDB is running
sudo systemctl status mongod
# Or start it
sudo systemctl start mongod
```

**Email Not Sending:**

- Verify SMTP credentials
- For Gmail, use App-Specific Password (not account password)
- Check firewall settings for port 587

**JWT Token Errors:**

- Ensure `JWT_SECRET` is set and consistent
- Check token expiration (default: 7 days)
- Verify `Authorization` header format: `Bearer <token>`

---

**[Back to Top](#OtakuStreams-Backend)**

Built with care for anime fans everywhere
'''

# 🛠 OptiCast Backend

This README provides an in-depth look at the **backend** codebase, describing the overall architecture, route flow, middleware responsibilities, response schemas, configuration, and development tips.

---

## 📌 Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Directory Structure](#directory-structure)
4. [Configuration & Environment Variables](#configuration--environment-variables)
5. [Security & Middleware](#security--middleware)
6. [API Endpoints](#api-endpoints)
   - [Root Router](#root-router)
   - [Authentication](#authentication)
   - [Google OAuth](#google-oauth)
   - [Media Collection](#media-collection)
   - [Video Management](#video-management)
   - [Auxiliary](#auxiliary)
7. [Models](#models)
8. [Queues & Workers](#queues--workers)
9. [Response Format](#response-format)
10. [Running & Development](#running--development)
11. [Error Handling & Logging](#error-handling--logging)
12. [Further Notes](#further-notes)

---

## 🧩 Project Overview

OptiCast backend is a TypeScript/Express application providing APIs for user authentication, media collection management and video processing. It handles security concerns including JWT auth, CSRF protection, rate-limiting, NSFW content detection and signed playback cookies. Video uploads are transcoded into encrypted HLS streams using a worker/queue system.


## 🚀 Getting Started

1. **Clone repo** & `cd backend`.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and configure environment variables (see below).
4. Ensure MongoDB & Redis are running.
5. Ensure `ffmpeg` and `ffprobe` are available on the PATH.
6. Start application:
   - Development: `npm run dev` (uses `ts-node-dev`)
   - Production: `npm run build && npm start`
7. Workers run automatically as part of the same process; no separate command required.


## 📁 Directory Structure

```
backend/
├─ src/
│  ├─ app.ts                # Express app setup
│  ├─ server.ts             # Entry point (db connect + HTTP server)
│  ├─ configs/              # env, db, redis, upload, NSFW, essential settings
│  ├─ controllers/          # business logic by domain
│  ├─ middlewares/          # auth, csrf, access-token, nsfw, cookie
│  ├─ models/               # Mongoose schemas
│  ├─ routes/               # express routers
│  ├─ queues/               # code to enqueue jobs
│  ├─ workers/              # BullMQ workers (transcode, delete)
│  ├─ types/                # global type declarations
│  └─ utils/                # helpers (errors, tokens, validators, etc.)
└─ README.md (this file)
```


## ⚙️ Configuration & Environment Variables

### Primary configs
- `env.config.ts` - loads variables from `process.env`.
- `essential.config.ts` - multer upload rules, rate limiter, time util.
- `redis.config.ts` - BullMQ connection settings.
- `nsfw.config.ts` - NSFWJS model loader and prediction cache.

### Common variables (populate `.env`):

| Name                | Description                                            | Example                |
|---------------------|--------------------------------------------------------|------------------------|
| `PORT`              | HTTP port                                              | `3000`                 |
| `MONGO_URI`         | MongoDB connection string                             | `mongodb://localhost`  |
| `REDIS_URL`         | Redis connection (BullMQ)                             | `redis://127.0.0.1:6379`|
| `CLIENT_ID`         | Google OAuth client ID                                 | `...apps.googleusercontent.com` |
| `BASE_URL`          | Public base URL (for HLS key info)                    | `https://api.example.com` |
| `HLS_ENC`           | AES encryption method key                               | `AES-128`              |
| `NSFW_THRESHOLD`    | Confidence threshold for explicit detection            | `0.7`                  |
| `VIDEO_COOKIE`      | Name of signed playback cookie                         | `opticast_video_token`|
| `NODE_ENV`          | `development` or `production`                         |


## 🔒 Security & Middleware

| Middleware            | Responsibility                                                 | Used In                   |
|-----------------------|----------------------------------------------------------------|---------------------------|
| `isAuthenticated`     | Verifies JWT from `opticast_auth_token`; attaches `req.user`   | Protected routes          |
| `verifyCsrf`          | Checks CSRF token cookie against header value                 | Stateful actions          |
| `routerRateLImiter`   | Rate-limits to mitigate abuse                                 | Auth, Google routes       |
| `isVerifiedMediaCollection` | Validates collection access token in header param         | Media collection & video  |
| `verifyCookie`        | Validates signed playback cookie                              | Streaming endpoints       |
| `isValidVideo`        | Runs NSFW model on uploaded file                              | Upload endpoint           |


## 🛣 API Endpoints

> All routes are prefixed by `/api` via `app.ts`.

### 🔗 Root Router

```
router.use("/users", ManualRouter);
router.use("/google", routerRateLImiter, GoogleRouter);
router.use("/video", VideoRouter);
router.use("/media-collection", MediaCollectionRouter);
```

No endpoint under `/api` bypasses this root router.

---

### 👤 Authentication

#### `POST /api/users/register`
- **Body:** `{ username, email, password }`
- **Middleware:** rate limiter, body validation
- **Success (201):**
  ```json
  {
    "success": true,
    "user": {"id": ..., "name": ..., "email": ...},
    "message": "User registration successful."
  }
  ```
- **Errors:** 400 validation, 409 duplicate email.

#### `POST /api/users/login`
- **Body:** `{ email, password }`
- **Middleware:** rate limiter, body validation
- **Success (200):** similar to register message & sets auth+csrf cookies.
- **Errors:** 400 missing fields, 401 invalid credentials, 403 provider mismatch.

#### `GET /api/users/profile`
- **Middleware:** rate limiter, auth, csrf
- **Success:** returns user object attached to `req.user`.

#### `POST /api/users/logout`
- **Middleware:** rate limiter, auth, csrf
- **Logic:** blacklist token, clear cookies.
- **Success (200):** `{ success: true, message: "Logged out successfully." }`

---

### 🔐 Google OAuth

#### `POST /api/google`
- **Headers:** `Authorization: Bearer <google_id_token>`
- **Middleware:** rate limiter
- **Success (200):** same response shape as manual login; creates user if first-time, sets cookies.

---

### 🎛 Media Collection

Use JWT auth and access token to manage collections.

#### `POST /api/media-collection/create`
- **Middleware:** auth, csrf, rate limiter
- **Body:** `{ mediaCollectionName, allowedOrigins }`
- **Response (201):** returns collection data and plain access token.

#### `PATCH /api/media-collection/:id/regenrateAccessToken`
- **Middleware:** auth, csrf, rate limiter
- **Response (200):** `{ regeneratedToken: ... }`

#### `POST /api/media-collection/:id/addorigin`
- **Middleware:** auth, csrf, verified collection, rate limiter
- **Body:** `{ allowedOrigins: ["https://example.com"] }`

#### `DELETE /api/media-collection/:id/removeorigin`
- **Middleware:** auth, csrf, verified collection, rate limiter
- **Body:** `{ removeorigin: "https://example.com" }`

#### `POST /api/media-collection/:id/settings`
- **Middleware:** auth, csrf, verified collection, rate limiter
- **Body:** `{ iconColor?, playbackSpeed? }`

#### `GET /api/media-collection/:id/settings`
- **Middleware:** verifyCookie, verified collection
- **Public:** returns settings without auth for embedded player.

#### `DELETE /api/media-collection/:id`
- **Middleware:** auth, csrf, verified collection, rate limiter
- **Response:** `{ deletionId: "...", message: "Media collection deletion initiated" }`
- Triggers asynchronous deletion job via queue.

---

### 🎥 Video Management

#### `POST /api/video/:id/upload`
- **Middleware order:** auth → verify collection → csrf → multer file upload → nsfw validation → controller
- **Form Data:** `video` file + `videoname` field
- **Response (201):** `{ videoId, jobId, message: "Video is queued for transcoding" }`

#### `GET /api/video/:id/request/:videoId`
- **Middleware:** auth, verify collection, csrf
- **Action:** issues signed playback cookie, redirects (303) to `/stream` endpoint.

#### `GET /api/video/:id/stream/:videoId`
- **Middleware:** verify collection, verifyCookie
- **Action:** checks cookie payload, finds completed video and redirects (302) to HLS delivery path.

#### `GET /api/video/:id/refresh/stream`
- **Middleware:** verify collection, verifyCookie
- **Action:** extends playback cookie expiration.

#### `DELETE /api/video/:id/stream/:videoId`
- **Middleware:** auth, csrf, verify collection
- **Action:** removes video document, removes reference from collection, enqueues deletion job.

---

### 📌 Auxiliary Endpoints

- `/api/hls/enc/:videoId` – serves AES key information for HLS decryption.
- Health-checks or static file endpoints may exist in `app.ts`.


## 🧱 Models

- **UserModel** – fields: username, email, passwordHash, provider, googleId, methods for auth token generation & password hashing.
- **MediaCollectionModel** – stores owner, name, allowed origins, hashed access token, delivery paths, video IDs.
- **Video** – video metadata, jobId, status, deliveryPath, etc.
- **Settings** – playback UI choices per user+collection.
- **BlackTokenModel** – blacklisted JWTs for logout.


## ⚙️ Queues & Workers

### `/src/queues/video.queue.ts`
Enqueues a job with videoId & input path.

### `/src/queues/delete.queue.ts`
Enqueues deletion request with collection id, video IDs, and delivery paths.

### `/src/workers/video.worker.ts`
Listens on `transcode-queue`. Uses FFmpeg to:
- create adaptive-bitrate HLS streams (144p→2160p)
- generate AES-128 key + `encInfo.txt` referencing key endpoint
- report progress events updating `Video` status
- handle failure cleanup

### `/src/workers/delete.worker.ts`
Listens on `delete-queue`. Removes DB records and deletes files from disk.

Workers are instantiated automatically when importing the file; nothing special required.


## 📄 Response Format

All responses follow a consistent JSON schema:

```json
{
  "success": true | false,
  "message": "Human readable description",
  "data?": {...},
  "error?": {...}
}
```

- **Success:** `200`–`201` with `success:true`.
- **Client Errors:** `400`–`429` with `success:false`.
- **Auth Errors:** `401`/`403`.
- **Server Errors:** `500` with generic message. Detailed logs are printed server-side.


## 🛠 Running & Development

- **Lint:** `npm run lint`
- **Tests:** (if available) `npm run test`
- **Build:** `npm run build` → output to `/dist`.

Set `NODE_ENV=development` for verbose logging and unminified assets.


## 📉 Error Handling & Logging

- Custom `AppError` class standardizes operational errors.
- `asyncHandler` wrapper reduces try/catch boilerplate.
- Unhandled rejections and exceptions are logged and gracefully shut down via `server.ts`.


## 📝 Further Notes

- NSFW detection uses TensorFlow.js & NSFWJS with in-memory caching to reduce latency.
- Playback cookies are signed (cookie-parser's `signed` option). They expire after one hour and can be refreshed.
- Access tokens for media collections are hashed before storage (similar to passwords).
- The HLS encryption key endpoint (`/api/hls/enc/:id`) reads the generated key file; ensure `BASE_URL` is correct.
- Rate limiter configuration is in `essential.config.ts`; adjust window/limit values as needed.

---

This document should serve as a complete reference for backend flow, routes, middleware, and API structure. Feel free to extend with Swagger docs or Postman collections for external consumers.

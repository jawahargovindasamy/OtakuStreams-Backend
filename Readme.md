<div align="center">
  <h1>🌸 OtakuStreams Backend API</h1>
  <p><strong>A production-ready, highly secure REST & WebSocket API powering the OtakuStreams ecosystem.</strong></p>
  <p>
    <a href="#1-scope-and-overview">Scope & Overview</a> •
    <a href="#2-file-and-folder-overview">File Structure</a> •
    <a href="#3-installation-and-setup">Installation</a> •
    <a href="#4-usage-and-endpoints">API Routes & Config</a> •
    <a href="#5-architecture-and-design">Architecture</a> •
    <a href="#6-development-and-testing">Development</a> •
    <a href="#7-deployment">Deployment</a> •
    <a href="#8-cicd-monitoring-and-security">Security & Sockets</a> •
    <a href="#9-troubleshooting">Troubleshooting</a> •
    <a href="#10-contributing-and-contact">Contributing</a> •
    <a href="#11-license-and-credits">License</a>
  </p>
  <p>
    <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square&logo=nodedotjs" />
    <img alt="Express" src="https://img.shields.io/badge/Express-4.x-black.svg?style=flat-square&logo=express" />
    <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-6%2B-brightgreen.svg?style=flat-square&logo=mongodb" />
    <img alt="Mongoose" src="https://img.shields.io/badge/Mongoose-7.x-red.svg?style=flat-square&logo=mongoose" />
    <img alt="Socket.io" src="https://img.shields.io/badge/Socket.io-4.x-blue.svg?style=flat-square&logo=socketdotio" />
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-blue.svg?style=flat-square" />
  </p>
</div>

---

## 1) Scope and Overview

The **OtakuStreams Backend API** is the powerhouse behind the OtakuStreams ecosystem. It manages highly-secured user sessions, keeps track of users' watchlists and episode consumption, maps evolution patterns of airing anime, and dispatches real-time upload alerts using WebSockets.

### Core Goals
1. **Bulletproof Authentication:** Secure registration, password hashing (bcrypt), and JSON Web Token (JWT) session generation.
2. **Flexible Watchlist Organization:** Tabbed tracking across five states (`plan_to_watch`, `watching`, `on_hold`, `completed`, `dropped`) with custom reviews, ratings, and note-taking.
3. **Continue Watching Synchronization:** Captures playback progress down to the exact second, letting users sync resume coordinates instantly.
4. **Intelligent Event Dispatching:** Combines automated daily schedule synchronizations (via the AniList API) with precision cron tasks to verify video uploads and emit instant WebSocket events.

### Tech Stack
- **Node.js (v18+) & Express.js:** Fast and minimalist web framework.
- **MongoDB & Mongoose:** Persistent, schema-enforced relational document structures.
- **Socket.IO:** Low-latency WebSockets layer for real-time client push notifications.
- **Node-Cron:** Precision back-end cron scheduler.
- **Winston & Morgan:** Unified, structured file logging utilizing high-performance streams.
- **Nodemailer:** Simple SMTP engine for automated password recovery.

---

## 2) File and Folder Overview

The backend is structured into highly cohesive modules representing routes, database collections, API controllers, and scheduler engines.

```
/
├── config/                 # Database connectors and custom parameters
│   └── database.js         # Mongoose MongoDB connection pooling logic
├── constants/              # System-wide enum collections
│   └── statusCodes.js      # Explicit HTTP response status codes mapping
├── controllers/            # Request routers & business logic controllers
│   ├── authController.js   # User registrations, logins, and password resets
│   ├── userController.js   # User profiles customization and account deletion
│   ├── watchlistController.js# CRUD operations on users' watchlist items
│   ├── continueWatchingController.js # Handles video playback progress saving
│   ├── notificationController.js # Fetching, reading, and clearing alerts
│   └── randomController.js # AniList API random trending query
├── jobs/                   # Background Node-Cron schedules
│   ├── scheduleJob.js      # Daily airing schedule synchronization (12:15 AM IST)
│   └── episodeNotificationJob.js # Scans airing episodes for uploads (Every 30m)
├── middleware/             # Request pre-processors and controllers
│   ├── authMiddleware.js   # JWT verification and route protection
│   ├── errorHandler.js     # Global catch-all exceptions converter
│   └── rateLimiter.js      # express-rate-limit brute force blocker
├── models/                 # Database Schema definitions
│   ├── User.js             # User accounts, security salts, and profile preferences
│   ├── Watchlist.js        # Personal anime lists, notes, and progress metrics
│   ├── ContinueWatching.js # Exact episode playback progress track indices
│   ├── ScheduledEpisode.js # Synchronized AniList schedule items
│   └── Notification.js     # Unread, read, and bulk-cleared notification logs
├── routes/                 # Express route entry tables mapping to controllers
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── watchlistRoutes.js
│   ├── continueWatchingRoutes.js
│   ├── notificationRoutes.js
│   └── randomRoutes.js
├── services/               # Core utility services and API connectors
│   ├── notificationService.js # Scans video uploads and creates DB records
│   ├── scheduleService.js  # Polls AniList for airing timetables
│   └── socketService.js    # Express HTTP server Socket.IO lifecycle binder
├── utils/                  # Miscellaneous modules
│   └── logger.js           # Winston logger piping to stderr and files
├── .env.example            # Environment variables placeholder
├── index.js                # System bootstrapping file containing keep-alive self-pings
├── package.json            # Script commands and dependencies tracker
└── package-lock.json       # Strict versions freeze map
```

---

## 3) Installation and Setup

### Prerequisites
- **Node.js:** `v18.x.x` or higher
- **MongoDB:** `v6.x.x` or higher (Local database server or MongoDB Atlas connection)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jawahargovindasamy/OtakuStreams-Backend.git
   cd OtakuStreams-Backend
   ```

2. **Install all production and development dependencies:**
   ```bash
   npm install
   ```

3. **Configure the Environment:**
   Create a `.env` file using the template:
   ```bash
   cp .env.example .env
   ```
   Open the newly created `.env` file and customize the variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/anime_streaming
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   EMAIL_FROM=Anime Stream <noreply@animestream.com>
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the Application:**
   * **Development Mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   * **Production Mode:**
     ```bash
     npm start
     ```
   *The server will boot up on port `5000`.*

---

## 4) Usage and Endpoints

The API enforces strict response parameters, utilizing JWT authentication inside client headers.

### Detailed Endpoint Map

#### 🔑 Authentication (`/api/auth`)
* `POST /register` - Creates account. Rate limited to 5 requests per 15 minutes.
* `POST /login` - Signs in and returns JWT token. Rate limited to 5 requests per 15 minutes.
* `POST /forgot-password` - Resets and mails a random password to the user.
* `POST /reset-password` - Changes password (Requires active Auth header).
* `GET /me` - Returns logged-in profile data (Requires active Auth header).
* `POST /logout` - Standard session end indicator.

#### 👤 Profile customization (`/api/users`)
* `PUT /profile` - Edits username, avatar URL, and notification ignore states.
* `DELETE /account` - Deletes account and wipes database watchlist and history logs.

#### 📁 Watchlist (`/api/watchlist`)
* `POST /` - Saves an anime record (`animeId`, `status`, `notes`, `rating`).
* `GET /` - Fetches watchlist items (Filters by `status`, parses pagination).
* `GET /stats` - Returns user's aggregated watchlist counts and mean ratings.
* `PUT /:id` - Edits specific watchlist indices (e.g. increments episode counts).
* `DELETE /:id` - Deletes specific watchlist entries.
* `GET /check/:animeId` - Confirms if an anime exists in the user's watchlist.

#### ⏳ Continue Watching Playback (`/api/continue-watching`)
* `POST /` - Synchronizes progress (`animeId`, `currentTime`, `duration`).
* `GET /` - Returns history array sorted by last watched date.
* `GET /:animeId` - Pulls progress details of a single anime.
* `DELETE /:animeId` - Wipes progress history of a specific anime.
* `DELETE /` - Clears entire viewing logs database of the user.

#### 🔔 Notification Alerts (`/api/notification`)
* `GET /` - Returns user's notification list.
* `GET /:id/read` - Marks an alert as read.
* `GET /clear` - Flushes entire notification lists.
* `GET /test-notifications` - Triggers the notification checking daemon manually (Admin/Test).

---

## 5) Architecture and Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HTTP & WEBSOCKET ENGINE                          │
│                                                                             │
│                    HTTP REST Pipeline   ┌────────────────┐                  │
│    ┌───────────────┐ ─────────────────➔ │  Express App   │                  │
│    │  React Client │                    └────────┬───────┘                  │
│    └───────┬───────┘                             │                          │
│            │                                     ├─➔ [Morgan Log Pipeline]  │
│            │ WebSocket Channels                  │          │               │
│            │ (Real-Time notification push)       ▼          ▼               │
│            └───────────────────────────► [Socket.IO] [Winston Logger]       │
│                                                  │                          │
└──────────────────────────────────────────────────┼──────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SCHEDULER & DATABASE                            │
│                                                                             │
│    ┌────────────────┐   node-cron daemon    ┌──────────┐                    │
│    │ Scheduled Jobs │ ────────────────────➔ │ Mongo DB │                    │
│    └────────────────┘                       └──────────┘                    │
│            │                                                                │
│            ├─➔ [scheduleJob.js] ──➔ Sync Daily timetables from AniList      │
│            └─➔ [episodeNotificationJob.js] ─➔ Probe Megaplay Buzz streams   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6) Development and Testing

- **Linting Rules:** The codebase utilizes strict ES Module constraints with standard ESLint rule controls.
- **Log Management:** Winston logging records data into separate log files (`logs/err.log` and `logs/out.log`) utilizing colorized consoles for development and JSON formatters in production environments.
- **Contribution Model:** Ensure all database queries utilize proper indexing, use standard status codes defined in `/constants/statusCodes.js`, and check all parameters through robust sanitization pipelines.

---

## 7) Deployment

### 🐳 Docker Setup
Use the integrated alpine dockerfile configuration:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Deployed Node Clustering via PM2
In multi-core server spaces, run Express clustered utilizing `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'anime-api',
    script: './index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log'
  }]
};
```

---

## 8) CI/CD, Monitoring, and Security

- **Real-Time Keep-Alives:** The backend includes a self-ping system that queries the server's own `/health` endpoint every 8 minutes, preventing the app container from going to sleep on free hosting instances like Render.
- **Robust Protection:** Enforces advanced security headers utilizing the **Helmet** package, strictly filters origins using a tailored **CORS** controller, and uses Express rate limiters on sensitive entry points to mitigate brute-force attacks.
- **Socket Rooms:** Dispatches real-time WebSocket messages using Socket.IO, mapping users to personalized, secure rooms identified by their database IDs.

---

## 9) Troubleshooting

1. **MongoDB Connection Failures:**
   - *Symptoms:* Console displays Mongoose error or server fails to start.
   - *Fix:* Ensure the MongoDB daemon is active:
     ```bash
     sudo systemctl start mongod # Linux
     # Or verify your remote connection string in the .env file.
     ```

2. **Nodemailer SMTP Connection Failures:**
   - *Symptoms:* Password recovery returns success but emails fail to arrive.
   - *Fix:* Verify your password string. When using Gmail SMTP, you *must* generate an App-Specific Password inside your Google account configurations; standard account passwords will be rejected.

3. **Socket Connections Failing with CORS Errors:**
   - *Symptoms:* The browser console raises continuous connection drop warnings.
   - *Fix:* Check your `.env` configuration. Ensure `FRONTEND_URL` exactly matches the hostname of your web app (with no trailing slashes).

---

## 10) Contributing and Contact

Feel free to fork the repository, write custom controllers, and submit pull requests.

- **Lead Maintainer:** Jawahar Govindasamy
- **Repository:** [GitHub OtakuStreams Backend](https://github.com/jawahargovindasamy/OtakuStreams-Backend)

---

## 11) License and Credits

### License
This backend service is open-source and licensed under the **ISC License**.

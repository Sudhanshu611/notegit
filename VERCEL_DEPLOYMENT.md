# NoteGit Vercel Deployment Plan

This document outlines the architecture, constraints, and steps required to make **NoteGit** deployable on Vercel as a single monorepo.

---

## Architectural Constraints on Vercel

When deploying a coordinated Express + React filesystem-based application to Vercel, we must account for serverless constraints:

### 1. Ephemeral & Read-Only Filesystem
* **Constraint:** Vercel Serverless Functions run in write-isolated containers where the root filesystem is read-only. The only writable directory is `/tmp`. Additionally, `/tmp` is ephemeral—its contents are cleared whenever the serverless container scale-down or recycles (often within minutes).
* **Workaround (for Demo):** We will update [StorageEngine.js](file:///d:/note_git/backend/storage/StorageEngine.js) to detect if the app is running in a serverless environment (checking `process.env.VERCEL`). If so, we will redirect the storage root path from the user's home directory (`~/.notegit`) to `/tmp/.notegit`.
* **Note:** This means note data will be temporary. For permanent production storage, a database adapter (e.g. Postgres or MongoDB) would be required.

### 2. No WebSockets or Background Watchers
* **Constraint:** Vercel Serverless Functions have execution time limits (e.g., 10-15 seconds) and cannot run background loops or hold open persistent connections.
  * **Socket.io** connection will fail to connect or upgrade to WebSockets on Vercel.
  * **Chokidar file watcher** daemon will not run.
* **Impact:** The status bar in the bottom right will show `WATCHER OFFLINE`. However, the app will continue to function fully via HTTP REST API calls—actions like creating a note, committing changes, rendering visualizer states, and using the AI assistant will work seamlessly on demand.

---

## Proposed Changes

### 1. Configure Monorepo Routing
We will add a root-level [vercel.json](file:///d:/note_git/vercel.json) file to route frontend and backend requests.

#### [NEW] [vercel.json](file:///d:/note_git/vercel.json)
This routes static frontend assets and redirects any `/api/*` calls to the serverless entry point.
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

### 2. Adapt Storage Path for Serverless Environment
We will modify [StorageEngine.js](file:///d:/note_git/backend/storage/StorageEngine.js) to use `/tmp` when running on Vercel.

#### [MODIFY] [StorageEngine.js](file:///d:/note_git/backend/storage/StorageEngine.js)
```javascript
import fs   from 'fs-extra'
import path from 'path'
import os   from 'os'

// Detect serverless environment
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const ROOT = isVercel 
  ? path.join('/tmp', '.notegit')
  : path.join(os.homedir(), '.notegit');
```

### 3. Handle API Client Endpoint Adaptability
Currently, the frontend API client connects to `http://localhost:3001`. On Vercel, requests should go directly to the relative `/api` path.

#### [MODIFY] [client.js](file:///d:/note_git/frontend/src/api/client.js)
```javascript
import axios from 'axios'

const isVercel = import.meta.env.PROD; // Vite production build
const client = axios.create({
  baseURL: isVercel ? '/api' : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

export default client
```

### 4. Guard Socket.io and Watcher Initialization
To prevent crashes on start, we will configure the server to conditionally start the Socket.io watcher only if not running in serverless.

#### [MODIFY] [server.js](file:///d:/note_git/backend/server.js)
Ensure `startWatcher` and WebSocket event bindings are bypassed or handle failures gracefully on Vercel.

---

## Action Plan

1. Create root-level [vercel.json](file:///d:/note_git/vercel.json) config.
2. Edit [StorageEngine.js](file:///d:/note_git/backend/storage/StorageEngine.js) to swap directory path in serverless.
3. Edit [client.js](file:///d:/note_git/frontend/src/api/client.js) to support production host resolution.
4. Update [server.js](file:///d:/note_git/backend/server.js) socket listening setups.
5. Create deployment guide.

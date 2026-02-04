# PromptCraft Studio Pro v4: Backend Integration Guide

This document outlines the architecture and technical requirements for migrating from a LocalStorage-based frontend to a robust, multi-tenant persistent backend.

## 1. Core Objectives
- **Persistent Storage**: Save prompts, character libraries, and logical analyses across sessions/devices.
- **RAG Integration**: Enable deep context binding for the Analysis Arena.
- **Project Versioning**: Allow users to fork and rollback prompt configurations.
- **User Authentication**: Secure access to API keys and personal libraries.
- **Real-time Logic Processing**: Stream active detection logs for the Neural Arena.

---

## 2. API Endpoints Schema

### A. Authentication & User Profile
- `POST /api/auth/register` | `POST /api/auth/login`
- `GET /api/user/profile`: Retrieve user settings, current Gemini API key, and **UI Preferences** (isDark, defaultMode).

### B. Subject Library (Characters)
- `GET /api/subjects`: List all saved subjects.
- `POST /api/subjects`: Create a new subject entry.
- `PUT /api/subjects/:id`: Update subject details.
- `DELETE /api/subjects/:id`: Remove subject.

### C. Prompt Management
- `GET /api/prompts`: List saved prompts with metadata (Mode, Aspect, Style).
- `POST /api/prompts`: Save a generated or refined prompt.
- `GET /api/prompts/history/:id`: Access version history for a specific prompt stack.

### D. Neural Analysis Arena (Logic)
- `POST /api/analysis/execute`: Receives video metadata and calibration variables. Returns cached or new WTS results.
- `GET /api/analysis/library`: Archive of previous adjudications.
- `POST /api/analysis/upload-context`: Handle `.pdf`, `.txt`, `.vtt` file uploads for RAG processing.
- `WS /api/analysis/stream`: WebSocket for real-time "Active Detection" logs.

---

## 3. Database Schema (PostgreSQL Recommendation)

### Users Table
- `id`: UUID
- `email`: String (Unique)
- `password_hash`: String
- `api_key_encrypted`: Text
- `settings`: JSONB (isDark, defaultMode, lastUsedCalibration)

### Subjects Table
- `id`: UUID
- `user_id`: FK(Users.id)
- `name`: String
- `text`: Text
- `created_at`: Timestamp

### Prompts Table
- `id`: UUID
- `user_id`: FK(Users.id)
- `content`: Text
- `metadata`: JSONB (mode, aspect, model, style_array, detailLevel)
- `is_favorite`: Boolean

### Video_History Table
- `id`: UUID
- `user_id`: FK(Users.id)
- `prompt`: Text
- `visual_style`: String
- `camera_movement`: String
- `duration_style`: String
- `video_url`: String
- `created_at`: Timestamp

### Analyses Table
- `id`: UUID
- `user_id`: FK(Users.id)
- `scenario_name`: String
- `verdict`: Text
- `reliability_score`: Integer
- `gamified_metrics`: JSONB (pointsA, pointsB, truthPot, followersA, followersB, award)
- `video_reference`: String (S3/Cloudinary URL)
- `calibration`: JSONB (country, year, demography, persona, weights, intent, logicStyle, stakeholderMode, marginOfError)
- `rag_context`: JSONB (urls, file_references, system_prompt)

---

## 4. RAG (Retrieval-Augmented Generation) Strategy
To handle "Knowledge Binding" effectively:
1. **File Ingestion**: Use a library like `pdf-parse` or a service like `Unstructured` on the backend.
2. **Vectorization**: Generate embeddings for context files using `text-embedding-004`.
3. **Vector DB**: Store in `Pinecone` or `pgvector`.
4. **Context Injection**: When calling `gemini-3-pro-preview`, the backend queries the Vector DB for relevant chunks and injects them into the `contextFiles` field of the system prompt.

---

## 5. Wiring Instructions & UI State
- **Theme Persistence**: Ensure `isDark` is synced with the backend profile. On login, the frontend should apply the theme immediately to avoid "flash of white".
- **Calibration Auto-fill**: Persistence of `lastUsedCalibration` allows users to pick up where they left off in the Arena without re-selecting Year/Country.
- **Logic Tuning Sync**: The backend must store advanced fields (`intent`, `logicStyle`, `stakeholderMode`, `marginOfError`) to recreate the specific adjudication context for future audits.
- **Active Detection**: The backend should parse Gemini's stream or chunks and emit "Fallacy Violation" events over WebSockets to trigger the scrolling Active Detection console in the UI.

---

## 6. Deployment Instructions
1. **Environment Variables**:
   - `JWT_SECRET`: For session security.
   - `ENCRYPTION_KEY`: For AES-256 encryption of user API keys.
   - `DATABASE_URL`: PostgreSQL connection string.
2. **File Storage**: Use **AWS S3** or **Google Cloud Storage** with signed URLs to handle video uploads securely before passing them to the Gemini API.
3. **Caching**: Use **Redis** for WTS results of common public YouTube URLs to save on Gemini token costs.

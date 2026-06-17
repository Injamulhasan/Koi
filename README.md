# KOI Platform

## Technical Architecture & Developer Documentation

### Version 1.0

### React + Node.js + Supabase Edition

---

# Document Information

| Field           | Value                      |
| --------------- | -------------------------- |
| Product Name    | KOI                        |
| Version         | 1.0                        |
| Architecture    | React + Express + Supabase |
| Frontend        | React + Vite + TailwindCSS |
| Backend         | Node.js + Express          |
| Database        | Supabase PostgreSQL        |
| Authentication  | Supabase Auth              |
| Realtime        | WebSockets                 |
| ORM             | Drizzle ORM                |
| Package Manager | PNPM                       |
| Deployment      | Render + Supabase          |

---

# Table of Contents

1. Executive Summary
2. Product Overview
3. Business Objectives
4. System Architecture
5. Technology Stack
6. Project Structure
7. Frontend Architecture
8. Backend Architecture
9. Database Architecture
10. Authentication System
11. API Design
12. Realtime Communication
13. User Management
14. Dashboard Module
15. Voting Module
16. Schedule Module
17. Chat Module
18. Contributions Module
19. Lending Module
20. Notifications Module
21. Security Architecture
22. Environment Configuration
23. Local Development Setup
24. Deployment Guide
25. Monitoring & Logging
26. CI/CD Strategy
27. Scaling Strategy
28. Backup & Recovery
29. Maintenance Guide
30. Future Roadmap

---

# 1. Executive Summary

KOI is a collaborative community coordination platform designed to manage group activities, location voting, event scheduling, communication, financial contributions, lending records, and notifications through a centralized web application.

The platform provides:

* Secure authentication
* Community communication
* Real-time collaboration
* Democratic location voting
* Financial transparency
* Event scheduling
* Lending management
* Notification system

The application is built using a modern full-stack architecture leveraging React, Node.js, Supabase, and PostgreSQL.

---

# 2. Product Overview

## Purpose

KOI serves as a community coordination platform allowing users to:

* Participate in community decisions
* Vote on locations
* Manage recording schedules
* Chat with other members
* Track contributions
* Manage lending records
* Receive important notifications

## Target Users

### Primary Users

Community Members

Capabilities:

* Login
* Vote
* Chat
* Schedule participation
* Track finances
* Receive notifications

### Administrators

Capabilities:

* Manage schedules
* Monitor activity
* Configure locations
* Manage system announcements

---

# 3. Business Objectives

## Core Goals

### Community Collaboration

Provide a centralized communication platform.

### Transparency

Track financial contributions and lending activities.

### Decision Making

Enable democratic voting for event locations.

### Coordination

Manage scheduling and communication efficiently.

### Scalability

Support growth without architectural redesign.

---

# 4. System Architecture

## High-Level Architecture

```text
Frontend (React)
        │
        ▼
REST API (Express)
        │
        ▼
Authentication Layer
(Supabase Auth)
        │
        ▼
Database Layer
(Supabase PostgreSQL)
        │
        ▼
Realtime Layer
(WebSocket Server)
```

---

## Request Flow

```text
User Action
    │
    ▼
React Component
    │
    ▼
API Client
    │
    ▼
Express Route
    │
    ▼
Auth Middleware
    │
    ▼
Database Query
    │
    ▼
Response
```

---

# 5. Technology Stack

## Frontend

| Technology    | Purpose        |
| ------------- | -------------- |
| React         | UI Framework   |
| Vite          | Build Tool     |
| Tailwind CSS  | Styling        |
| React Query   | Data Fetching  |
| Framer Motion | Animations     |
| Wouter        | Routing        |
| Supabase JS   | Authentication |

## Backend

| Technology  | Purpose          |
| ----------- | ---------------- |
| Node.js     | Runtime          |
| Express     | API Server       |
| Drizzle ORM | Database Access  |
| PostgreSQL  | Database         |
| WebSocket   | Realtime Updates |
| Dotenv      | Configuration    |

## Infrastructure

| Technology | Purpose         |
| ---------- | --------------- |
| Supabase   | Auth + Database |
| Render     | Hosting         |
| GitHub     | Source Control  |

---

# 6. Project Structure

```text
koi/
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── lib/
│   │   ├── app.js
│   │   └── index.js
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── schema.sql
├── package.json
└── README.md
```

---

# 7. Frontend Architecture

## Layer Structure

```text
Pages
 │
Components
 │
Hooks
 │
API Layer
 │
Backend
```

## Responsibilities

### Pages

Feature-level screens.

Examples:

* Dashboard
* Vote
* Chat
* Schedule
* Profile

### Components

Reusable UI elements.

Examples:

* Button
* Card
* Dialog
* Badge
* Avatar

### Hooks

Business logic abstraction.

Examples:

* useAuth
* useUser
* useWebSocket

### API Layer

Handles backend communication.

---

# 8. Backend Architecture

## Layers

```text
Routes
 │
Middleware
 │
Services
 │
Database
```

### Routes

Handle HTTP requests.

### Middleware

Authentication and validation.

### Services

Business logic.

### Database Layer

Drizzle ORM + PostgreSQL.

---

# 9. Database Architecture

## Tables

### users

Stores platform users.

| Column      | Type   |
| ----------- | ------ |
| id          | serial |
| supabase_id | text   |
| name        | text   |
| email       | text   |

---

### locations

Voting locations.

| Column | Type   |
| ------ | ------ |
| id     | serial |
| name   | text   |

---

### votes

User location votes.

| Column      | Type    |
| ----------- | ------- |
| id          | serial  |
| user_id     | integer |
| location_id | integer |

---

### schedule

Event scheduling.

### messages

Chat records.

### message_reactions

Message reactions.

### contributions

Financial contributions.

### lending_records

Debt tracking.

### notifications

User alerts.

---

# 10. Authentication System

## Provider

Supabase Auth

---

## Authentication Flow

```text
Signup
  │
  ▼
Supabase Auth
  │
  ▼
JWT Token
  │
  ▼
Backend Validation
  │
  ▼
Local User Sync
```

---

## Authorization

Bearer Token

```http
Authorization: Bearer JWT_TOKEN
```

---

# 11. API Design

## Base URL

```text
/api
```

---

## Authentication Endpoints

### POST /auth/sync

Sync authenticated user.

Response:

```json
{
  "success": true,
  "user": {}
}
```

---

## User Endpoints

### GET /users

Returns all users.

### GET /users/me

Returns current profile.

---

## Dashboard Endpoints

### GET /dashboard

Returns dashboard statistics.

---

# 12. Realtime Communication

## WebSocket Architecture

```text
Client
 │
 ▼
WebSocket Server
 │
 ├── Votes
 ├── Chat
 ├── Schedule
 ├── Lending
 └── Notifications
```

---

## Event Types

### vote:created

Broadcast vote updates.

### message:created

Broadcast chat messages.

### schedule:updated

Broadcast schedule changes.

### lending:created

Broadcast lending records.

### notification:created

Broadcast notifications.

---

# 13. User Management

## Features

* Registration
* Login
* Logout
* Profile Management
* Avatar Support

## User Lifecycle

```text
Create Account
   │
   ▼
Authenticate
   │
   ▼
Sync Profile
   │
   ▼
Access Platform
```

---

# 14. Dashboard Module

## Purpose

Central overview of platform activity.

## Widgets

* User Count
* Active Vote
* Schedule Status
* Contribution Summary
* Lending Summary
* Recent Messages

---

# 15. Voting Module

## Features

* One vote per user
* Location selection
* Live vote updates

## Process

```text
Select Location
    │
    ▼
Submit Vote
    │
    ▼
Store Vote
    │
    ▼
Broadcast Update
```

---

# 16. Schedule Module

## Features

* Set Date
* Set Time
* Update Schedule
* Live Updates

## Permissions

Authenticated users only.

---

# 17. Chat Module

## Features

* Message posting
* Reactions
* Live updates

## Message Schema

```json
{
  "id": 1,
  "userId": 5,
  "message": "Hello",
  "createdAt": "timestamp"
}
```

---

# 18. Contributions Module

## Purpose

Track shared contributions.

## Features

* Contribution history
* Totals
* User balances

---

# 19. Lending Module

## Purpose

Manage community debts.

## Features

* Create loans
* Mark repayment
* Outstanding balances

## Lifecycle

```text
Create Loan
   │
   ▼
Active
   │
   ▼
Repaid
```

---

# 20. Notifications Module

## Features

* System notifications
* Schedule updates
* Vote reminders
* Contribution alerts

---

# 21. Security Architecture

## Authentication

Supabase JWT

## Authorization

Protected Express routes.

## Best Practices

* HTTPS
* Token validation
* Environment isolation
* Input sanitization
* CORS restrictions

---

# 22. Environment Configuration

## Frontend

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=
```

## Backend

```env
PORT=3000
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

# 23. Local Development Setup

## Install

```bash
pnpm install
```

## Database

Execute:

```bash
schema.sql
```

inside Supabase SQL Editor.

## Run

```bash
pnpm dev
```

---

# 24. Deployment Guide

## Backend (Render)

Build:

```bash
pnpm install
```

Start:

```bash
pnpm --filter backend start
```

---

## Frontend (Render Static Site)

Build:

```bash
pnpm --filter frontend build
```

Publish:

```text
frontend/dist
```

---

# 25. Monitoring & Logging

## Backend Logs

* Request logs
* Error logs
* Authentication logs

## Metrics

Track:

* API latency
* Error rate
* Active users
* WebSocket connections

---

# 26. CI/CD Strategy

```text
GitHub
   │
   ▼
Push
   │
   ▼
Render Build
   │
   ▼
Deploy
```

Recommended:

* Pull Request workflow
* Preview environments
* Protected branches

---

# 27. Scaling Strategy

## Horizontal Scaling

Backend services can be replicated.

## Database Scaling

Use Supabase managed infrastructure.

## Caching

Future Redis integration.

---

# 28. Backup & Recovery

## Database Backups

Managed by Supabase.

Recommended:

* Daily backup verification
* Monthly restore testing

---

# 29. Maintenance Guide

## Weekly

* Review logs
* Verify deployments

## Monthly

* Security updates
* Dependency updates

## Quarterly

* Architecture review
* Performance testing

---

# 30. Future Roadmap

## Phase 2

* Mobile Application
* Push Notifications
* File Uploads
* Admin Dashboard
* Analytics

## Phase 3

* Multi-Community Support
* Event Management
* Advanced Permissions
* Community Marketplace

---

# Appendix A — API Inventory

```text
POST   /auth/sync
GET    /users
GET    /users/me
GET    /dashboard
GET    /locations
POST   /votes
GET    /schedule
POST   /schedule
GET    /messages
POST   /messages
GET    /contributions
POST   /contributions
GET    /lending
POST   /lending
GET    /notifications
```

---

# Appendix B — Production Readiness Checklist

✓ Authentication configured

✓ Database schema deployed

✓ Environment variables configured

✓ SSL enabled

✓ Render deployment configured

✓ Logging enabled

✓ Error handling implemented

✓ WebSocket communication verified

✓ Database backups enabled

✓ Monitoring configured

---

END OF DOCUMENT

# 📡 DCA Revenue Intelligence Platform: API Reference Guide

Welcome to the official developer API reference documentation for the **DCA Revenue Intelligence Command Center**. This guide outlines all available REST API endpoints on port `8000`, along with real-world business use cases, exact JSON payloads, responses, and interactive `curl` scripts.

---

## 📂 Core Module Index

1. [🔒 Authentication Module](#1-authentication-module)
2. [📅 Smart Enterprise Scheduling](#2-smart-enterprise-scheduling)
3. [🤖 Autonomous Conversational AI Discovery](#3-autonomous-conversational-ai-discovery)
4. [👥 Sales Rep & Calendar Sync Optimization](#4-sales-rep--calendar-sync-optimization)
5. [📊 RevOps Analytics & Compliance Auditing](#5-revops-analytics--compliance-auditing)
6. [🔮 Enterprise Demo Orchestration](#6-enterprise-demo-orchestration)
7. [🗄️ Legacy Bookings Interface](#7-legacy-bookings-interface)

---

## 1. 🔒 Authentication Module
Provides secure registration, JWT token generation, and account management.

### Endpoint: `POST /api/v1/auth/register`
* **Use Case:** Registering a new platform administrator or RevOps analyst account to grant access to the Command Center dashboard.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah.jenkins@dca.ai",
  "password": "SecurePassword123!"
}
```
* **Success Response (`201 Created`):**
```json
{
  "id": 1,
  "name": "Sarah Jenkins",
  "email": "sarah.jenkins@dca.ai",
  "role": "user",
  "is_active": true,
  "created_at": "2026-05-18T13:45:00Z"
}
```
* **Error Response (`400 Bad Request`):**
```json
{
  "detail": "Email already registered"
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Sarah Jenkins","email":"sarah.jenkins@dca.ai","password":"SecurePassword123!"}'
```

---

### Endpoint: `POST /api/v1/auth/login`
* **Use Case:** Authenticating user credentials to obtain a secure JSON Web Token (JWT) bearer key for restricted API access.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "email": "sarah.jenkins@dca.ai",
  "password": "SecurePassword123!"
}
```
* **Success Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```
* **Error Response (`401 Unauthorized`):**
```json
{
  "detail": "Incorrect email or password"
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.jenkins@dca.ai","password":"SecurePassword123!"}'
```

---

## 2. 📅 Smart Enterprise Scheduling
Advanced calendar allocation algorithm with time-zone normalization and automated booking locks.

### Endpoint: `POST /api/v1/bookings/check-slots`
* **Use Case:** Dynamically queries available 30-minute booking windows across all active sales representatives based on a target date, normalizes time zones, and ranks them by optimal recommendation scoring.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "date": "2026-06-01",
  "meeting_type_slug": "product-demo",
  "timezone": "America/New_York"
}
```
* **Success Response (`200 OK`):**
```json
[
  {
    "user_time": "2026-06-01T09:00:00-04:00",
    "rep_id": 1,
    "available": true,
    "score": 95,
    "recommendation_reason": "Optimal slot for Sarah Jenkins based on load balancing"
  },
  {
    "user_time": "2026-06-01T09:30:00-04:00",
    "rep_id": 2,
    "available": true,
    "score": 88
  }
]
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/bookings/check-slots \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-06-01","meeting_type_slug":"product-demo","timezone":"America/New_York"}'
```

---

### Endpoint: `POST /api/v1/bookings/hold-slot`
* **Use Case:** Temporarily locks a specific time slot in Redis for 5 minutes (300 seconds) while the prospect completes their details, preventing double-booking race conditions.
* **Request Params (Query):** `date=2026-06-01&time=09:00:00`
* **Success Response (`200 OK`):**
```json
{
  "status": "locked",
  "expires_in": 300
}
```
* **Testing Command:**
```bash
curl -X POST "http://localhost:8000/api/v1/bookings/hold-slot?date=2026-06-01&time=09:00:00"
```

---

### Endpoint: `POST /api/v1/bookings/reschedule`
* **Use Case:** Enables secure, ID-free customer rescheduling using a secret lifecycle token sent to their email (fully compliant with privacy architectures).
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "token": "resched_token_abc123xyz",
  "new_date": "2026-06-02",
  "new_time": "14:00:00"
}
```
* **Success Response (`200 OK`):**
```json
{
  "booking_id": 37,
  "status": "rescheduled",
  "reschedule_token": "resched_token_abc123xyz",
  "cancel_token": "cancel_token_def456uvw",
  "message": "Your demo has been successfully moved."
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/bookings/reschedule \
  -H "Content-Type: application/json" \
  -d '{"token":"resched_token_abc123xyz","new_date":"2026-06-02","new_time":"14:00:00"}'
```

---

### Endpoint: `POST /api/v1/bookings/cancel`
* **Use Case:** Cancels a booked slot securely using the prospect's cancellation token.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "token": "cancel_token_def456uvw"
}
```
* **Success Response (`200 OK`):**
```json
{
  "message": "Your demo has been cancelled successfully."
}
```

---

## 3. 🤖 Autonomous Conversational AI Discovery
Real-time conversational streaming and BANT scoring gateway.

### Endpoint: `POST /api/v1/agent/chat/respond`
* **Use Case:** Prospect interacts with the identity-aware conversational concierge. The agent extracts their pain points, intent signals, company details, calculates live BANT qualification scores, and routes the lead dynamically.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "message": "I want to automate our sales calendar coordination across a team of 40 AEs.",
  "session_id": "session_prospect_999"
}
```
* **Success Response (`200 OK`):**
```json
{
  "response": "That sounds like a great use case! Handling a team of 40 Account Executives is exactly what our dynamic load balancer is designed for. May I ask what CRM platform you currently run?",
  "intent_score": 92,
  "detected_entities": {
    "organization_size": 40,
    "core_pain_point": "calendar coordination"
  },
  "session_id": "session_prospect_999"
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/agent/chat/respond \
  -H "Content-Type: application/json" \
  -d '{"message":"I want to automate our sales calendar coordination across 40 AEs.","session_id":"session_prospect_999"}'
```

---

## 4. 👥 Sales Rep & Calendar Sync Optimization
Roster utilization oversight and external OAuth provider binding.

### Endpoint: `GET /api/v1/sales-reps/`
* **Use Case:** Returns the active roster of sales representatives, their specific time zones, current load metric, and calendar statuses.
* **Success Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "name": "Sarah Jenkins",
    "email": "sarah.jenkins@dca.ai",
    "timezone": "America/New_York",
    "is_active": true,
    "current_load": 3,
    "working_hours": {
      "mon": ["09:00", "17:00"],
      "tue": ["09:00", "17:00"]
    }
  }
]
```
* **Testing Command:**
```bash
curl -s http://localhost:8000/api/v1/sales-reps/
```

---

### Endpoint: `POST /api/v1/sales-reps/connect-calendar`
* **Use Case:** Binds a sales representative's secure calendar workspace (Google Workspace / Office 365) to the GTM scheduling matrix to enable automated slot evaluation.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "provider": "google",
  "email": "sarah.jenkins@dca.ai",
  "code": "auth_flow_code_example"
}
```
* **Success Response (`200 OK`):**
```json
{
  "is_connected": true,
  "last_sync": "now",
  "sync_status": "active"
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/sales-reps/connect-calendar \
  -H "Content-Type: application/json" \
  -d '{"provider":"google","email":"sarah.jenkins@dca.ai","code":"auth_flow_code_example"}'
```

---

## 5. 📊 RevOps Analytics & Compliance Auditing
Enterprise system telemetry and tamper-evident event streaming.

### Endpoint: `GET /api/v1/analytics/dashboard`
* **Use Case:** Fetches the aggregated corporate dashboard counters (conversion rate, total booking counts, average BANT scoring metrics).
* **Success Response (`200 OK`):**
```json
{
  "period": "real_time",
  "stats": {
    "total_chats": 74,
    "total_bookings": 37,
    "conversion_rate": 50.0,
    "avg_lead_score": 86.4
  },
  "top_reps": [],
  "recent_audits": []
}
```
* **Testing Command:**
```bash
curl -s http://localhost:8000/api/v1/analytics/dashboard
```

---

### Endpoint: `GET /api/v1/analytics/audit`
* **Use Case:** Fetches the complete, tamper-evident audit log timeline to feed the Lead Journey Stream UI container, providing absolute operational compliance tracing.
* **Success Response (`200 OK`):**
```json
[
  {
    "id": 142,
    "event_type": "booking_created",
    "entity_type": "booking",
    "entity_id": 37,
    "actor": "prospect",
    "action_details": "Demo booked by Sarah Jenkins (sarah@acme.com) on 2026-06-01",
    "created_at": "2026-05-18T13:40:00Z"
  }
]
```
* **Testing Command:**
```bash
curl -s http://localhost:8000/api/v1/analytics/audit
```

---

### Endpoint: `GET /api/v1/analytics/health`
* **Use Case:** System checks itself (verifies database availability, cache nodes, and AI microservices) for structural status checking.
* **Success Response (`200 OK`):**
```json
{
  "status": "healthy",
  "components": {
    "database": "up",
    "redis": "up",
    "ai_core": "up"
  }
}
```

---

## 6. 🔮 Enterprise Demo Orchestration
Scenario controls designed specifically to orchestrate interactive simulations.

### Endpoint: `GET /api/v1/enterprise/rep/workload`
* **Use Case:** Returns active workloads and utilization indicators for the rep management dashboard grids.
* **Success Response (`200 OK`):**
```json
[
  {
    "name": "Sarah Jenkins",
    "assigned_leads": 12,
    "meetings_today": 3,
    "open_slots": 8,
    "conversion_rate": 25.5,
    "utilization": 79,
    "status": "Available"
  }
]
```

---

### Endpoint: `POST /api/v1/enterprise/simulation/run`
* **Use Case:** Triggers a specific demo scenario simulation (like pre-scheduling a VIP lead with high intent) to populate the live dashboard instantly.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "scenario": "hot-lead"
}
```
* **Success Response (`200 OK`):**
```json
{
  "status": "triggered",
  "scenario": "hot-lead"
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/enterprise/simulation/run \
  -H "Content-Type: application/json" \
  -d '{"scenario":"hot-lead"}'
```

---

## 7. 🗄️ Legacy Bookings Interface
Direct data integrations for backward compatibility and list processing.

### Endpoint: `POST /api/v1/legacy-bookings/`
* **Use Case:** Creates a new booking directly in the SQL database, bypassing AI discovery gates (used by bulk CSV tools and external API sources).
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "name": "Bob Harrison",
  "email": "bob@bobcorp.com",
  "company_name": "BobCorp",
  "meeting_title": "Product Demo: BobCorp",
  "booking_date": "2026-06-05",
  "booking_time": "11:30:00",
  "timezone": "IST"
}
```
* **Success Response (`200 OK`):**
```json
{
  "id": 38,
  "name": "Bob Harrison",
  "email": "bob@bobcorp.com",
  "company_name": "BobCorp",
  "meeting_title": "Product Demo: BobCorp",
  "booking_date": "2026-06-05",
  "booking_time": "11:30:00",
  "timezone": "IST",
  "status": "pending",
  "meeting_link": "http://localhost:5173/meeting.html?id=38&title=Product%20Demo%3A%20BobCorp",
  "email_preview": {
    "to": "bob@bobcorp.com",
    "subject": "✅ Confirmed: Product Demo: BobCorp",
    "body": "Hi Bob Harrison, your demo for BobCorp is confirmed..."
  }
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/legacy-bookings/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Harrison","email":"bob@bobcorp.com","company_name":"BobCorp","meeting_title":"Product Demo: BobCorp","booking_date":"2026-06-05","booking_time":"11:30:00","timezone":"IST"}'
```

---

### Endpoint: `POST /api/v1/legacy-bookings/{booking_id}/analyze`
* **Use Case:** Triggered autonomously by the post-meeting AI intelligence engine to append boardroom analysis summaries and pain-point notes into compliance records.
* **Headers:** `Content-Type: application/json`
* **Request Payload:**
```json
{
  "prospect_name": "Bob Harrison",
  "summary": "Prospect is looking to centralize 3 distinct scheduling tools.",
  "next_steps": "Send detailed integration schema document for review."
}
```
* **Success Response (`200 OK`):**
```json
{
  "status": "success",
  "message": "Meeting analysis logged to audit logs."
}
```
* **Testing Command:**
```bash
curl -X POST http://localhost:8000/api/v1/legacy-bookings/38/analyze \
  -H "Content-Type: application/json" \
  -d '{"prospect_name":"Bob Harrison","summary":"Prospect is looking to centralize 3 distinct scheduling tools.","next_steps":"Send integration schema."}'
```

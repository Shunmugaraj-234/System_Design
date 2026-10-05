# 🏗️ 02. High-Level System Architecture (HLD) & C4 Diagrams

## 1. High-Level Architecture (HLD)

STORMSHIELD decouples public traffic ingestion and protection from the underlying resource consistency engine and asynchronous downstream processing.

```mermaid
graph TB
    subgraph EdgeLayer["🌐 Edge & Ingestion Layer"]
        Client[Client Applications / Web / Mobile] -->|HTTPS| CDN[Cloudflare CDN / AWS CloudFront]
        CDN --> WAF[Web Application Firewall & Bot Shield]
        WAF --> ALB[Application Load Balancer]
    end

    subgraph GatewayLayer["🔑 API Gateway & Auth"]
        ALB --> Gateway[Kong API Gateway]
        Gateway --> AuthSvc[Identity & OAuth2/JWT Service]
    end

    subgraph ProtectionLayer["🛡️ STORMSHIELD PROTECTION LAYER"]
        Gateway --> RateLimiter[Distributed Rate Limiter - Token Bucket]
        RateLimiter --> AdmissionControl[Admission Controller - Fair Shedding]
        AdmissionControl --> WaitingRoom[Virtual Waiting Room - FIFO Redis Queue]
        WaitingRoom --> Deduplicator[Request Deduplication & Idempotency Manager]
    end

    subgraph CoreEngine["🔒 RESOURCE CONSISTENCY & ALLOCATION BOUNDARY"]
        Deduplicator --> AllocEngine[Atomic Resource Allocation Engine]
        AllocEngine <-->|Token Decoupling / Speed| RedisCluster[(Redis Cluster - Available Counters)]
        AllocEngine <-->|Atomic SQL Source of Truth| PostgreSQL[(PostgreSQL Primary - Row Lock / Conditional UPDATE)]
    end

    subgraph TransactionLayer["🔄 TRANSACTION & SAGA ENGINE"]
        AllocEngine --> SagaOrchestrator[Saga Transaction Manager]
        SagaOrchestrator <-->|Idempotent Charge| PaymentGateway[Payment Service / Gateway Adapters]
        SagaOrchestrator --> OutboxTable[(Transactional Outbox Table)]
    end

    subgraph AsyncBroker["📩 EVENT BROKER LAYER"]
        OutboxWorker[Transactional Outbox Relayer] -->|Poll / Dequeue| OutboxTable
        OutboxWorker -->|Exact-Once Publish| KafkaBroker[Apache Kafka Event Bus]
    end

    subgraph DownstreamServices["⚡ DOWNSTREAM BUSINESS SERVICES"]
        KafkaBroker -->|Topic: booking-events| BookingSvc[Booking / Order Service]
        KafkaBroker -->|Topic: fulfilment-events| FulfilmentSvc[Fulfilment Service]
        KafkaBroker -->|Topic: notification-events| NotificationSvc[Notification Service]
        KafkaBroker -->|Topic: analytics-events| AnalyticsSvc[Real-Time Analytics & Audit Log Engine]
    end

    subgraph RecoveryWorkers["🚑 SELF-HEALING & BACKGROUND WORKERS"]
        ExpiryWorker[Reservation Expiry Cron Worker] -->|Scan Expired TTL| PostgreSQL
        ReconciliationWorker[Payment Reconciliation Engine] -->|Sync Discrepancies| PaymentGateway
    end
```

---

## 2. C4 Architecture Diagrams

### 2.1 C4 Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram for STORMSHIELD
    Person(customer, "End User / Customer", "Competes for scarce resources (Flash sales, Concert seats, GPU slots).")
    Person(admin, "Resource Provider / Admin", "Configures resources, capacities, TTLs, and pricing rules.")

    System(stormshield, "STORMSHIELD Platform", "High-concurrency resource protection, atomic reservation, and failure recovery platform.")

    System_Ext(payment_gateways, "External Payment Gateways", "Stripe, Razorpay, UPI, PayPal for financial transactions.")
    System_Ext(notification_providers, "Notification Providers", "Twilio, SendGrid, Firebase Cloud Messaging for alerts.")

    Rel(customer, stormshield, "Reserves resources, makes payments, receives allocation confirmation", "HTTPS / REST / WSS")
    Rel(admin, stormshield, "Manages resource inventory, monitors system metrics and chaos tests", "HTTPS / Web UI")
    Rel(stormshield, payment_gateways, "Executes idempotent payment authorizations & capture", "HTTPS / REST")
    Rel(stormshield, notification_providers, "Triggers SMS, Email, and Push Notifications", "HTTPS / REST")
```

### 2.2 C4 Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram for STORMSHIELD Platform
    
    Container(cdn, "CDN & DDoS", "Cloudflare", "Edge caching, DDoS mitigation, static asset delivery.")
    Container(gateway, "API Gateway", "Kong / Envoy", "TLS termination, rate limiting, routing, JWT verification.")
    
    Container(prot_svc, "Protection Service", "Node.js / Go", "Admission control, token bucket, virtual waiting room queue.")
    Container(res_svc, "Resource Allocation Service", "Go / Java Spring", "Executes atomic allocation queries and manages Redis token counters.")
    Container(saga_svc, "Saga Transaction Service", "TypeScript / Go", "Orchestrates payment, allocation confirmation, and compensation.")
    Container(expiry_worker, "Expiry Worker", "Go / Rust", "Scans and releases expired reservation TTLs every second.")
    
    ContainerDb(redis, "Redis Cluster", "Redis 7.x", "Rate limits, active session tokens, waiting queue state.")
    ContainerDb(postgres, "Primary Database", "PostgreSQL 16", "ACID source of truth for resources, reservations, outbox, and audit logs.")
    Container(kafka, "Message Broker", "Apache Kafka", "Asynchronous event stream backbone for downstream services.")
    
    Rel(cdn, gateway, "Routes API requests", "HTTPS")
    Rel(gateway, prot_svc, "Sends traffic", "gRPC")
    Rel(prot_svc, redis, "Verifies tokens & queue position", "RESP")
    Rel(prot_svc, res_svc, "Admits verified request", "gRPC")
    Rel(res_svc, postgres, "Executes atomic conditional update", "SQL / TCP")
    Rel(res_svc, saga_svc, "Triggers transaction saga", "gRPC")
    Rel(saga_svc, postgres, "Writes outbox event", "SQL")
    Rel(expiry_worker, postgres, "Reclaims expired capacity", "SQL")
```

---

## 3. STORMSHIELD Protection Layer Details

The core differentiator of STORMSHIELD is: **"Protect the scarce resource before protecting the rest of the system."**

Instead of allowing 500,000 requests to hit the database layer directly, traffic passes through 12 protection gates:

1. **Distributed Rate Limiter:** Token Bucket algorithm implemented in Redis Lua scripts to enforce client/IP rate limits.
2. **Admission Controller:** Evaluates current database queue depth and sheds excess traffic before entering database threads.
3. **Virtual Waiting Room:** Organizes admitted traffic into a deterministic FIFO Redis ZSET queue when demand exceeds processing rate.
4. **Request Deduplicator:** Rejects duplicate incoming payloads based on `SHA-256(payload + user_id)`.
5. **Idempotency Manager:** Ensures requests with the same `Idempotency-Key` header return cached responses without re-executing logic.
6. **Resource Contention Controller:** Shards hot-key resources across internal partition keys to minimize row lock contention.
7. **Reservation Manager:** Allocates temporary locks on resource units linked to customer IDs.
8. **Reservation Expiry Manager:** Background ticker that asynchronously frees abandoned reservations.
9. **Backpressure Controller:** Signals upstream API Gateway to return `HTTP 429 Too Many Requests` or `HTTP 503 Retry-After` when queue thresholds are breached.
10. **Priority/Fairness Manager:** Supports VIP tiers, emergency priority, or FIFO fairness without causing lower-tier starvation.
11. **Circuit Breaker:** Wraps external dependencies (Payment Gateways, SMS) to fail fast when error rates exceed $50\%$.
12. **Retry Controller:** Implements exponential backoff with random jitter to prevent retry thundering herds.

---

## 4. Service Boundaries & Responsibilities

| Service Name | Primary Responsibility | Data Store Owned | Communication Pattern |
|---|---|---|---|
| **Identity Service** | User authentication, OAuth2 token issuance, RBAC enforcement. | Auth DB (Users, Roles) | Synchronous REST / JWT |
| **STORMSHIELD Protection Service** | Rate limiting, admission control, token bucket, waiting room. | Redis Cluster (Tokens, Queues) | gRPC / High Speed |
| **Resource Allocation Service** | Atomic resource availability check, temporary locking, capacity updates. | PostgreSQL Primary (Resources, Capacities) | Synchronous gRPC / SQL |
| **Reservation Service** | Manages reservation lifecycles, TTL timestamps, and expiry releases. | PostgreSQL (Reservations Table) | Synchronous SQL + Async Cron |
| **Transaction Service (Saga)** | Orchestrates multi-step allocation, payment execution, and rollback compensations. | PostgreSQL (Saga State, Outbox) | Asynchronous Saga Events |
| **Payment Service** | Abstracts external payment gateways (Card, UPI, Wallet) with circuit breakers. | Payment DB (Attempts, Logs) | REST Gateway APIs |
| **Fulfilment Service** | Processes post-payment resource delivery (Ticket issuance, GPU provisioning). | Fulfilment DB | Async Kafka Consumer |
| **Notification Service** | Sends SMS, Email, and Push alerts asynchronously. | No state (Stateless) | Async Kafka Consumer |
| **Reconciliation Service** | Scans for orphan payments, zombie reservations, and outbox lags. | Read Replicas / Audit Logs | Scheduled Background Jobs |

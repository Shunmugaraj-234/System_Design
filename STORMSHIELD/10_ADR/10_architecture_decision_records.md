# 📑 10. Architecture Decision Records (ADRs)

This document contains 12 Architecture Decision Records (ADR-001 to ADR-012) governing STORMSHIELD's system architecture.

---

### ADR-001: Resource Consistency Strategy
- **Context:** Under high concurrency (100,000 req/sec competing for 100 items), traditional `SELECT` then `UPDATE` causes overselling and race conditions.
- **Decision:** Use **Atomic Conditional Database Updates** (`UPDATE resource_capacity SET available = available - req WHERE available >= req`).
- **Reason:** Leverages PostgreSQL's native row lock and transaction engine. Eliminates oversubscription with minimal lock duration ($< 2\text{ms}$).
- **Trade-offs:** High write contention on single hot-key rows, mitigated by Protection Layer admission control.

---

### ADR-002: Primary Relational Source of Truth
- **Context:** STORMSHIELD requires strict ACID guarantees for resource capacities and financial transaction logs.
- **Decision:** Select **PostgreSQL 16** (with CockroachDB / YugabyteDB as distributed SQL scaling options).
- **Reason:** Standard PostgreSQL provides rock-solid transaction isolation, check constraints, `SKIP LOCKED` batching, and JSONB auditing.
- **Trade-offs:** Horizontal write sharding requires partition key planning.

---

### ADR-003: Caching Acceleration Layer
- **Context:** Need sub-millisecond rate limiting, admission control token buckets, and active session caching.
- **Decision:** Deploy **Redis Cluster 7.x** with Lua scripts.
- **Reason:** Lua scripts execute atomically in-memory, handling up to 100,000 ops/sec per node for rate limiting and queue positioning.
- **Trade-offs:** Redis is in-memory; PostgreSQL remains the ultimate persistent source of truth.

---

### ADR-004: Message Broker for Asynchronous Events
- **Context:** Downstream services (Fulfilment, Notification, Analytics) require high-throughput event streaming.
- **Decision:** Use **Apache Kafka**.
- **Reason:** Partitioned immutable log format allows independent consumer offsets, replayability, and strict ordering by `resource_id`.
- **Trade-offs:** Higher deployment operational overhead compared to RabbitMQ.

---

### ADR-005: Idempotency Key Architecture
- **Context:** Network retries or double-clicks can submit identical requests multiple times.
- **Decision:** Mandate `Idempotency-Key` headers on all mutating POST requests, stored in a dedicated `idempotency_record` table.
- **Reason:** Guarantees single-execution semantics across network failures.
- **Trade-offs:** Requires checking/storing idempotency records on every request.

---

### ADR-006: Reservation TTL Expiry Mechanism
- **Context:** Abandoned reservations lock capacity indefinitely if users close their browsers.
- **Decision:** Deploy an asynchronous background worker polling `WHERE status = 'RESERVED' AND expires_at <= NOW() LIMIT 100 FOR UPDATE SKIP LOCKED`.
- **Reason:** `SKIP LOCKED` allows multiple worker instances to process distinct expired batches without locking each other.
- **Trade-offs:** Minor polling latency ($< 1\text{s}$) between expiration time and capacity release.

---

### ADR-007: Payment Reliability & Isolation
- **Context:** External payment gateways fail, timeout, or experience elevated latency during traffic spikes.
- **Decision:** Wrap payment provider adapters with a **Circuit Breaker** and implement explicit strategy interfaces.
- **Reason:** Fails fast when gateways drop, protecting internal worker threads.
- **Trade-offs:** Requires manual or automated fallback routing to secondary gateways.

---

### ADR-008: Atomic Event Publication via Outbox Pattern
- **Context:** Dual writes (updating PostgreSQL and publishing to Kafka) can fail partially if Kafka is unreachable.
- **Decision:** Implement the **Transactional Outbox Pattern**.
- **Reason:** Outbox records are committed in the same local ACID transaction as resource allocation, guaranteeing zero lost events.
- **Trade-offs:** Requires an asynchronous outbox relayer process.

---

### ADR-009: Distributed Transaction Architecture
- **Context:** Distributed transactions across microservices cannot use 2PC locks under high concurrency.
- **Decision:** Adopt **Orchestration-Based Saga Pattern**.
- **Reason:** Uses local transactions with explicit compensating steps (e.g., release capacity if payment fails) to achieve eventual consistency safely.
- **Trade-offs:** Compensating logic must be written and tested for every workflow step.

---

### ADR-010: Traffic Protection & Admission Control
- **Context:** Direct database attacks by 500,000 requests/sec will collapse connection pools.
- **Decision:** Build a dedicated **STORMSHIELD Protection Layer** with token bucket admission control and virtual waiting rooms.
- **Reason:** Protects the scarce resource consistency boundary by shedding load at the edge before it reaches database threads.
- **Trade-offs:** Rejects excess traffic early, requiring clear UX messaging for shed users.

---

### ADR-011: Horizontal Scaling Strategy
- **Context:** Need to handle variable high-demand events.
- **Decision:** Keep API Gateway, Protection Layer, and Saga Worker services completely **stateless**, auto-scaling horizontally via Kubernetes HPA.
- **Reason:** Allows computing nodes to scale dynamically based on CPU/Queue depth without session affinity issues.
- **Trade-offs:** Increases container orchestration management requirements.

---

### ADR-012: PCI-DSS Compliant Security Model
- **Context:** System processes payment transactions for resource reservations.
- **Decision:** Use **Tokenized Third-Party SDKs** and short-lived JWT bearer tokens.
- **Reason:** Prevents STORMSHIELD servers from touching raw credit card credentials, fulfilling PCI-DSS SAQ-A scope reduction.
- **Trade-offs:** Relies on third-party SDK availability on client devices.

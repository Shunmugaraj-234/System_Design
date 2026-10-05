# 📄 01. Requirements & Generalized Industry Problem Specification

## 1. Executive Summary

**STORMSHIELD** is an industry-grade, generalized High-Concurrency Resource Protection, Reservation, Transaction, and Recovery Platform. It solves the core distributed-systems challenge of preserving absolute resource consistency under extreme concurrent demand without sacrificing horizontal scalability, fault tolerance, or transaction correctness.

System design hackathons frequently focus on specific consumer applications (e.g., e-commerce flash sales). STORMSHIELD redefines this paradigm by abstracting the core problem into a generalized resource protection engine. By isolating the **Resource Consistency Boundary** from industry-specific business rules, STORMSHIELD guarantees **ZERO OVERSUBSCRIPTION**, **IDEMPOTENT TRANSACTIONS**, and **SELF-HEALING FAILURE RECOVERY** across 20+ distinct industry verticals.

---

## 2. Problem Statement

Under high concurrency (e.g., 500,000 requests/sec competing for 100 available items):
1. **Database Contention:** Direct database updates lead to lock contention, connection pool exhaustion, transaction deadlocks, and cascading system failure.
2. **Overselling / Double-Booking:** Race conditions between checking availability (`SELECT`) and updating capacity (`UPDATE`) lead to negative inventory or double allocation.
3. **Ghost Reservations:** Users reserve items but abandon the checkout flow, locking scarce capacity indefinitely unless automatically reclaimed.
4. **Duplicate Payments & Orders:** Network retries, timeouts, or client-side double-clicks trigger duplicate transactions or charges.
5. **Partial Failures:** In distributed architectures, database writes may succeed while event publishing or downstream fulfilment fails, leaving the system in an inconsistent state.

---

## 3. Why STORMSHIELD Is Bigger Than E-Commerce

E-commerce flash sales are merely one instance of a universal distributed resource competition pattern. STORMSHIELD abstracts the domain models into:

- `RESOURCE`: The scarce asset (Item, Seat, Slot, Bed, GPU, Vehicle).
- `RESOURCE_CAPACITY`: Total, available, reserved, and allocated counts.
- `RESOURCE_RESERVATION`: Temporary hold on capacity linked to a TTL.
- `TRANSACTION`: Business allocation workflow (Booking, Purchase, Grant).
- `HIGH-DEMAND EVENT`: High-concurrency access campaign.

### 20 Multi-Industry Use Cases Supported by STORMSHIELD Core:

| # | Industry Vertical | Resource Type (`RESOURCE_TYPE`) | Unit of Scarcity | Concurrency Scenario |
|---|---|---|---|---|
| 1 | E-Commerce | `PRODUCT` | SKU Stock | Flash sale (100K users for 50 GPUs) |
| 2 | Concerts / Events | `SEAT` | Venue Seat ID | Stadium tour ticket drop |
| 3 | Airlines | `AIRLINE_SEAT` | Seat Class / Row | Holiday flight release |
| 4 | Hospitality | `HOTEL_ROOM` | Room Category / Date | Peak season room allocation |
| 5 | Transit | `BUS_TRAIN_SEAT` | Coach / Seat Number | Festival travel booking |
| 6 | Urban Parking | `PARKING_SLOT` | Space / Garage ID | Airport / Downtown peak parking |
| 7 | EV Charging | `EV_CHARGER` | Charging Station Plug | Highway fast-charger slots |
| 8 | Healthcare | `HOSPITAL_BED` | ICU / Specialist Slot | Emergency pandemic allocation |
| 9 | Cloud Computing | `CLOUD_INSTANCE` | vCPU / RAM Node | Batch compute cluster deployment |
| 10 | AI Infrastructure | `GPU_SLOT` | Nvidia H100 GPU Hour | LLM fine-tuning job allocation |
| 11 | Food Delivery | `DELIVERY_SLOT` | Driver / Time Window | Super Bowl delivery slots |
| 12 | Logistics | `WAREHOUSE_CAPACITY` | Pallet / Cargo Volume | Black Friday shipping intake |
| 13 | Warehousing | `INVENTORY_SLOT` | Storage Location | Import container storage |
| 14 | Sports Facilities | `STADIUM_SEAT` | VIP Box / Pass | Championship final ticketing |
| 15 | Emergency Ops | `DISASTER_RESOURCE` | Generator / Med Kit | Disaster relief supply distribution |
| 16 | Shared Equipment | `EQUIPMENT` | Industrial Tool / Crane | Construction site scheduling |
| 17 | Mobility / Rental | `RENTAL_VEHICLE` | Car / Scooter VIN | Holiday rental fleet booking |
| 18 | Fintech & Rewards | `DIGITAL_COUPON` | Reward Token | Bank promotional cash-back claim |
| 19 | Education / Civic | `REGISTRATION_SLOT` | Course / Permit ID | University course enrollment |
| 20 | Gaming & Esports | `MATCH_SERVER` | Game Server Node | Tournament lobby allocation |

---

## 4. Functional Requirements (FR)

- **FR-1: Resource Management & Multi-Tenancy:** The platform must allow providers to register resources with total capacity, reservation TTL, pricing rules, and industry metadata.
- **FR-2: High-Concurrency Reservation Engine:** System must accept reservation requests and perform atomic allocation checks.
- **FR-3: Zero Oversubscription Guarantee:** Allocated + Reserved capacity must NEVER exceed Total Capacity ($\text{Available} \ge 0$).
- **FR-4: Temporary Reservation with TTL Expiry:** Successful reservations must grant a temporary lock (e.g., 5 minutes). If unconfirmed within TTL, resources must be automatically released back to available capacity.
- **FR-5: Strict Idempotency:** Every reservation, payment, and transaction API call MUST accept an `Idempotency-Key` and enforce single-execution behavior.
- **FR-6: Admission Control & Traffic Protection:** Extreme traffic spikes must pass through a token bucket admission controller and virtual waiting room to prevent database collapse.
- **FR-7: Pluggable Payment Abstraction:** Payment operations must support multiple providers (UPI, Card, Wallet, Bank Transfer) using standard strategy patterns with retry and reconciliation mechanisms.
- **FR-8: Saga-Based Transaction Management:** Distributed workflows across Reservation, Payment, and Fulfilment must follow Saga orchestration with compensation logic.
- **FR-9: Transactional Outbox Pattern:** All domain events must be saved atomically in an Outbox database table before asynchronous publication to Apache Kafka.
- **FR-10: Automated Failure Recovery & Reconciliation:** Background workers must scan for abandoned transactions, payment timeouts, and unacknowledged messages to restore state consistency.
- **FR-11: Audit Trail:** All state transitions (`AVAILABLE` $\to$ `RESERVED` $\to$ `CONFIRMED` $\to$ `FULFILLED`) must generate immutable, queryable audit log entries with `trace_id`.
- **FR-12: Multi-Industry Adapter Layer:** System must expose clean API contracts for industry adapters without changing core reservation algorithms.
- **FR-13: Real-Time Observability & Dashboard:** Provide real-time UI monitoring for system throughput, queue latency, circuit breaker status, and capacity gauges.
- **FR-14: Integrated Chaos Engineering:** Include a built-in chaos engine to simulate node crashes, network latency, payment timeouts, and traffic surges.
- **FR-15: Dead-Letter Queue (DLQ) Management:** Failed events after max retries must be routed to DLQ for operator inspection and re-injection.

---

## 5. Non-Functional Requirements (NFR)

- **NFR-1: Consistency (ACID at Boundary):** Strong consistency at the resource allocation boundary; eventual consistency for downstream reporting, analytics, and notifications.
- **NFR-2: Throughput:** Normal operation: 10,000 req/sec; Peak flash event: up to 500,000 req/sec at Edge/Admission layer.
- **NFR-3: Latency:** P50 Latency $< 15\text{ms}$, P95 Latency $< 50\text{ms}$, P99 Latency $< 120\text{ms}$ for reservation attempts.
- **NFR-4: High Availability:** $99.99\%$ uptime for reservation services using multi-AZ deployment and active-passive DB failover.
- **NFR-5: Scalability:** Stateless application nodes horizontally auto-scale based on CPU/Queue length metrics.
- **NFR-6: Fault Tolerance:** System must remain operational even if non-critical services (Analytics, Notifications) crash (Bulkhead pattern).
- **NFR-7: Idempotency Retention:** Idempotency keys must be persisted for a minimum of 24 hours.
- **NFR-8: Security & Compliance:** OAuth2/JWT authentication, TLS 1.3 encryption in transit, AES-256 at rest, strict RBAC, no raw cardholder data storage (PCI-DSS compliance).
- **NFR-9: Auditability:** Full trace history with OpenTelemetry `trace_id` propagated across HTTP, gRPC, and Kafka headers.
- **NFR-10: Recovery Time Objective (RTO):** RTO $< 30$ seconds for failed service instances.
- **NFR-11: Recovery Point Objective (RPO):** RPO $= 0$ for resource allocation state.

---

## 6. System Assumptions & Boundary Conditions

1. Clock Synchronization: Server nodes synchronize time via NTP with a drift bounded within $< 5\text{ms}$.
2. External Payment Providers: External payment gateways may experience up to 5% failure rates or timeouts during peak events.
3. Network Flakiness: Network retries are expected; client applications MUST send `Idempotency-Key` headers on all mutating POST requests.

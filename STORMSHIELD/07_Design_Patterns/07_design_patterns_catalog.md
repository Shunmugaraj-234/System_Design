# 🎨 07. Design Patterns Catalog

STORMSHIELD leverages 12 enterprise design patterns to guarantee concurrency control, fault tolerance, and multi-industry modularity.

---

## Pattern 1: Strategy Pattern
- **Problem:** Different payment mechanisms (UPI, Card, Wallet, Bank Wire) require distinct processing algorithms and payload formats.
- **Solution:** Encapsulate each payment gateway algorithm inside a separate class implementing `IPaymentProvider`.
- **Where Used:** Payment Service (`UPIPaymentProvider`, `CardPaymentProvider`, `WalletPaymentProvider`).
- **Why Selected:** Decouples payment execution from payment invocation; allows adding new gateways at runtime.
- **Trade-off:** Increases class count slightly.

---

## Pattern 2: Factory Pattern
- **Problem:** Dynamic instantiation of payment or industry adapters based on request configuration.
- **Solution:** `PaymentFactory` instantiates the appropriate `IPaymentProvider` based on `payment_method` parameter.
- **Where Used:** Payment Gateway Initialization.
- **Why Selected:** Eliminates long `switch-case` statements across business logic.
- **Trade-off:** Centralizes factory configuration.

---

## Pattern 3: State Pattern
- **Problem:** Reservations and transactions transition through complex lifecycles with strict valid state transitions.
- **Solution:** Represent state machine states (`AVAILABLE`, `RESERVED`, `CONFIRMED`, `RELEASED`, `EXPIRED`) as explicit objects or state transition maps.
- **Where Used:** Reservation & Saga Transaction Managers.
- **Why Selected:** Prevents illegal state transitions (e.g., transitioning an `EXPIRED` reservation to `CONFIRMED`).
- **Trade-off:** Requires state validation overhead on every update.

---

## Pattern 4: Observer Pattern (Event-Driven)
- **Problem:** High-concurrency operations should not synchronously block waiting for secondary operations (analytics, SMS alerts, accounting).
- **Solution:** Publish domain events (`ReservationCreated`, `PaymentSucceeded`) to Kafka; downstream consumers subscribe independently.
- **Where Used:** Kafka Messaging Pipeline & Downstream Services.
- **Why Selected:** Dramatically reduces API response latency and decouples downstream modules.
- **Trade-off:** Introduces eventual consistency for observer actions.

---

## Pattern 5: Adapter Pattern
- **Problem:** Multi-industry clients (Ticketing, Cloud GPUs, Healthcare) have industry-specific data schemas that must interface with STORMSHIELD core.
- **Solution:** Create industry adapters (`ECommerceAdapter`, `TicketingAdapter`, `CloudAdapter`) that translate industry requests into standard `AllocationRequest` models.
- **Where Used:** Multi-Industry API Adapter Layer.
- **Why Selected:** Protects STORMSHIELD core from domain pollution.
- **Trade-off:** Requires translation layer mapping.

---

## Pattern 6: Repository Pattern
- **Problem:** Business domain logic should not be tightly coupled to direct SQL queries or database ORMs.
- **Solution:** Expose clean repository interfaces (`IResourceRepository`, `IReservationRepository`) concealing database operations.
- **Where Used:** All Persistence Layers.
- **Why Selected:** Allows switching database implementations (PostgreSQL, Distributed SQL, Redis) without altering business logic.
- **Trade-off:** Abstraction wrapper layer.

---

## Pattern 7: Facade Pattern
- **Problem:** Clients face complex microservice interactions (admission control, reservation, payment, confirmation).
- **Solution:** Provide a simplified API Facade endpoint (`POST /api/v1/checkout`) orchestrating underlying calls cleanly.
- **Where Used:** API Gateway & Protection Layer.
- **Why Selected:** Simplifies client integration and hides internal architecture.
- **Trade-off:** Facade could become a bloated orchestrator if not kept thin.

---

## Pattern 8: Circuit Breaker Pattern
- **Problem:** External payment gateways or downstream APIs may slow down or fail during peak traffic, causing thread pool exhaustion.
- **Solution:** Monitor failure rates; when failures exceed 50%, trip circuit breaker into `OPEN` state to fail fast instantly for a cooldown period.
- **Where Used:** Payment Gateway Adapters & Notification External APIs.
- **Why Selected:** Prevents cascading system failures and protects worker threads.
- **Trade-off:** Requires tuning trip thresholds and half-open check windows.

---

## Pattern 9: Transactional Outbox Pattern
- **Problem:** Dual-writes (updating database AND sending event to Kafka) suffer from partial failure (DB updates, but Kafka call drops).
- **Solution:** Save event payload in a database `event_outbox` table within the SAME local ACID transaction, then relay to Kafka asynchronously.
- **Where Used:** Saga Transaction Service & Resource Allocation Engine.
- **Why Selected:** Guarantees 100% atomic event persistence without distributed 2PC locks.
- **Trade-off:** Adds background polling/CDC overhead.

---

## Pattern 10: Saga Pattern (Orchestration-Based)
- **Problem:** Distributed transactions across microservices cannot use 2PC locks under high concurrency.
- **Solution:** Orchestrate multi-step execution (Reserve $\to$ Pay $\to$ Confirm); if payment fails, execute compensating transactions (Release Capacity).
- **Where Used:** Multi-Service Transaction Workflow.
- **Why Selected:** Maintains eventual consistency across distributed service boundaries safely.
- **Trade-off:** Requires explicit compensating logic for every step.

---

## Pattern 11: Bulkhead Pattern
- **Problem:** A failure or thread starvation in the Notification service should not degrade Resource Allocation throughput.
- **Solution:** Isolate memory pools, database connection pools, and thread execution pools for each service domain.
- **Where Used:** Microservice Container Deployment & DB Connection Pools.
- **Why Selected:** Ensures critical reservation traffic continues uninterrupted even if non-critical services crash.
- **Trade-off:** Higher static resource allocation across pools.

---

## Pattern 12: Retry Pattern with Exponential Backoff & Jitter
- **Problem:** Immediate fixed-interval retries under high concurrency create thundering herds that overwhelm recovering databases.
- **Solution:** Retry failed operations with exponentially increasing delays plus random microsecond jitter.
- **Where Used:** Database connection retries & Kafka Consumer retries.
- **Why Selected:** Prevents synchronized retry spikes and smooths out traffic recovery.
- **Trade-off:** Extends tail latency for retried operations.

# 🏛️ 06. SOLID Principles Mapping & Implementation

STORMSHIELD adheres strictly to SOLID design principles to ensure maintainability, testability, and multi-industry extensibility.

---

## 1. Single Responsibility Principle (SRP)

> **Definition:** A class should have one, and only one, reason to change.

### STORMSHIELD Violation Prevention:
Instead of creating a monolithic `OrderService` that manages inventory checks, SQL queries, payment API calls, email sending, and log formatting, STORMSHIELD splits responsibilities into decoupled single-purpose classes:

| Class Name | Single Responsibility |
|---|---|
| `PostgresAtomicAllocator` | ONLY handles atomic database capacity increments/decrements. |
| `ReservationExpiryWorker` | ONLY sweeps expired reservation TTLs and returns capacity. |
| `PaymentGatewayAdapter` | ONLY transforms internal payment requests to external API schemas. |
| `IdempotencyStore` | ONLY manages key-value lookup and storage of API response hashes. |
| `OutboxEventRelayer` | ONLY polls pending outbox records and publishes them to Kafka. |

---

## 2. Open-Closed Principle (OCP)

> **Definition:** Software entities should be open for extension, but closed for modification.

### STORMSHIELD Implementation:
The core reservation engine does not know about specific industry domain rules or payment gateway providers. Adding a new payment provider (e.g., Apple Pay) or a new resource type (e.g., EV Charger) requires **ZERO modifications** to core allocation code.

```typescript
// Core interface closed for modification
export interface IPaymentProvider {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
}

// Open for extension: Adding a new payment provider without altering existing providers
export class ApplePayPaymentProvider implements IPaymentProvider {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Apple Pay specific integration logic
    return { success: true, transactionReference: 'apple-pay-ref' };
  }
}
```

---

## 3. Liskov Substitution Principle (LSP)

> **Definition:** Subtypes must be substitutable for their base types without altering system correctness.

### STORMSHIELD Implementation:
All implementations of `IResourceAllocator` (e.g., `PostgresAtomicAllocator`, `RedisDecoupledAllocator`, `DistributedLockAllocator`) satisfy the identical contract and invariants. Swapping `PostgresAtomicAllocator` with `RedisDecoupledAllocator` in unit tests or high-speed cache tiers preserves all guarantees.

```typescript
function executeAllocation(allocator: IResourceAllocator, req: AllocationRequest) {
  // Works identically regardless of concrete allocation mechanism passed
  return allocator.allocate(req);
}
```

---

## 4. Interface Segregation Principle (ISP)

> **Definition:** Clients should not be forced to depend upon interfaces that they do not use.

### STORMSHIELD Implementation:
Instead of creating a giant `IResourceManager` containing 30 methods (`allocate`, `release`, `chargePayment`, `sendSMS`, `generateInvoice`), STORMSHIELD breaks interfaces into small, cohesive contracts:

```typescript
export interface ICapacityReader {
  getAvailableCapacity(resourceId: string): Promise<number>;
}

export interface ICapacityWriter {
  allocate(resourceId: string, qty: number): Promise<boolean>;
  release(resourceId: string, qty: number): Promise<boolean>;
}

export interface IExpiryManager {
  expireStaleReservations(): Promise<number>;
}
```

---

## 5. Dependency Inversion Principle (DIP)

> **Definition:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

### STORMSHIELD Implementation:
High-level business domain services (`ReservationService`, `TransactionSagaManager`) depend on abstract interfaces (`IResourceRepository`, `IPaymentProvider`, `IEventPublisher`), NEVER on concrete classes (`PostgreSQLDriver`, `StripeSDK`, `KafkaProducer`).

```typescript
export class ReservationService {
  // Depends on abstractions via Constructor Dependency Injection
  constructor(
    private allocator: IResourceAllocator,
    private idempotency: IIdempotencyService,
    private publisher: IEventPublisher
  ) {}

  async processRequest(req: AllocationRequest) {
    // High-level business flow orchestration
  }
}
```

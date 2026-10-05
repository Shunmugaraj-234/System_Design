# 🔌 05. REST API & Event Specifications

## 1. REST API Endpoints Specification

All mutating endpoints (`POST`, `PUT`, `DELETE`) **MUST** require the `Idempotency-Key` header.

### 1.1 Resource Management Endpoint

#### `GET /api/v1/resources/:id`
Retrieves current resource details and real-time available capacity.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "title": "Nvidia H100 GPU Hour Slot",
  "resource_type": "GPU_SLOT",
  "status": "ACTIVE",
  "capacity": {
    "total": 100,
    "available": 42,
    "reserved": 18,
    "allocated": 40,
    "version": 154
  },
  "created_at": "2026-10-05T10:00:00Z"
}
```

---

### 1.2 Reservation Endpoint

#### `POST /api/v1/reservations`
Creates a temporary resource reservation lock.

- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
  - `Idempotency-Key: 7f9a8b1c-3d2e-4f5a-6b7c-8d9e0f1a2b3c`
  - `X-Trace-ID: tr-992384-8812`
- **Request Payload:**
```json
{
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "quantity": 2,
  "ttl_seconds": 300
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "reservation_id": "res-112233-445566",
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "quantity": 2,
  "status": "RESERVED",
  "expires_at": "2026-10-05T12:05:00Z",
  "idempotency_key": "7f9a8b1c-3d2e-4f5a-6b7c-8d9e0f1a2b3c"
}
```
- **Response `409 Conflict` (Insufficient Capacity):**
```json
{
  "success": false,
  "error_code": "INSUFFICIENT_CAPACITY",
  "message": "Requested quantity exceeds available capacity",
  "available_capacity": 0
}
```

---

### 1.3 Transaction Confirmation Endpoint

#### `POST /api/v1/transactions`
Confirms a pending reservation and initiates Saga payment execution.

- **Headers:**
  - `Idempotency-Key: tx-idem-8839210-990`
- **Request Payload:**
```json
{
  "reservation_id": "res-112233-445566",
  "payment_method": "UPI",
  "payment_details": {
    "upi_id": "user@okaxis"
  },
  "amount": 250.00
}
```
- **Response `202 Accepted`:**
```json
{
  "success": true,
  "transaction_id": "tx-9900-1122-33",
  "status": "PROCESSING",
  "saga_id": "saga-7722-1100"
}
```

---

## 2. Apache Kafka Event Specifications

STORMSHIELD uses Apache Kafka as its immutable event bus. Every event payload includes `trace_id` for distributed tracing and `schema_version`.

### 2.1 Event: `ReservationCreated`
- **Topic:** `stormshield.reservations`
- **Partition Key:** `resource_id` (Ensures strict ordering per resource)
- **Producer:** Resource Allocation Service
- **Consumers:** Notification Service, Analytics Engine

```json
{
  "event_id": "evt-88123-ab",
  "event_type": "ReservationCreated",
  "schema_version": "1.0",
  "trace_id": "tr-992384-8812",
  "timestamp": "2026-10-05T12:00:00Z",
  "payload": {
    "reservation_id": "res-112233-445566",
    "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
    "customer_id": "cust-554433",
    "quantity": 2,
    "expires_at": "2026-10-05T12:05:00Z"
  }
}
```

---

### 2.2 Event: `ReservationExpired`
- **Topic:** `stormshield.reservations`
- **Partition Key:** `resource_id`
- **Producer:** Expiry Background Worker
- **Consumers:** Analytics, Inventory Cache Syncer

```json
{
  "event_id": "evt-88124-cd",
  "event_type": "ReservationExpired",
  "schema_version": "1.0",
  "trace_id": "tr-sys-expiry-99",
  "timestamp": "2026-10-05T12:05:01Z",
  "payload": {
    "reservation_id": "res-112233-445566",
    "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
    "quantity": 2,
    "reason": "TTL_TIMEOUT"
  }
}
```

---

### 2.3 Event: `PaymentSucceeded`
- **Topic:** `stormshield.payments`
- **Partition Key:** `transaction_id`
- **Producer:** Payment Service
- **Consumers:** Saga Transaction Manager, Booking Service

```json
{
  "event_id": "evt-88125-ef",
  "event_type": "PaymentSucceeded",
  "schema_version": "1.0",
  "trace_id": "tr-992384-8812",
  "timestamp": "2026-10-05T12:01:30Z",
  "payload": {
    "payment_id": "pay-334455",
    "transaction_id": "tx-9900-1122-33",
    "amount": 250.00,
    "provider_reference": "upi-ref-998811"
  }
}
```

---

### 2.4 Event: `ReconciliationRequired`
- **Topic:** `stormshield.reconciliation`
- **Partition Key:** `transaction_id`
- **Producer:** Outbox Worker / Saga Manager
- **Consumers:** Reconciliation Engine, Operator Alert Console

```json
{
  "event_id": "evt-88126-gh",
  "event_type": "ReconciliationRequired",
  "schema_version": "1.0",
  "trace_id": "tr-recon-776",
  "timestamp": "2026-10-05T12:06:00Z",
  "payload": {
    "transaction_id": "tx-9900-1122-33",
    "reservation_id": "res-112233-445566",
    "issue": "PAYMENT_SUCCESS_WITHOUT_FULFILMENT_CONFIRMATION",
    "amount": 250.00
  }
}
```

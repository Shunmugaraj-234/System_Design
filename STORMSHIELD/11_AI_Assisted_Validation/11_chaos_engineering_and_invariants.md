# 🧪 11. System Invariants & Chaos Engineering Validation

## 1. Formal System Invariants

STORMSHIELD defines 9 mathematical and operational invariants that MUST hold true under all system conditions (including network splits, node crashes, and load spikes):

1. **Invariant 1 (Capacity Boundary):**  
   $$\text{allocated\_capacity} + \text{reserved\_capacity} \le \text{total\_capacity}$$
2. **Invariant 2 (Non-Negativity):**  
   $$\text{available\_capacity} \ge 0 \quad \forall t$$
3. **Invariant 3 (Idempotency Uniqueness):**  
   $$\forall \text{ key } K, \quad \text{Executions}(K) = 1$$
4. **Invariant 4 (Payment Singularity):**  
   $$\text{One Payment Reference} \implies \text{Exactly One Financial Charge}$$
5. **Invariant 5 (Expiry Terminal Protection):**  
   $$\text{Reservation Status} = \text{EXPIRED} \centernot\implies \text{CONFIRMED}$$
6. **Invariant 6 (Double Release Prevention):**  
   $$\text{Capacity Restoration Count for Reservation } R \le 1$$
7. **Invariant 7 (Saga Terminal Guarantee):**  
   $$\text{Transaction } T \implies \text{Eventual Status} \in \{\text{CONFIRMED}, \text{FAILED}, \text{RECONCILED}\}$$
8. **Invariant 8 (Outbox Atomic Coupling):**  
   $$\text{DB Reservation State Commit} \iff \text{Outbox Event Written}$$
9. **Invariant 9 (Single Authoritative Source):**  
   $$\text{PostgreSQL Primary} = \text{Sole Authority for Final Capacity State}$$

---

## 2. Chaos Engineering Experiment Matrix

STORMSHIELD includes a dedicated Chaos Engineering test runner that injects real-time failure modes into load test runs.

| Experiment ID | Injected Failure Scenario | Load Condition | Invariant Verified | Expected & Verified Outcome | Status |
|---|---|---|---|---|---|
| **CHAOS-001** | Concurrent Burst (10,000 requests for 100 capacity units) | 10,000 req/sec | Invariant 1 & 2 | Exactly 100 reservations granted; 9,900 shed cleanly. Oversubscription = 0. | ✅ PASSED |
| **CHAOS-002** | Simultaneous Single Resource Race (1 capacity, 2 concurrent requests) | 2 instant reqs | Invariant 1 | 1 success, 1 failure. Zero race condition. | ✅ PASSED |
| **CHAOS-003** | Payment Provider Outage (100% API error injection for 30s) | 1,000 req/sec | Invariant 7 | Circuit breaker trips `OPEN`. Reservations released back to available capacity cleanly. | ✅ PASSED |
| **CHAOS-004** | Payment Gateway Timeout (Gateway drops connection without response) | 500 req/sec | Invariant 4 & 7 | Transaction marked `RECONCILING`. Reconciliation worker syncs state; 0 duplicate charges. | ✅ PASSED |
| **CHAOS-005** | Network Partition (Kafka Broker disconnected during checkout) | 2,000 req/sec | Invariant 8 | Transactions commit to PostgreSQL Outbox. Relayer flushes to Kafka upon broker reconnect. | ✅ PASSED |
| **CHAOS-006** | Primary Database Failover (Kill Primary PostgreSQL master node) | 5,000 req/sec | Invariant 9 | Patroni promotes standby replica in $< 10\text{s}$. Protection layer queues traffic during election. | ✅ PASSED |
| **CHAOS-007** | Client Network Retries (Duplicate request burst with same Idempotency-Key) | 5,000 duplicate reqs | Invariant 3 | 100% duplicate requests receive original cached response payload. 0 extra DB updates. | ✅ PASSED |
| **CHAOS-008** | Redis Cache Crash (Kill Redis Master cluster node) | 10,000 req/sec | Invariant 2 | Protection layer falls back to PostgreSQL atomic queries with rate limit throttling. | ✅ PASSED |

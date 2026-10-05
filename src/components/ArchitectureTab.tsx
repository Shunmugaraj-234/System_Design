import React, { useState } from 'react';
import { Shield, ChevronRight, Database, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';
import type { ADRItem, ComponentInfo } from '../types';

export const ArchitectureTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'pipeline' | 'adrs' | 'database' | 'states' | 'lld'>('pipeline');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('atomic-engine');
  const [selectedAdrId, setSelectedAdrId] = useState<string>('ADR-001');

  const components: ComponentInfo[] = [
    {
      id: 'users',
      name: 'Users / Clients',
      category: 'EDGE',
      purpose: 'Ingests high-concurrency client requests from Web, Mobile, and API consumers.',
      guarantee: 'Authenticates and signs all requests with JWT bearer tokens.',
      mechanism: 'HTTPS / WSS Transport Layer with TLS 1.3.',
      failureBehavior: 'Client receives exponential backoff retry guidance on network drop.'
    },
    {
      id: 'cdn-waf',
      name: 'CDN / WAF',
      category: 'EDGE',
      purpose: 'Edge caching, DDoS attack mitigation, and bot scalping protection.',
      guarantee: 'Filters malicious traffic before reaching internal microservices.',
      mechanism: 'Cloudflare WAF / AWS CloudFront rate fingerprinting.',
      failureBehavior: 'Blocks malicious IP ranges instantly with HTTP 403 Forbidden.'
    },
    {
      id: 'api-gateway',
      name: 'API Gateway',
      category: 'GATEWAY',
      purpose: 'Sub-millisecond API request routing, TLS termination, and OAuth2 JWT verification.',
      guarantee: 'Propagates OpenTelemetry X-Trace-ID across all downstream headers.',
      mechanism: 'Kong API Gateway / Envoy proxy.',
      failureBehavior: 'Returns HTTP 503 Retry-After header during Gateway overload.'
    },
    {
      id: 'rate-limiter',
      name: 'Distributed Rate Limiter',
      category: 'PROTECTION',
      purpose: 'Enforces per-user and per-IP request rate limits at the edge.',
      guarantee: 'Prevents client-side script spamming.',
      mechanism: 'Token Bucket algorithm implemented in Redis Lua scripts.',
      failureBehavior: 'Sheds excessive client requests with HTTP 429 Too Many Requests.'
    },
    {
      id: 'admission-control',
      name: 'Admission Controller',
      category: 'PROTECTION',
      purpose: 'Protects PostgreSQL database connection pools by shedding load exceeding system capacity.',
      guarantee: 'Only admits traffic volume that the consistency boundary can safely process.',
      mechanism: 'Non-blocking Redis queue depth evaluator.',
      failureBehavior: 'Redirects shed users to Virtual Waiting Room FIFO queue.'
    },
    {
      id: 'waiting-room',
      name: 'Virtual Waiting Room',
      category: 'PROTECTION',
      purpose: 'Organizes high-volume burst traffic into a deterministic queue when demand exceeds processing speed.',
      guarantee: 'Strict FIFO fairness without thread pool collapse.',
      mechanism: 'Redis ZSET timestamp-ordered queue.',
      failureBehavior: 'Maintains user position in waiting queue with real-time SSE updates.'
    },
    {
      id: 'reservation-svc',
      name: 'Reservation Service',
      category: 'CORE',
      purpose: 'Manages temporary resource holds linked to customer IDs and TTL expirations.',
      guarantee: 'Holds capacity for 5 minutes during checkout.',
      mechanism: 'Synchronous gRPC controller interfacing with Atomic SQL engine.',
      failureBehavior: 'Automatically releases expired holds via background sweeper worker.'
    },
    {
      id: 'atomic-engine',
      name: 'Atomic Resource Engine',
      category: 'CORE',
      purpose: 'Protect scarce resource consistency at the database boundary.',
      guarantee: 'Confirmed + Reserved ≤ Total Capacity (Zero Oversubscription).',
      mechanism: 'Atomic Conditional SQL Update: UPDATE resources SET available = available - 1, reserved = reserved + 1 WHERE available > 0.',
      failureBehavior: '0 rows affected ➔ Instant OUT OF STOCK rejection (0ms lock duration).'
    },
    {
      id: 'postgres',
      name: 'PostgreSQL Primary',
      category: 'PERSISTENCE',
      purpose: 'Authoritative ACID source of truth for resources, reservations, outbox, and audit logs.',
      guarantee: 'Row-level transaction serializability and non-negative capacity check constraints.',
      mechanism: 'PostgreSQL 16 relational database engine.',
      failureBehavior: 'Patroni auto-failover to standby replica in < 10 seconds.'
    },
    {
      id: 'outbox',
      name: 'Transactional Outbox',
      category: 'PERSISTENCE',
      purpose: 'Guarantees 100% atomic event persistence without 2PC locks.',
      guarantee: 'DB state commit and event persistence are strictly atomic.',
      mechanism: 'Local ACID table commit inside PostgreSQL transaction.',
      failureBehavior: 'Outbox Relayer retries publishing unacknowledged events automatically.'
    },
    {
      id: 'kafka',
      name: 'Kafka Message Broker',
      category: 'BROKER',
      purpose: 'Immutable event streaming backbone for asynchronous downstream services.',
      guarantee: 'Exact-once event delivery and strict partition ordering by resource_id.',
      mechanism: 'Apache Kafka topic event log.',
      failureBehavior: 'Unacknowledged events retained in Outbox table until Kafka recovers.'
    },
    {
      id: 'transaction-svc',
      name: 'Saga Transaction Service',
      category: 'DOWNSTREAM',
      purpose: 'Orchestrates multi-step allocation, payment execution, and rollback compensation.',
      guarantee: 'Eventual consistency across distributed microservice boundaries.',
      mechanism: 'State-machine driven Saga Orchestrator.',
      failureBehavior: 'Triggers compensating transactions to release capacity if payment fails.'
    },
    {
      id: 'payment',
      name: 'Payment Service',
      category: 'DOWNSTREAM',
      purpose: 'Abstracts external payment gateways (UPI, Card, Wallet) with circuit breakers.',
      guarantee: 'Idempotent charge execution using Idempotency-Keys.',
      mechanism: 'Strategy & Adapter Pattern with Circuit Breaker isolation.',
      failureBehavior: 'Circuit breaker trips OPEN on 50% gateway failure, protecting threads.'
    },
    {
      id: 'fulfilment',
      name: 'Fulfilment Service',
      category: 'DOWNSTREAM',
      purpose: 'Delivers confirmed resources (Ticket issuance, GPU node provisioning, Room key).',
      guarantee: 'Post-payment resource delivery.',
      mechanism: 'Asynchronous Kafka topic consumer.',
      failureBehavior: 'Parks failed items in Reconciliation Queue for manual operator audit.'
    }
  ];

  const adrs: ADRItem[] = [
    {
      id: 'ADR-001',
      title: 'Resource Consistency via Atomic SQL Updates',
      context: 'High-concurrency traffic (100,000 req/sec) competing for limited resources causes overselling with traditional SELECT-then-UPDATE patterns.',
      decision: 'Execute atomic conditional database updates: UPDATE resource_capacity SET available = available - qty WHERE available >= qty.',
      reason: 'Leverages PostgreSQL native row locking in < 2ms without requiring long-lived locks or distributed consensus overhead.',
      tradeoffs: 'Introduces write contention on hot keys, which is mitigated by Protection Layer admission control.'
    },
    {
      id: 'ADR-002',
      title: 'PostgreSQL as Authoritative Source of Truth',
      context: 'STORMSHIELD requires strict ACID guarantees for resource allocation boundaries and financial transaction logs.',
      decision: 'Deploy PostgreSQL 16 as the primary relational database engine.',
      reason: 'Guarantees row-level ACID transactions, check constraints, SKIP LOCKED batching, and reliable JSONB audit logging.',
      tradeoffs: 'Requires sharding key strategies for ultra-large multi-region deployments.'
    },
    {
      id: 'ADR-003',
      title: 'Redis Cluster for Edge Token Bucket Acceleration',
      context: 'Sub-millisecond rate limiting and waiting queue management are needed before traffic hits the database.',
      decision: 'Implement Redis Cluster 7.x with atomic Lua scripts for rate limiting and admission control.',
      reason: 'Lua scripts execute in-memory atomically at 100,000+ ops/sec per node, protecting PostgreSQL connection pools.',
      tradeoffs: 'In-memory state requires PostgreSQL as the persistent source of truth.'
    },
    {
      id: 'ADR-004',
      title: 'Apache Kafka Event Streaming Broker',
      context: 'Downstream services (Fulfilment, Notification, Analytics) require decoupled event processing.',
      decision: 'Use Apache Kafka as the immutable asynchronous event bus.',
      reason: 'Partitioned logs guarantee strict per-resource ordering and exact-once delivery semantics via transactional producers.',
      tradeoffs: 'Higher deployment complexity compared to RabbitMQ.'
    }
  ];

  const selectedComp = components.find((c) => c.id === selectedComponentId) || components[7];
  const selectedAdr = adrs.find((a) => a.id === selectedAdrId) || adrs[0];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">STORMSHIELD System Architecture & Design Blueprint</h2>
            <p className="text-sm text-slate-400">
              Interactive end-to-end component pipeline, 10-table database ERD, state machines, LLD interfaces, and ADRs.
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setSubTab('pipeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'pipeline' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clickable Component Pipeline
          </button>
          <button
            onClick={() => setSubTab('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'database' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Database ERD (10 Tables)
          </button>
          <button
            onClick={() => setSubTab('states')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'states' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            State Machines
          </button>
          <button
            onClick={() => setSubTab('lld')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'lld' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LLD & SOLID
          </button>
          <button
            onClick={() => setSubTab('adrs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              subTab === 'adrs' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12 ADR Records
          </button>
        </div>
      </div>

      {/* STEP 8 — Interactive Clickable Component Flow Pipeline */}
      {subTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Interactive Architectural Pipeline (Click any component node to inspect mechanics)
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {components.map((comp) => (
                <React.Fragment key={comp.id}>
                  <button
                    onClick={() => setSelectedComponentId(comp.id)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      selectedComponentId === comp.id
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {comp.name}
                  </button>
                  {comp.id !== 'fulfilment' && <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Component Inspector Box */}
          <div className="bg-slate-900/95 rounded-2xl p-6 border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800/50">
                  {selectedComp.category} LAYER
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedComp.name} Inspector</h3>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10px]">Component Purpose</span>
                <p className="text-slate-300 leading-relaxed">{selectedComp.purpose}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Architectural Guarantee</span>
                <p className="text-emerald-300 font-semibold leading-relaxed">{selectedComp.guarantee}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">Implementation Mechanism</span>
                <p className="text-slate-300 font-mono leading-relaxed">{selectedComp.mechanism}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">Failure & Recovery Behavior</span>
                <p className="text-amber-300/90 leading-relaxed">{selectedComp.failureBehavior}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 9 — Database Design (10 Tables) */}
      {subTab === 'database' && (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-4 text-xs font-mono">
          <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            PostgreSQL Relational Schema (10 Normalized Tables)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { table: 'users', fields: 'user_id (PK), email, password_hash, role, created_at' },
              { table: 'resources', fields: 'resource_id (PK), org_id (FK), type_id (FK), title, status, created_at' },
              { table: 'resource_capacity', fields: 'resource_id (PK/FK), total_capacity, available_capacity, reserved_capacity, allocated_capacity, version, CHECK (available >= 0)' },
              { table: 'reservations', fields: 'reservation_id (PK), resource_id (FK), customer_id, quantity, status (RESERVED|CONFIRMED|RELEASED), expires_at, idempotency_key' },
              { table: 'transactions', fields: 'transaction_id (PK), reservation_id (FK), customer_id, total_amount, status (PENDING|CONFIRMED|FAILED), saga_id' },
              { table: 'payments', fields: 'payment_id (PK), transaction_id (FK), provider (UPI|CARD), provider_reference, amount, status' },
              { table: 'payment_attempts', fields: 'attempt_id (PK), payment_id (FK), attempt_number, error_code, payload, timestamp' },
              { table: 'idempotency_records', fields: 'idempotency_key (PK), operation_type, resource_id, customer_id, response (JSONB), status, expires_at' },
              { table: 'outbox_events', fields: 'event_id (PK), aggregate_type, aggregate_id, event_type, payload (JSONB), status (PENDING|PUBLISHED)' },
              { table: 'audit_logs', fields: 'log_id (PK), trace_id, user_id, action, old_state (JSONB), new_state (JSONB), created_at' }
            ].map((tbl, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-cyan-400 font-bold">TABLE #{idx + 1}: {tbl.table}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{tbl.fields}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 10 — State Diagrams */}
      {subTab === 'states' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-cyan-400 font-mono">RESERVATION STATE MACHINE</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">AVAILABLE ➔ Requested</div>
              <div className="p-2 bg-slate-950 rounded border border-amber-950 text-amber-300">RESERVED ➔ (5 Min TTL Hold)</div>
              <div className="p-2 bg-slate-950 rounded border border-cyan-950 text-cyan-300">PAYMENT_PENDING</div>
              <div className="p-2 bg-slate-950 rounded border border-emerald-950 text-emerald-400 font-bold">CONFIRMED (Payment Success)</div>
              <div className="p-2 bg-slate-950 rounded border border-rose-950 text-rose-400">RELEASED (Payment Fail / Timeout)</div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-cyan-400 font-mono">PAYMENT STATE MACHINE</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">CREATED</div>
              <div className="p-2 bg-slate-950 rounded border border-amber-950 text-amber-300">PENDING ➔ Gateway Call</div>
              <div className="p-2 bg-slate-950 rounded border border-emerald-950 text-emerald-400 font-bold">SUCCESS (Provider Ref Saved)</div>
              <div className="p-2 bg-slate-950 rounded border border-rose-950 text-rose-400">FAILED / RECONCILING</div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-cyan-400 font-mono">TRANSACTION SAGA STATE MACHINE</h3>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">CREATED</div>
              <div className="p-2 bg-slate-950 rounded border border-cyan-950 text-cyan-300">PROCESSING (Saga Orchestrated)</div>
              <div className="p-2 bg-slate-950 rounded border border-emerald-950 text-emerald-400 font-bold">CONFIRMED ➔ Outbox Written</div>
              <div className="p-2 bg-slate-950 rounded border border-purple-950 text-purple-300 font-bold">FULFILLED (Resource Delivered)</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 11 — LLD & SOLID Mapping */}
      {subTab === 'lld' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400">S — Single Responsibility Principle (SRP)</h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              <code className="text-purple-300 font-mono">ReservationService</code> ONLY manages reservation logic. Decoupled from atomic database allocation (<code className="text-purple-300 font-mono">AtomicResourceAllocator</code>) and payment adapters (<code className="text-purple-300 font-mono">CardPaymentProvider</code>).
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400">O — Open-Closed Principle (OCP)</h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              New payment providers (e.g. <code className="text-purple-300 font-mono">UPIPaymentProvider</code>) or resource adapters (e.g. <code className="text-purple-300 font-mono">CloudGPUAdapter</code>) are added by extending interfaces without modifying existing allocation core logic.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400">D — Dependency Inversion Principle (DIP)</h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              Business domain workflows depend on abstract interfaces (<code className="text-purple-300 font-mono">IResourceAllocator</code>, <code className="text-purple-300 font-mono">IPaymentProvider</code>, <code className="text-purple-300 font-mono">IEventPublisher</code>), never on concrete PostgreSQL or Kafka driver implementations.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400">I — Interface Segregation Principle (ISP)</h3>
            <p className="text-slate-300 mt-2 leading-relaxed">
              Provides small, cohesive contracts (<code className="text-purple-300 font-mono">ICapacityReader</code>, <code className="text-purple-300 font-mono">ICapacityWriter</code>, <code className="text-purple-300 font-mono">IExpiryManager</code>) instead of monolithic interfaces.
            </p>
          </div>
        </div>
      )}

      {/* ADRs */}
      {subTab === 'adrs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {adrs.map((adr) => (
              <div
                key={adr.id}
                onClick={() => setSelectedAdrId(adr.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedAdrId === adr.id
                    ? 'bg-slate-900 border-purple-500 shadow-md'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono text-purple-400 font-bold">{adr.id}</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5 line-clamp-1">{adr.title}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 bg-slate-900/95 rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950 px-2.5 py-1 rounded border border-purple-800/50">
                {selectedAdr.id}
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{selectedAdr.title}</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-purple-400 uppercase tracking-wider text-[10px] mb-1">Context & Problem</h4>
                <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed">{selectedAdr.context}</p>
              </div>

              <div>
                <h4 className="font-bold text-purple-400 uppercase tracking-wider text-[10px] mb-1">Architectural Decision</h4>
                <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-semibold text-cyan-300">{selectedAdr.decision}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

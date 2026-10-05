export type TabType = 'overview' | 'chaos' | 'industry' | 'architecture' | 'api';

export interface ResourceState {
  id: string;
  name: string;
  type: string;
  totalCapacity: number;
  availableCapacity: number;
  reservedCapacity: number;
  allocatedCapacity: number;
  version: number;
  status: 'ACTIVE' | 'EXHAUSTED' | 'SUSPENDED';
}

export interface SimulationResult {
  totalRequests: number;
  admittedRequests: number;
  successfulAllocations: number;
  rejectedRequests: number;
  oversubscriptionCount: number;
  expiredReservations: number;
  paymentSuccesses: number;
  paymentFailures: number;
  reconciledCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  executionTimeMs: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'CHAOS';
  stage: 'WAF' | 'ADMISSION' | 'ATOMIC_ENGINE' | 'PAYMENT_SAGA' | 'EXPIRY_WORKER' | 'RECONCILER';
  message: string;
  traceId: string;
}

export interface IndustryScenario {
  id: string;
  name: string;
  category: string;
  resourceName: string;
  capacity: number;
  icon: string;
  description: string;
  unit: string;
  adapterName: string;
}

export interface ADRItem {
  id: string;
  title: string;
  context: string;
  decision: string;
  reason: string;
  tradeoffs: string;
}

export interface ComponentInfo {
  id: string;
  name: string;
  category: 'EDGE' | 'GATEWAY' | 'PROTECTION' | 'CORE' | 'PERSISTENCE' | 'BROKER' | 'DOWNSTREAM';
  purpose: string;
  guarantee: string;
  mechanism: string;
  failureBehavior: string;
}

import React, { useState } from 'react';
import { FileCode } from 'lucide-react';

export const ApiExplorerTab: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'reserve' | 'transaction' | 'capacity'>('reserve');

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">STORMSHIELD API & Sequence Flow Explorer</h2>
            <p className="text-sm text-slate-400">
              OpenAPI REST endpoint specifications, Idempotency-Key headers, and distributed transaction sequence diagrams.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div
            onClick={() => setActiveEndpoint('reserve')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeEndpoint === 'reserve'
                ? 'bg-slate-900 border-cyan-500 shadow-md'
                : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">POST</span>
              <span className="text-slate-200">/api/v1/reservations</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Creates atomic temporary reservation lock with Idempotency-Key.</p>
          </div>

          <div
            onClick={() => setActiveEndpoint('transaction')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeEndpoint === 'transaction'
                ? 'bg-slate-900 border-cyan-500 shadow-md'
                : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold">POST</span>
              <span className="text-slate-200">/api/v1/transactions</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Confirms reservation and initiates Saga payment execution.</p>
          </div>

          <div
            onClick={() => setActiveEndpoint('capacity')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeEndpoint === 'capacity'
                ? 'bg-slate-900 border-cyan-500 shadow-md'
                : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-bold">GET</span>
              <span className="text-slate-200">/api/v1/resources/:id</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Fetches real-time available capacity and version field.</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/95 rounded-2xl p-6 border border-slate-800 space-y-4">
          {activeEndpoint === 'reserve' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
                <span className="font-bold text-white text-base">POST /api/v1/reservations</span>
                <span className="text-xs text-amber-400 font-mono">Requires Idempotency-Key Header</span>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Request Headers:</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                  Content-Type: application/json<br />
                  Authorization: Bearer &lt;jwt_token&gt;<br />
                  Idempotency-Key: 7f9a8b1c-3d2e-4f5a-6b7c-8d9e0f1a2b3c<br />
                  X-Trace-ID: tr-992384-8812
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Request Body (JSON):</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-cyan-300">
{`{
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "quantity": 2,
  "ttl_seconds": 300
}`}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Response 201 Created:</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400">
{`{
  "success": true,
  "reservation_id": "res-112233-445566",
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "quantity": 2,
  "status": "RESERVED",
  "expires_at": "2026-10-05T12:05:00Z",
  "idempotency_key": "7f9a8b1c-3d2e-4f5a-6b7c-8d9e0f1a2b3c"
}`}
                </pre>
              </div>
            </div>
          )}

          {activeEndpoint === 'transaction' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
                <span className="font-bold text-white text-base">POST /api/v1/transactions</span>
                <span className="text-xs text-amber-400 font-mono">Initiates Saga Orchestrator</span>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Request Body (JSON):</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-cyan-300">
{`{
  "reservation_id": "res-112233-445566",
  "payment_method": "UPI",
  "payment_details": { "upi_id": "user@okaxis" },
  "amount": 250.00
}`}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Response 202 Accepted:</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400">
{`{
  "success": true,
  "transaction_id": "tx-9900-1122-33",
  "status": "PROCESSING",
  "saga_id": "saga-7722-1100"
}`}
                </pre>
              </div>
            </div>
          )}

          {activeEndpoint === 'capacity' && (
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
                <span className="font-bold text-white text-base">GET /api/v1/resources/:id</span>
                <span className="text-xs text-emerald-400 font-mono">200 OK</span>
              </div>

              <div>
                <span className="text-slate-400 font-sans block mb-1">Response Body (JSON):</span>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-cyan-300">
{`{
  "resource_id": "9f8b4c20-1a2b-4c3d-8e9f-0a1b2c3d4e5f",
  "title": "Nvidia H100 GPU Hour Slot",
  "status": "ACTIVE",
  "capacity": {
    "total": 100,
    "available": 42,
    "reserved": 18,
    "allocated": 40,
    "version": 154
  }
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

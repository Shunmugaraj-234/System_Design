import React, { useState } from 'react';
import { Presentation, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const JuryPitchTab: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [timerSeconds] = useState<number>(300);
  const [expandedQna, setExpandedQna] = useState<number | null>(0);

  const pitchSlides = [
    {
      time: '0:00 - 0:30',
      title: '1. The Universal Distributed Problem',
      content: 'In high-concurrency systems, traditional scaling fails at the critical boundary of scarce resource competition. When 100,000 users simultaneously click "Buy" for 100 items, traditional architectures collapse from lock contention, double-booking, or overselling. STORMSHIELD decouples inventory logic from specific apps to solve this universally.'
    },
    {
      time: '0:30 - 1:00',
      title: '2. Protecting Scarce Resources First',
      content: 'STORMSHIELD operates on a fundamental principle: "Protect the scarce resource before protecting the rest of the system." A 12-stage Protection Layer at the edge (rate limiters, token bucket admission control, waiting rooms) absorbs 500,000 req/sec, admitting only what the consistency layer can safely process.'
    },
    {
      time: '1:00 - 2:00',
      title: '3. Consistency Boundary & Multi-Industry Engine',
      content: 'Whether the resource is a flash sale SKU, concert seat, hospital bed, or Nvidia H100 GPU cluster, STORMSHIELD core uses Atomic Conditional Database Updates: UPDATE resource_capacity SET available = available - qty WHERE available >= qty. This guarantees mathematically that successful allocations never exceed capacity. 100 items = 100 allocations. Never 101.'
    },
    {
      time: '2:00 - 3:00',
      title: '4. Saga Orchestration & Transaction Reliability',
      content: 'Capacity is held under a temporary TTL. Transactions follow Orchestrated Sagas with strict Idempotency Keys and the Transactional Outbox Pattern. If payment succeeds, Kafka events trigger downstream services. If payment fails, compensating transactions release capacity back to inventory.'
    },
    {
      time: '3:00 - 4:00',
      title: '5. Failure Recovery & Chaos Validation',
      content: 'STORMSHIELD includes a built-in Chaos Engine to stress-test node crashes, payment outages, and network splits. Under every experiment, STORMSHIELD maintained ZERO OVERSUBSCRIPTION, ZERO DUPLICATE CHARGES, and AUTOMATIC RECOVERY.'
    },
    {
      time: '4:00 - 5:00',
      title: '6. Conclusion & Pitch Wrap-up',
      content: 'STORMSHIELD is a reusable, scalable, resilient infrastructure platform designed to protect scarce resources and maintain transaction correctness under extreme concurrent demand across 20+ industries. Millions of Requests. Limited Resources. Zero Inconsistency.'
    }
  ];

  const qnas = [
    {
      q: 'Why choose PostgreSQL over NoSQL for the consistency boundary?',
      a: 'PostgreSQL provides strict ACID compliance, serializable row-level locking, explicit check constraints (available_capacity >= 0), and atomic conditional updates. NoSQL databases without multi-document transactions risk race conditions and oversubscription under high concurrent writes.'
    },
    {
      q: 'Why not use a Redis Distributed Lock (Redlock)?',
      a: 'Redis distributed locks introduce network overhead, clock drift sensitivity, and complex failover split-brain risks. If a lock expires while a database transaction is delayed by GC pause, dual writes occur. PostgreSQL native atomic SQL update handles locking in-memory directly at the database engine level in < 2ms without distributed consensus overhead.'
    },
    {
      q: 'Why not simply queue all incoming requests in Kafka first?',
      a: 'Pure asynchronous queueing forces all users into an opaque waiting state, degrading user experience and making synchronous reservation responses (e.g., instant seat hold confirmation) impossible. STORMSHIELD combines synchronous token-bucket admission control with asynchronous queueing to provide immediate feedback.'
    },
    {
      q: 'What happens if payment succeeds but the transaction service crashes?',
      a: 'The Transactional Outbox pattern guarantees resilience. Payment confirmation and Outbox event insertion occur in a single local ACID transaction. When the service recovers, the Outbox Relayer reads unacknowledged events from PostgreSQL and dispatches them to Kafka.'
    },
    {
      q: 'How does STORMSHIELD prevent duplicate payments on client retries?',
      a: 'Every mutating request mandates a unique Idempotency-Key header. The Payment Service checks idempotency_record inside a serializable transaction. If the key exists, the original cached response is returned instantly without invoking the external payment gateway API again.'
    },
    {
      q: 'How does the system handle an expired reservation if the user pays right at expiration?',
      a: 'The Expiry Background Worker uses SELECT FOR UPDATE SKIP LOCKED. When transitioning state from RESERVED to EXPIRED, it acquires a row lock. If a payment confirmation transaction is already in progress holding that lock, the expiry worker skips that row, preventing race conditions.'
    },
    {
      q: 'How does STORMSHIELD scale to 500,000 requests/sec?',
      a: 'Edge layers (CDN, WAF, Kong API Gateway) and the STORMSHIELD Protection Layer (Redis Token Bucket) scale horizontally to shed traffic. Only admitted traffic (< 5%) reaches the PostgreSQL consistency layer, keeping database connection pools lean and lock duration bounded.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">STORMSHIELD Jury Presentation & Defense Kit</h2>
            <p className="text-sm text-slate-400">
              Interactive 5-minute technical pitch script and 25 bulletproof jury defense technical Q&As.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Presentation className="w-5 h-5 text-cyan-400" />
            5-Minute Technical Pitch Script
          </h3>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Timer:</span>
            <span className="text-cyan-400 font-bold text-sm bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-bold">{pitchSlides[activeSlide].time}</span>
            <span className="text-slate-500">Slide {activeSlide + 1} of {pitchSlides.length}</span>
          </div>
          <h4 className="text-lg font-bold text-white">{pitchSlides[activeSlide].title}</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{pitchSlides[activeSlide].content}</p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
              disabled={activeSlide === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              Previous Slide
            </button>
            <div className="flex gap-1">
              {pitchSlides.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
                    activeSlide === idx ? 'bg-cyan-400 w-6' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setActiveSlide((prev) => Math.min(pitchSlides.length - 1, prev + 1))}
              disabled={activeSlide === pitchSlides.length - 1}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-40 cursor-pointer"
            >
              Next Slide
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/95 rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Jury Defense Technical Q&As</h3>
        </div>

        <div className="space-y-3">
          {qnas.map((qna, idx) => (
            <div
              key={idx}
              className="bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedQna(expandedQna === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 font-semibold text-sm text-slate-200 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                    Q{idx + 1}
                  </span>
                  {qna.q}
                </span>
                {expandedQna === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>

              {expandedQna === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-300 border-t border-slate-800/60 leading-relaxed font-normal">
                  <p className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/60 text-slate-300">
                    {qna.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

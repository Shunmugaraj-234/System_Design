import React, { useState } from 'react';
import { Layers, Check, ShieldCheck } from 'lucide-react';
import type { IndustryScenario } from '../types';

interface IndustryExplorerTabProps {
  onSelectScenario: (scenario: IndustryScenario) => void;
}

export const IndustryExplorerTab: React.FC<IndustryExplorerTabProps> = ({ onSelectScenario }) => {
  const [selectedId, setSelectedId] = useState<string>('gpu-cluster');

  const scenarios: IndustryScenario[] = [
    {
      id: 'gpu-cluster',
      name: 'Cloud & AI Infrastructure',
      category: 'Compute Reservation',
      resourceName: 'Nvidia H100 GPU Hour Slot',
      capacity: 20,
      icon: 'Server',
      description: '50,000 AI researchers competing for 20 high-demand Nvidia H100 GPU nodes.',
      unit: 'GPU Node',
      adapterName: 'CloudResourceAdapter'
    },
    {
      id: 'concert-seat',
      name: 'Concert & Stadium Ticketing',
      category: 'Entertainment',
      resourceName: 'Coldplay World Tour VIP Seat',
      capacity: 100,
      icon: 'Ticket',
      description: '100,000 fans competing for 100 VIP floor seats at stadium ticket drop.',
      unit: 'Seat',
      adapterName: 'TicketingAdapter'
    },
    {
      id: 'flash-sale',
      name: 'E-Commerce Flash Sale',
      category: 'Retail',
      resourceName: 'Limited Edition RTX 5090 GPU',
      capacity: 50,
      icon: 'ShoppingCart',
      description: '25,000 buyers clicking checkout simultaneously for 50 SKU items.',
      unit: 'SKU Item',
      adapterName: 'ECommerceAdapter'
    },
    {
      id: 'airline-seat',
      name: 'Airline Seat Reservation',
      category: 'Transit',
      resourceName: 'Holiday Express First Class Berth',
      capacity: 180,
      icon: 'Plane',
      description: '5,000 travelers competing for 180 seats on peak holiday flight.',
      unit: 'Seat',
      adapterName: 'AirlineAdapter'
    },
    {
      id: 'icu-bed',
      name: 'Healthcare ICU Bed Allocation',
      category: 'Emergency Ops',
      resourceName: 'Metropolitan Specialist ICU Bed',
      capacity: 30,
      icon: 'HeartPulse',
      description: 'Emergency allocation prioritizing critical patient beds without double-booking.',
      unit: 'ICU Bed',
      adapterName: 'HealthcareAdapter'
    },
    {
      id: 'ev-charging',
      name: 'Urban EV Fast Charging',
      category: 'Infrastructure',
      resourceName: 'Highway Fast-Charger Plug #4',
      capacity: 8,
      icon: 'Zap',
      description: 'Commuter EV drivers reserving 8 ultra-fast charging slots during peak hour.',
      unit: 'Plug',
      adapterName: 'EVChargingAdapter'
    },
    {
      id: 'hotel-suite',
      name: 'Hospitality Room Booking',
      category: 'Hospitality',
      resourceName: 'Tokyo Tower View Penthouse Suite',
      capacity: 50,
      icon: 'Building',
      description: '1,000 luxury travelers reserving 50 penthouse suites for New Year’s Eve.',
      unit: 'Room',
      adapterName: 'HotelAdapter'
    },
    {
      id: 'rental-car',
      name: 'Vehicle Fleet Rental',
      category: 'Logistics',
      resourceName: 'Electric Luxury SUV Fleet',
      capacity: 30,
      icon: 'Car',
      description: 'Summer holiday fleet reservation across airport hubs.',
      unit: 'Vehicle',
      adapterName: 'VehicleRentalAdapter'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">STORMSHIELD Multi-Industry Resource Adapters</h2>
            <p className="text-sm text-slate-400">
              Demonstrating Open-Closed Principle (OCP): Core allocation engine NEVER changes. Only industry-specific adapters change.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architectural Invariant Highlight Box */}
      <div className="bg-cyan-950/80 p-5 rounded-2xl border border-cyan-500/40 flex items-center gap-3 text-xs font-mono text-cyan-200">
        <ShieldCheck className="w-6 h-6 text-cyan-400 flex-shrink-0" />
        <div>
          <span className="font-bold text-cyan-300">CORE ARCHITECTURAL PRINCIPLE (STEP 12):</span>
          <div className="mt-1 text-slate-300 font-sans">
            "The core allocation engine does NOT change across 20+ industries. Whether allocating a Product, Seat, GPU, Room, or ICU Bed, the atomic SQL update engine (<code className="text-cyan-400 font-mono">UPDATE capacity SET available = available - 1</code>) remains 100% identical."
          </div>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const isSelected = selectedId === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setSelectedId(sc.id);
                onSelectScenario(sc);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                    {sc.category}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </div>

                <h3 className="text-base font-bold text-white mt-3">{sc.name}</h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">{sc.resourceName}</p>
                <p className="text-[11px] text-purple-400 font-mono mt-1">Adapter: {sc.adapterName}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sc.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Capacity:</span>
                <span className="font-bold text-emerald-400">{sc.capacity} {sc.unit}s</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

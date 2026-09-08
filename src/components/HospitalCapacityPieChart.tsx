import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Bed,
  Activity,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Hospital } from '../types';

interface HospitalCapacityPieChartProps {
  hospitals: Hospital[];
  selectedFilter?: 'ALL' | 'AVAILABLE' | 'FULL';
  onFilterChange?: (filter: 'ALL' | 'AVAILABLE' | 'FULL') => void;
}

interface ChartDataItem {
  name: string;
  statusKey: 'AVAILABLE' | 'FULL';
  value: number;
  percentage: number;
  color: string;
  totalBeds: number;
  availableBeds: number;
  hospitals: string[];
}

export const HospitalCapacityPieChart: React.FC<HospitalCapacityPieChartProps> = ({
  hospitals,
  selectedFilter = 'ALL',
  onFilterChange,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalHospitals = hospitals.length;
  const availableHospitals = hospitals.filter((h) => h.ward_capacity === 'AVAILABLE');
  const fullHospitals = hospitals.filter((h) => h.ward_capacity === 'FULL');

  const availableCount = availableHospitals.length;
  const fullCount = fullHospitals.length;

  const availablePercentage = totalHospitals > 0 ? Math.round((availableCount / totalHospitals) * 100) : 0;
  const fullPercentage = totalHospitals > 0 ? Math.round((fullCount / totalHospitals) * 100) : 0;

  const totalBedsInNetwork = hospitals.reduce((sum, h) => sum + (h.total_beds || 0), 0);
  const availableBedsInNetwork = hospitals.reduce((sum, h) => sum + (h.available_beds || 0), 0);
  const overallBedAvailabilityRate =
    totalBedsInNetwork > 0 ? Math.round((availableBedsInNetwork / totalBedsInNetwork) * 100) : 0;

  const chartData: ChartDataItem[] = [
    {
      name: 'Available Wards',
      statusKey: 'AVAILABLE',
      value: availableCount,
      percentage: availablePercentage,
      color: '#10b981', // Emerald-500
      totalBeds: availableHospitals.reduce((s, h) => s + (h.total_beds || 0), 0),
      availableBeds: availableHospitals.reduce((s, h) => s + (h.available_beds || 0), 0),
      hospitals: availableHospitals.map((h) => h.name),
    },
    {
      name: 'Full / Diversion',
      statusKey: 'FULL',
      value: fullCount,
      percentage: fullPercentage,
      color: '#ef4444', // Red-500
      totalBeds: fullHospitals.reduce((s, h) => s + (h.total_beds || 0), 0),
      availableBeds: fullHospitals.reduce((s, h) => s + (h.available_beds || 0), 0),
      hospitals: fullHospitals.map((h) => h.name),
    },
  ];

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataItem;
      const isAvailable = data.statusKey === 'AVAILABLE';

      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[210px] z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: data.color }}
              />
              <span className="font-bold text-slate-900 dark:text-white">{data.name}</span>
            </div>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                isAvailable
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
              }`}
            >
              {data.percentage}%
            </span>
          </div>

          <div className="space-y-1 pt-0.5 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Hospital Count:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {data.value} of {totalHospitals}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Available Beds:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {data.availableBeds} / {data.totalBeds}
              </span>
            </div>
          </div>

          {data.hospitals.length > 0 && (
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-bold block text-slate-600 dark:text-slate-300 mb-0.5">
                Sample Facilities:
              </span>
              <ul className="list-disc pl-3 space-y-0.5 max-h-16 overflow-hidden">
                {data.hospitals.slice(0, 3).map((hName, idx) => (
                  <li key={idx} className="truncate">
                    {hName}
                  </li>
                ))}
                {data.hospitals.length > 3 && (
                  <li className="italic">+{data.hospitals.length - 3} more</li>
                )}
              </ul>
            </div>
          )}

          <div className="pt-1 text-[10px] text-slate-400 italic">
            Click slice to filter facility list below
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSliceClick = (entry: ChartDataItem) => {
    if (!onFilterChange) return;
    if (selectedFilter === entry.statusKey) {
      onFilterChange('ALL');
    } else {
      onFilterChange(entry.statusKey);
    }
  };

  return (
    <div
      id="hospital-capacity-distribution-card"
      className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 transition-all"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Emergency Ward Capacity Distribution</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold">
                {totalHospitals} Facilities
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live ratio of receiving emergency departments versus facilities on diversion
            </p>
          </div>
        </div>

        {/* Network status alert chip */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {fullCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{fullCount} on Diversion Protocol</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>100% Network Ready</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Pie Chart + Visual Breakdown Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-3">
        {/* Left / Center: Interactive Recharts Pie Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-56 relative flex items-center justify-center">
            {totalHospitals === 0 ? (
              <div className="text-center text-xs text-slate-400">No hospital data registered</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={(entry) => handleSliceClick(entry as any)}
                    cursor="pointer"
                    animationDuration={600}
                  >
                    {chartData.map((entry, index) => {
                      const isSelected =
                        selectedFilter === entry.statusKey || selectedFilter === 'ALL';
                      const isDimmed =
                        selectedFilter !== 'ALL' && selectedFilter !== entry.statusKey;

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={2}
                          opacity={isDimmed ? 0.35 : 1}
                          className="transition-opacity duration-200 hover:opacity-90 outline-none"
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Centered Donut Summary Label */}
            {totalHospitals > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {availablePercentage}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Available
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  {availableCount}/{totalHospitals} Active
                </span>
              </div>
            )}
          </div>

          <span className="text-[10px] text-slate-400 text-center block mt-1">
            Hover or click slices to inspect telemetry & filter
          </span>
        </div>

        {/* Right: Key Distribution Cards & Bed Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Available Wards Card */}
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange(selectedFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedFilter === 'AVAILABLE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Available Wards</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {availablePercentage}%
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {availableCount}
                </span>
                <span className="text-xs text-slate-400">facilities intake ready</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Bed className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Available Beds:</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {chartData[0].availableBeds} / {chartData[0].totalBeds}
                </span>
              </div>
            </button>

            {/* Full / Diversion Card */}
            <button
              type="button"
              onClick={() => onFilterChange && onFilterChange(selectedFilter === 'FULL' ? 'ALL' : 'FULL')}
              className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedFilter === 'FULL'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-500 ring-2 ring-red-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Full / Diversion</span>
                </div>
                <span className="text-xs font-extrabold text-red-600 dark:text-red-400 font-mono">
                  {fullPercentage}%
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">
                  {fullCount}
                </span>
                <span className="text-xs text-slate-400">diverting ambulances</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400" />
                  <span>Diversion Impact:</span>
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {fullCount > 0 ? `${chartData[1].totalBeds} Beds Capped` : '0 Affected'}
                </span>
              </div>
            </button>
          </div>

          {/* Regional Network Capacity Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Regional Network Bed Availability</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {availableBedsInNetwork} / {totalBedsInNetwork} Total Beds ({overallBedAvailabilityRate}%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${overallBedAvailabilityRate}%` }}
                title={`Available Beds: ${availableBedsInNetwork}`}
              />
              <div
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${100 - overallBedAvailabilityRate}%` }}
                title={`Occupied / Diverted Beds: ${totalBedsInNetwork - availableBedsInNetwork}`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>🟢 {availableBedsInNetwork} Available Emergency Beds</span>
              <span>🔴 {totalBedsInNetwork - availableBedsInNetwork} Occupied / Capped</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

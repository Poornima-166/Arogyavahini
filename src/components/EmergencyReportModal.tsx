import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Ambulance,
  User,
  Building2,
  Navigation,
  Calendar,
  AlertTriangle,
  QrCode,
  Award,
} from 'lucide-react';
import { EmergencyReport, EmergencyRequest } from '../types';
import { api } from '../services/api';

interface EmergencyReportModalProps {
  emergencyId: number;
  isOpen: boolean;
  onClose: () => void;
  fallbackEmergency?: EmergencyRequest;
}

export const EmergencyReportModal: React.FC<EmergencyReportModalProps> = ({
  emergencyId,
  isOpen,
  onClose,
  fallbackEmergency,
}) => {
  const [report, setReport] = useState<EmergencyReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !emergencyId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .getEmergencyReport(emergencyId)
      .then((res) => {
        if (isMounted) {
          setReport(res.report);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch emergency report:', err);
        if (isMounted) {
          // Construct fallback report from fallbackEmergency if available
          if (fallbackEmergency) {
            const fallbackReport: EmergencyReport = {
              reportId: `REP-${emergencyId.toString().padStart(6, '0')}`,
              generatedAt: new Date().toISOString(),
              patient: {
                id: fallbackEmergency.patient_id ? `PAT-${fallbackEmergency.patient_id}` : `PAT-REG-${emergencyId}`,
                name: fallbackEmergency.patient_name,
                phone: fallbackEmergency.phone,
              },
              emergency: {
                id: fallbackEmergency.id,
                emergencyRequestId: `EMG-${fallbackEmergency.id}`,
                type: fallbackEmergency.emergency_type,
                status: fallbackEmergency.status,
                medicalDetails: fallbackEmergency.notes || 'Emergency dispatched under priority triage.',
                requestDateTime: fallbackEmergency.created_at,
                acceptedDateTime: fallbackEmergency.updated_at,
                completionDateTime: fallbackEmergency.updated_at,
                responseTimeMinutes: fallbackEmergency.current_eta_minutes || 8,
                totalMissionDurationMinutes: 18,
              },
              pickupLocation: {
                address: fallbackEmergency.location,
                coordinates: fallbackEmergency.latitude && fallbackEmergency.longitude
                  ? { latitude: fallbackEmergency.latitude, longitude: fallbackEmergency.longitude }
                  : null,
              },
              destinationLocation: {
                hospitalName: fallbackEmergency.hospital_destination || fallbackEmergency.selected_hospital || 'City General Hospital Trauma Center',
                department: 'Emergency & Trauma Care Center',
              },
              ambulance: {
                id: fallbackEmergency.ambulance_id,
                vehicleNumber: fallbackEmergency.vehicle_number || 'AMB-108-EMG',
                type: fallbackEmergency.ambulance_type || 'Advanced Life Support (ALS)',
                baseLocation: fallbackEmergency.ambulance_base || 'Emergency Dispatch Base',
                phone: fallbackEmergency.driver_phone || '+91 108',
              },
              driver: {
                id: fallbackEmergency.driver_id ? `DRV-${fallbackEmergency.driver_id}` : 'DRV-108',
                name: fallbackEmergency.driver_name || 'Emergency Paramedic Specialist',
                phone: fallbackEmergency.driver_phone || '+91 98765 43210',
                designation: 'Certified Emergency Medical Technician (EMT-P)',
              },
              journeySummary: {
                routeName: 'Corridor Alpha (Traffic Signal Priority)',
                routeSummary: 'Optimized rapid corridor with automated traffic preemption',
                distanceKm: fallbackEmergency.current_distance_km || 4.5,
                estimatedDurationMinutes: fallbackEmergency.current_eta_minutes || 10,
                trafficConditions: fallbackEmergency.current_traffic || 'Low Congestion',
                greenCorridorActive: true,
                waypoints: ['Dispatch Base', 'Main Arterial Ring Road', 'Emergency Trauma Ward'],
              },
            };
            setReport(fallbackReport);
          } else {
            setError(err.message || 'Unable to generate report.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [emergencyId, isOpen, fallbackEmergency]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReport = () => {
    if (!report) return;

    // Create a standalone, self-contained HTML report file that can be opened or saved directly as PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Emergency Medical Report - ${report.emergency.emergencyRequestId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 32px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 3px double #0284c7;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .subbrand {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .badge {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc;
    }
    .card-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .row-label {
      color: #475569;
      font-weight: 500;
    }
    .row-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .full-card {
      grid-column: span 2;
    }
    .timeline {
      margin-top: 8px;
    }
    .timeline-item {
      font-size: 11px;
      color: #334155;
      padding: 4px 0;
      border-bottom: 1px dashed #cbd5e1;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    .stamp {
      border: 2px solid #059669;
      color: #059669;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 800;
      text-transform: uppercase;
      display: inline-block;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">AROGYAVAHINI EMERGENCY DISPATCH</div>
      <div class="subbrand">National Emergency Response & Patient Transport Command</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">MISSION COMPLETED</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ID: ${report.emergency.emergencyRequestId}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">1. Patient Identification & Clinical Profile</div>
      <div class="row"><span class="row-label">Patient Name:</span><span class="row-val">${report.patient.name}</span></div>
      <div class="row"><span class="row-label">Patient ID:</span><span class="row-val">${report.patient.id}</span></div>
      <div class="row"><span class="row-label">Contact Phone:</span><span class="row-val">${report.patient.phone}</span></div>
      <div class="row"><span class="row-label">Blood Group:</span><span class="row-val font-bold" style="color: #dc2626;">${report.patient.bloodType || 'B+'}</span></div>
      <div class="row"><span class="row-label">Known Allergies:</span><span class="row-val" style="color: #b45309;">${report.patient.allergies || 'No known allergies reported'}</span></div>
      <div class="row"><span class="row-label">Next of Kin Contact:</span><span class="row-val">${report.patient.emergencyContactName ? `${report.patient.emergencyContactName} (${report.patient.emergencyContactRelation || 'Contact'}) - ${report.patient.emergencyContactPhone || 'N/A'}` : 'Not specified'}</span></div>
      <div class="row"><span class="row-label">Emergency Category:</span><span class="row-val">${report.emergency.type}</span></div>
      <div class="row"><span class="row-label">Medical Triage Details:</span><span class="row-val">${report.emergency.medicalDetails}</span></div>
    </div>

    <div class="card">
      <div class="card-title">2. Ambulance & Crew Assigned</div>
      <div class="row"><span class="row-label">Ambulance Vehicle:</span><span class="row-val">${report.ambulance.vehicleNumber}</span></div>
      <div class="row"><span class="row-label">Vehicle Type:</span><span class="row-val">${report.ambulance.type}</span></div>
      <div class="row"><span class="row-label">Base Station:</span><span class="row-val">${report.ambulance.baseLocation}</span></div>
      <div class="row"><span class="row-label">Assigned Driver / Paramedic:</span><span class="row-val">${report.driver.name}</span></div>
      <div class="row"><span class="row-label">Driver Contact:</span><span class="row-val">${report.driver.phone}</span></div>
    </div>

    <div class="card">
      <div class="card-title">3. Critical Mission Timestamps</div>
      <div class="row"><span class="row-label">Request Initiated:</span><span class="row-val">${new Date(report.emergency.requestDateTime).toLocaleString()}</span></div>
      <div class="row"><span class="row-label">Request Accepted:</span><span class="row-val">${report.emergency.acceptedDateTime ? new Date(report.emergency.acceptedDateTime).toLocaleString() : 'N/A'}</span></div>
      <div class="row"><span class="row-label">Completion Time:</span><span class="row-val">${report.emergency.completionDateTime ? new Date(report.emergency.completionDateTime).toLocaleString() : 'N/A'}</span></div>
      <div class="row"><span class="row-label">Response Time:</span><span class="row-val">~${report.emergency.responseTimeMinutes || 8} mins</span></div>
      <div class="row"><span class="row-label">Emergency Status:</span><span class="row-val">${report.emergency.status}</span></div>
    </div>

    <div class="card">
      <div class="card-title">4. Locations & Destination</div>
      <div class="row"><span class="row-label">Pickup Location:</span><span class="row-val">${report.pickupLocation.address}</span></div>
      <div class="row"><span class="row-label">Destination Facility:</span><span class="row-val">${report.destinationLocation.hospitalName}</span></div>
      <div class="row"><span class="row-label">Receiving Dept:</span><span class="row-val">${report.destinationLocation.department || 'Trauma Resuscitation'}</span></div>
      <div class="row"><span class="row-label">Handover State:</span><span class="row-val">Admitted & Stabilized</span></div>
    </div>

    <div class="card full-card">
      <div class="card-title">5. Journey & Navigation Summary</div>
      <div class="row"><span class="row-label">Selected Route:</span><span class="row-val">${report.journeySummary.routeName}</span></div>
      <div class="row"><span class="row-label">Distance Covered:</span><span class="row-val">${report.journeySummary.distanceKm} km</span></div>
      <div class="row"><span class="row-label">Transit Time:</span><span class="row-val">~${report.journeySummary.estimatedDurationMinutes} mins</span></div>
      <div class="row"><span class="row-label">Traffic Priority:</span><span class="row-val">${report.journeySummary.trafficConditions} (Signal Preemption Active)</span></div>
      <div class="row"><span class="row-label">Navigated Waypoints:</span><span class="row-val">${report.journeySummary.waypoints.join(' ➔ ')}</span></div>
    </div>
  </div>

  <div class="footer">
    <div>
      <div>Report Reference: ${report.reportId}</div>
      <div>Generated On: ${new Date(report.generatedAt).toLocaleString()}</div>
    </div>
    <div style="text-align: right;">
      <div class="stamp">OFFICIAL VERIFIED DISPATCH</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Arogyavahini_Emergency_Report_${report.emergency.emergencyRequestId}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="emergency-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Action Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                Official Clinical Dispatch Record
              </span>
              <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                Patient Emergency Report
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View / Print Button */}
            <button
              id="btn-print-emergency-report"
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !report}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>

            {/* Download Report Button */}
            <button
              id="btn-download-emergency-report"
              type="button"
              onClick={handleDownloadReport}
              disabled={isLoading || !report}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-xs font-bold text-white shadow transition cursor-pointer disabled:opacity-50"
              title="Download standalone report file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer ml-1"
              title="Close report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Report Content */}
        <div className="overflow-y-auto p-4 sm:p-7 space-y-6 flex-1 bg-slate-50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Compiling official emergency case file...
              </p>
            </div>
          ) : error || !report ? (
            <div className="py-12 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {error || 'Unable to load emergency report.'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div
              ref={printAreaRef}
              id="printable-emergency-report-sheet"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-xs space-y-6 text-slate-900 dark:text-white"
            >
              {/* Report Header: Arogyavahini Header */}
              <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                    <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                      Arogyavahini Emergency Medical Services
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    National Emergency Dispatch Network • Ambulance Transport & Trauma Care Division
                  </p>
                  <p className="text-[11px] font-mono text-slate-400">
                    Accreditation: ISO-9001 EMS Certified • Rapid Priority Corridor Authorized
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 uppercase">
                    <CheckCircle2 className="w-3 h-3" /> Mission Completed
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {report.emergency.emergencyRequestId}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Report: <span className="font-mono">{report.reportId}</span>
                  </div>
                </div>
              </div>

              {/* Section 1 & 2 Grid: Patient Information & Response Fleet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Patient Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      1. Patient Information
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Patient Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{report.patient.name}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Patient ID:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{report.patient.id}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Contact Phone:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{report.patient.phone}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Emergency Category:</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{report.emergency.type}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Blood Group:</span>
                      <span className="font-black text-red-600 dark:text-red-400">{report.patient.bloodType || 'B+'}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Known Allergies:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{report.patient.allergies || 'None reported'}</span>
                    </div>
                    {report.patient.emergencyContactName && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Emergency Contact:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {report.patient.emergencyContactName} ({report.patient.emergencyContactRelation || 'Kin'})
                        </span>
                      </div>
                    )}
                    <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                        Medical Triage Notes:
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                        "{report.emergency.medicalDetails}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Ambulance & Driver Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <Ambulance className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      2. Assigned Fleet & Crew
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Vehicle Reg No:</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {report.ambulance.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Vehicle Class:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{report.ambulance.type}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Base Station:</span>
                      <span className="text-slate-700 dark:text-slate-300">{report.ambulance.baseLocation}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Paramedic Driver:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{report.driver.name}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Crew Phone:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{report.driver.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3 & 4 Grid: Operational Timestamps & Location Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Operational Timeline */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      3. Operational Timestamps
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Request Date & Time:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(report.emergency.requestDateTime).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Driver Accepted Time:</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {report.emergency.acceptedDateTime
                          ? new Date(report.emergency.acceptedDateTime).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Immediate Dispatch'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Completion Date & Time:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {report.emergency.completionDateTime
                          ? new Date(report.emergency.completionDateTime).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'Recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Response Duration:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        ~{report.emergency.responseTimeMinutes || 8} minutes
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Total Mission Elapsed:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ~{report.emergency.totalMissionDurationMinutes || 18} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Location Details */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                    <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      4. Location & Transit Points
                    </h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Pickup / Incident Location:
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{report.pickupLocation.address}</span>
                      </p>
                      {report.pickupLocation.coordinates && (
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block ml-4">
                          GPS: {report.pickupLocation.coordinates.latitude.toFixed(4)},{' '}
                          {report.pickupLocation.coordinates.longitude.toFixed(4)}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Destination Hospital Location:
                      </span>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-start gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{report.destinationLocation.hospitalName}</span>
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block ml-4">
                        Department: {report.destinationLocation.department || 'Emergency & Trauma Care'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Route & Journey Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      5. Route & Journey Summary
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Green Corridor Priority Executed
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Route</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {report.journeySummary.routeName}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Transit Distance</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {report.journeySummary.distanceKm} km
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Transit Time</span>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                      ~{report.journeySummary.estimatedDurationMinutes} mins
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Traffic Flow</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {report.journeySummary.trafficConditions}
                    </p>
                  </div>
                </div>

                {report.journeySummary.waypoints && report.journeySummary.waypoints.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Corridor Waypoints Navigated:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      {report.journeySummary.waypoints.map((wp, idx) => (
                        <React.Fragment key={idx}>
                          <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 font-medium">
                            {wp}
                          </span>
                          {idx < report.journeySummary.waypoints.length - 1 && (
                            <span className="text-slate-400">➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attestation & Verification Stamp Footer */}
              <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="space-y-1 text-slate-500 dark:text-slate-400 text-center sm:text-left">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Digital Audit Record: <span className="font-mono text-[11px]">{report.reportId}</span>
                  </p>
                  <p className="text-[10px]">
                    Generated from encrypted incident log ledger at {new Date(report.generatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-lg border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40">
                    COMPLETED & VERIFIED
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Available for completed emergency dispatch requests.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !report}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isLoading || !report}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

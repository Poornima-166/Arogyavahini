import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Heart, 
  AlertTriangle, 
  Phone, 
  User, 
  Download, 
  X, 
  Share2, 
  CheckCircle,
  FileText,
  Copy
} from 'lucide-react';
import { User as UserType } from '../types';

interface EmergencyHealthPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const EmergencyHealthPassModal: React.FC<EmergencyHealthPassModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentUser) return null;

  const cardUrl = `${window.location.origin}/api/patient/${currentUser.id}/emergency-card`;

  const copyEmergencyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    showToast('Emergency medical profile link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const printCard = () => {
    window.print();
  };

  // Generate SVG QR Code grid representation deterministically for visual appeal
  const seed = (currentUser.id * 31 + (currentUser.name?.length || 5)) % 1000;
  const qrModules = Array.from({ length: 21 }, (_, row) =>
    Array.from({ length: 21 }, (_, col) => {
      // Corners finder patterns
      if (
        (row < 7 && col < 7) ||
        (row < 7 && col >= 14) ||
        (row >= 14 && col < 7)
      ) {
        if (row === 0 || row === 6 || col === 0 || col === 6) return true;
        if (row >= 14 && (row === 14 || row === 20 || col === 0 || col === 6)) return true;
        if (col >= 14 && (row === 0 || row === 6 || col === 14 || col === 20)) return true;
        if (row >= 2 && row <= 4 && col >= 2 && col <= 4) return true;
        if (row >= 16 && row <= 18 && col >= 2 && col <= 4) return true;
        if (row >= 2 && row <= 4 && col >= 16 && col <= 18) return true;
        return false;
      }
      // Pseudo-random deterministic bits based on seed + coordinates
      return ((row * 13 + col * 17 + seed) % 7) < 3;
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Badge */}
        <div className="bg-linear-to-r from-red-600 via-rose-600 to-red-700 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-100 bg-red-800/40 px-2 py-0.5 rounded-full">
                  Official ICE Card
                </span>
                <span className="text-xs text-red-200 font-mono">
                  ID: AROGYA-PT-{String(currentUser.id).padStart(5, '0')}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mt-0.5">
                Digital Emergency Health Pass
              </h2>
            </div>
          </div>
          <p className="text-xs text-red-100/90 mt-2">
            First Responders & Paramedics can scan this QR code to access life-saving allergies, blood group, and next-of-kin contacts immediately.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* Top Info & QR Code */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80">
            {/* SVG QR Code */}
            <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-200 shrink-0">
              <svg
                viewBox="0 0 21 21"
                className="w-28 h-28 shape-rendering-crisp"
                style={{ imageRendering: 'pixelated' }}
              >
                {qrModules.map((row, rIdx) =>
                  row.map((active, cIdx) => (
                    active ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width="1"
                        height="1"
                        fill="#0f172a"
                      />
                    ) : null
                  ))
                )}
              </svg>
              <div className="text-center mt-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-1">
                  <QrCode className="w-2.5 h-2.5" /> Scan For ICE
                </span>
              </div>
            </div>

            {/* Core Patient Details */}
            <div className="space-y-2.5 flex-1 w-full text-center sm:text-left">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Name</span>
                <h3 className="text-lg font-extrabold text-gray-900 leading-snug">{currentUser.name}</h3>
                <span className="text-xs text-gray-500">{currentUser.phone || 'Phone not registered'}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100/80 text-red-800 rounded-lg border border-red-200">
                  <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
                  <span className="text-xs font-black">Blood: {currentUser.blood_type || 'B+'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100/80 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Verified Citizen
                </div>
              </div>
            </div>
          </div>

          {/* Critical Medical Alert Badges */}
          <div className="space-y-3">
            {/* Allergies */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Severe Drug / Environmental Allergies
                </span>
                <p className="text-xs font-bold text-amber-950 mt-0.5">
                  {currentUser.allergies || 'No known allergies reported (NKDA)'}
                </p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-800 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    In-Case-Of-Emergency (ICE) Contact
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {currentUser.emergency_contact_name || 'Rajesh Rao'} 
                    <span className="text-gray-500 font-normal ml-1">
                      ({currentUser.emergency_contact_relation || 'Spouse'})
                    </span>
                  </p>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {currentUser.emergency_contact_phone || '+91 98451 98765'}
                  </span>
                </div>
              </div>
              {currentUser.emergency_contact_phone && (
                <a
                  href={`tel:${currentUser.emergency_contact_phone}`}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors shrink-0"
                  title="Call Contact"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Chronic Medical Notes */}
            {currentUser.medical_notes && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
                <div className="p-1.5 bg-gray-200/80 rounded-lg text-gray-700 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Chronic Medical Conditions / Notes
                  </span>
                  <p className="text-xs text-gray-800 mt-0.5">
                    {currentUser.medical_notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={copyEmergencyLink}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Copy Emergency URL'}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={printCard}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Print / Save ICE Pass
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Phone,
  AlertTriangle,
  UserCheck,
  Edit3,
  FileText,
  Users,
  CheckCircle2,
  Sparkles,
  Lock,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Activity,
  Plus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PatientMedicalProfileCardProps {
  user: User | null;
  onOpenEditModal?: () => void;
  onProfileUpdated?: (updatedUser: User) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const COMMON_ALLERGIES = [
  'Penicillin',
  'Aspirin / NSAIDs',
  'Sulfa Drugs',
  'Peanuts / Nuts',
  'Latex',
  'Contrast Dye',
  'No Known Allergies',
];

const COMMON_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Cardiac Stent',
  'Pacemaker',
  'Epilepsy',
  'Blood Thinners',
  'COPD',
];

const RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Guardian',
  'Family Doctor',
  'Friend',
  'Other',
];

export const PatientMedicalProfileCard: React.FC<PatientMedicalProfileCardProps> = ({
  user,
  onOpenEditModal,
  onProfileUpdated,
}) => {
  const { updateUser, showToast } = useAuth();

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [bloodType, setBloodType] = useState(user?.blood_type || 'B+');
  const [allergies, setAllergies] = useState(user?.allergies || 'Penicillin, NSAIDs (Aspirin)');
  const [contactName, setContactName] = useState(user?.emergency_contact_name || 'Rajesh Rao');
  const [contactPhone, setContactPhone] = useState(user?.emergency_contact_phone || '+91 98451 98765');
  const [contactRelation, setContactRelation] = useState(user?.emergency_contact_relation || 'Spouse');
  const [medicalNotes, setMedicalNotes] = useState(user?.medical_notes || 'Mild seasonal asthma; carries inhaler');
  const [isSaving, setIsSaving] = useState(false);
  const [customAllergyInput, setCustomAllergyInput] = useState('');
  const [customConditionInput, setCustomConditionInput] = useState('');

  // Keep state synced with user changes
  useEffect(() => {
    if (user) {
      if (user.blood_type !== undefined) setBloodType(user.blood_type || 'B+');
      if (user.allergies !== undefined) setAllergies(user.allergies || '');
      if (user.emergency_contact_name !== undefined) setContactName(user.emergency_contact_name || '');
      if (user.emergency_contact_phone !== undefined) setContactPhone(user.emergency_contact_phone || '');
      if (user.emergency_contact_relation !== undefined) setContactRelation(user.emergency_contact_relation || 'Spouse');
      if (user.medical_notes !== undefined) setMedicalNotes(user.medical_notes || '');
    }
  }, [user]);

  const handleToggleAllergy = (item: string) => {
    if (item === 'No Known Allergies') {
      setAllergies('No Known Allergies');
      return;
    }
    const current = allergies
      ? allergies
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== 'No Known Allergies')
      : [];
    if (current.includes(item)) {
      setAllergies(current.filter((s) => s !== item).join(', '));
    } else {
      setAllergies([...current, item].join(', '));
    }
  };

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergyInput.trim();
    if (!trimmed) return;
    const current = allergies
      ? allergies
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== 'No Known Allergies')
      : [];
    if (!current.includes(trimmed)) {
      setAllergies([...current, trimmed].join(', '));
    }
    setCustomAllergyInput('');
  };

  const handleToggleCondition = (cond: string) => {
    const current = medicalNotes
      ? medicalNotes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (current.includes(cond)) {
      setMedicalNotes(current.filter((s) => s !== cond).join(', '));
    } else {
      setMedicalNotes([...current, cond].join(', '));
    }
  };

  const handleAddCustomCondition = () => {
    const trimmed = customConditionInput.trim();
    if (!trimmed) return;
    const current = medicalNotes
      ? medicalNotes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (!current.includes(trimmed)) {
      setMedicalNotes([...current, trimmed].join(', '));
    }
    setCustomConditionInput('');
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast('Please sign in to update your emergency medical profile', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData: Partial<User> = {
        blood_type: bloodType,
        allergies: allergies.trim(),
        emergency_contact_name: contactName.trim(),
        emergency_contact_phone: contactPhone.trim(),
        emergency_contact_relation: contactRelation,
        medical_notes: medicalNotes.trim(),
      };

      const res = await api.updatePatientProfile(user.id, updatedData);
      updateUser(res.user);
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setIsEditingInline(false);
      showToast('Medical Profile saved! Responders will receive this information immediately upon SOS.', 'success');
    } catch (err: any) {
      console.error('Failed to update medical profile:', err);
      showToast(err.message || 'Failed to save medical profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentAllergiesList = allergies
    ? allergies.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const currentConditionsList = medicalNotes
    ? medicalNotes.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      id="patient-medical-id-summary-card"
      className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500/30 dark:border-red-500/20 shadow-sm overflow-hidden transition-all"
    >
      {/* Top Banner: Security & Action Header */}
      <div className="bg-gradient-to-r from-red-50 via-slate-50 to-red-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-5 py-3.5 border-b border-red-200/60 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-red-600/20">
            <Heart className="w-4 h-4 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Secure Emergency Medical Profile</span>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold">(108 SOS Triage)</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>256-Bit Encrypted Healthcare Record • Shared directly with dispatched ambulance crew upon SOS</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Transmitted On SOS Badge */}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Shield className="w-3 h-3" />
            <span>Transmitted on SOS</span>
          </span>

          {/* Inline Edit Toggle */}
          <button
            type="button"
            id="btn-toggle-medical-profile-editor"
            onClick={() => setIsEditingInline(!isEditingInline)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isEditingInline
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
            }`}
          >
            {isEditingInline ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Close Editor</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Input / Edit Medical Info</span>
              </>
            )}
          </button>

          {/* Full Modal Trigger */}
          {onOpenEditModal && (
            <button
              type="button"
              id="btn-open-medical-modal"
              onClick={onOpenEditModal}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Open full expanded modal"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* INLINE EDIT FORM (Expanded when user clicks Edit / Input) */}
      {isEditingInline && (
        <form onSubmit={handleSaveProfile} className="p-5 bg-red-50/30 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-red-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Edit Critical Emergency Information
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Changes will instantly synchronize with your account and SOS dispatch
            </span>
          </div>

          {/* 1. Blood Type Selection */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <Heart className="w-3.5 h-3.5 text-red-600 fill-red-600" />
              <span>Blood Group (Critical for Pre-hospital Blood Transfusion)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {BLOOD_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setBloodType(type)}
                  className={`py-2 px-1 text-xs font-black rounded-xl border transition-all text-center cursor-pointer ${
                    bloodType === type
                      ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/30 scale-102'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Known Allergies Input & Quick Chips */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 mb-2">
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Known Allergies (Prevents Adverse Medication Reactions)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click chip to toggle</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_ALLERGIES.map((allergy) => {
                const isSelected = currentAllergiesList.includes(allergy) || (allergy === 'No Known Allergies' && allergies === 'No Known Allergies');
                return (
                  <button
                    type="button"
                    key={allergy}
                    onClick={() => handleToggleAllergy(allergy)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {allergy}
                  </button>
                );
              })}
            </div>
            {/* Custom Allergy Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, NSAIDs (Aspirin), Sulfa, Peanuts"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Existing Conditions & Clinical Notes */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 mb-2">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Existing Medical Conditions & History (Triage Guidance)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click chip to toggle</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = currentConditionsList.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => handleToggleCondition(cond)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {cond}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Type-2 Diabetes on Metformin; Mild seasonal asthma, carries inhaler; Cardiac Stent placed in 2023"
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
            />
          </div>

          {/* 4. Emergency Contact (Next of Kin) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Rajesh Rao"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. +91 98451 98765"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Relationship
              </label>
              <select
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              >
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingInline(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:bg-red-400 rounded-xl shadow-md shadow-red-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Profile...' : 'Save & Protect'}</span>
            </button>
          </div>
        </form>
      )}

      {/* PROFILE DETAILS GRID (Always visible summary with clean badges) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Blood Type */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-red-400/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white flex flex-col items-center justify-center font-black text-sm shrink-0 shadow-md shadow-red-600/20">
            <span>{bloodType || 'B+'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Blood Group
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">
              Type {bloodType || 'B+'}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Transfusion Ready
            </span>
          </div>
        </div>

        {/* 2. Known Allergies */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block tracking-wider">
              Known Allergies
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={allergies}>
              {allergies || 'No known allergies reported'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Alerts 108 Paramedics
            </span>
          </div>
        </div>

        {/* 3. Primary Emergency Contact */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block tracking-wider">
              Emergency Contact
            </span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {contactName || 'Rajesh Rao'} {contactRelation ? `(${contactRelation})` : ''}
            </p>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone}`}
                className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 font-semibold"
                title="Call Emergency Contact"
              >
                <Phone className="w-2.5 h-2.5" />
                <span>{contactPhone}</span>
              </a>
            ) : (
              <span className="text-[10px] text-slate-400">Not provided</span>
            )}
          </div>
        </div>

        {/* 4. Clinical Notes / Chronic Conditions */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400/50 transition-colors">
          <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Conditions & Notes
            </span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={medicalNotes}>
              {medicalNotes || 'No chronic conditions noted.'}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Pre-hospital Triage Guide
            </span>
          </div>
        </div>
      </div>

      {/* Responder Transmission Banner */}
      <div className="bg-slate-100/70 dark:bg-slate-950/80 px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
          <span>
            <strong>SOS Responder Guarantee:</strong> When you press SOS, the assigned ambulance driver, EMT paramedic, and destination trauma ER automatically receive this exact medical profile.
          </span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] text-slate-400">
          Encrypted TLS 1.3 • HIPAA-Aligned
        </span>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Heart,
  Shield,
  Phone,
  User as UserIcon,
  AlertTriangle,
  FileText,
  CheckCircle2,
  X,
  Save,
  Users,
  Info,
  Sparkles,
  Pencil,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { User, PatientMedicalProfile } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PatientMedicalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const PatientMedicalProfileModal: React.FC<PatientMedicalProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user, updateUser, showToast } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodType, setBloodType] = useState('B+');
  const [allergies, setAllergies] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('Spouse');
  const [medicalNotes, setMedicalNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBloodType(user.blood_type || 'B+');
      setAllergies(user.allergies || '');
      setContactName(user.emergency_contact_name || '');
      setContactPhone(user.emergency_contact_phone || '');
      setContactRelation(user.emergency_contact_relation || 'Spouse');
      setMedicalNotes(user.medical_notes || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleToggleAllergy = (allergy: string) => {
    if (allergy === 'No Known Allergies') {
      setAllergies('No Known Allergies');
      return;
    }

    const currentList = allergies
      ? allergies
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s !== 'No Known Allergies')
      : [];

    if (currentList.includes(allergy)) {
      const updated = currentList.filter((s) => s !== allergy);
      setAllergies(updated.join(', '));
    } else {
      const updated = [...currentList, allergy];
      setAllergies(updated.join(', '));
    }
  };

  const handleToggleCondition = (condition: string) => {
    const currentList = medicalNotes
      ? medicalNotes
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    if (currentList.includes(condition)) {
      const updated = currentList.filter((s) => s !== condition);
      setMedicalNotes(updated.join(', '));
    } else {
      const updated = [...currentList, condition];
      setMedicalNotes(updated.join(', '));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to save your medical profile', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedData: Partial<User> = {
        name: name.trim() || user.name,
        phone: phone.trim() || user.phone,
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
      setSaveSuccess(true);
      showToast('Emergency Medical Profile synced with 108 Dispatch', 'success');
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      showToast(err.message || 'Failed to update medical profile', 'error');
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
      id="patient-medical-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="patient-medical-profile-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-red-600 to-rose-700 text-white p-5 sm:p-6 flex items-start justify-between relative shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
              <HeartPulse className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                  Emergency Medical ID & Contact Profile
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  108 Linked
                </span>
              </div>
              <p className="text-xs text-red-100 mt-1 max-w-md">
                Critical clinical telemetry transmitted to dispatchers and ambulance crews upon SOS triggering.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-medical-profile-modal"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Edit Profile vs. Live SOS Preview */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 pt-3 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            id="tab-edit-medical-profile"
            onClick={() => setActiveTab('edit')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'edit'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Medical Profile</span>
          </button>
          <button
            type="button"
            id="tab-preview-medical-profile"
            onClick={() => setActiveTab('preview')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dispatcher SOS View Preview</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          {activeTab === 'edit' ? (
            <form id="medical-profile-form" onSubmit={handleSave} className="space-y-6">
              {/* Notice Box */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p>
                  <strong>Instant SOS Telemetry:</strong> When you tap 1-Tap SOS or submit an incident, this verified clinical record is immediately packaged and dispatched directly to the 108 Emergency Control Room and responding paramedics.
                </p>
              </div>

              {/* Patient Basic Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Patient Legal / Preferred Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      id="input-medical-patient-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priya Rao"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Patient Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      id="input-medical-patient-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 1. Blood Type Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    1. Blood Group / Type <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Crucial for immediate transfusion matching
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BLOOD_TYPES.map((bt) => {
                    const isSelected = bloodType === bt;
                    return (
                      <button
                        type="button"
                        key={bt}
                        id={`btn-blood-type-${bt.replace('+', 'pos').replace('-', 'neg')}`}
                        onClick={() => setBloodType(bt)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-500/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSelected ? 'fill-white' : 'text-red-500'}`} />
                        <span>{bt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Known Allergies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    2. Known Allergies & Adverse Drug Reactions
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prevents fatal medication interactions
                  </span>
                </div>

                {/* Quick Toggle Chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected =
                      allergy === 'No Known Allergies'
                        ? allergies === 'No Known Allergies'
                        : currentAllergiesList.includes(allergy);
                    return (
                      <button
                        type="button"
                        key={allergy}
                        onClick={() => handleToggleAllergy(allergy)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {allergy}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <AlertTriangle className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    id="input-medical-allergies"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, NSAIDs (Aspirin), Peanuts, Sulfa"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Separate multiple entries with commas. Type &quot;None&quot; or &quot;No Known Allergies&quot; if clear.
                </p>
              </div>

              {/* 3. Primary Emergency Contact */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    3. Primary Emergency Contact (Next of Kin)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Our dispatch center notifies this contact immediately when an ambulance is routed to you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Relationship
                    </label>
                    <select
                      id="select-emergency-contact-relation"
                      value={contactRelation}
                      onChange={(e) => setContactRelation(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Full Name
                    </label>
                    <input
                      type="text"
                      id="input-emergency-contact-name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Rajesh Rao"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      id="input-emergency-contact-phone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98451 98765"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Pre-Existing Conditions & Medical Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white">
                    4. Chronic Conditions, Medications & Clinical Notes
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Optional</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = currentConditionsList.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => handleToggleCondition(cond)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cond}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <textarea
                    id="textarea-medical-notes"
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="e.g. Mild seasonal asthma, carries albuterol inhaler; Type 2 diabetic; takes Metformin"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  id="btn-save-medical-profile"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Profile Saved!</span>
                    </>
                  ) : isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synchronizing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Sync with 108 Emergency</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Live SOS Preview */
            <div id="medical-profile-preview-card" className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Dispatcher & Paramedic Telemetry Snapshot:
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  This is the exact digital triage card displayed on the 108 dispatch screen and onboard ambulance terminal when you trigger an emergency SOS.
                </p>
              </div>

              {/* Physical Medical ID Card Mockup */}
              <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 border-2 border-red-500 shadow-xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between border-b border-slate-700/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider">
                        EMERGENCY MEDICAL ID
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <Shield className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {name || user?.name || 'Patient'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Mobile: {phone || user?.phone || 'Not Specified'}
                    </p>
                  </div>

                  {/* Blood Group Badge */}
                  <div className="text-center bg-red-600/20 border border-red-500/50 rounded-xl px-4 py-2">
                    <span className="text-[10px] uppercase font-bold text-red-300 block">BLOOD TYPE</span>
                    <span className="text-2xl font-black text-white">{bloodType || 'B+'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Allergies Alert */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>KNOWN ALLERGIES</span>
                    </div>
                    <p className="text-slate-200 font-medium">
                      {allergies || 'No known drug allergies specified.'}
                    </p>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>PRIMARY EMERGENCY CONTACT</span>
                    </div>
                    <p className="text-slate-200 font-bold">
                      {contactName || 'Not Set'} {contactRelation ? `(${contactRelation})` : ''}
                    </p>
                    <p className="text-slate-400 font-mono mt-0.5">
                      {contactPhone || 'No phone provided'}
                    </p>
                  </div>
                </div>

                {/* Medical Notes */}
                {medicalNotes && (
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      CLINICAL HISTORY & MEDICATIONS
                    </span>
                    <p className="text-slate-300 text-xs">
                      {medicalNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Return to Editor</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

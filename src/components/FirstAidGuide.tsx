import React, { useState } from 'react';
import { Heart, Activity, AlertTriangle, ShieldAlert, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const FirstAidGuide: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('cpr');

  const toggle = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const guides = [
    {
      id: 'cpr',
      title: 'CPR (Cardiopulmonary Resuscitation)',
      category: 'Cardiac & Breathing',
      icon: Heart,
      color: 'text-rose-600 bg-rose-50',
      steps: [
        'Place the heel of one hand in the center of the chest, and place the other hand on top, interlocking fingers.',
        'Push hard and fast: 100 to 120 compressions per minute at a depth of 2 to 2.4 inches (5 to 6 cm).',
        'Allow chest to recoil fully between compressions.',
        'If trained, give 2 rescue breaths after every 30 compressions. If untrained, continue Hands-Only CPR continuously until paramedics arrive.',
      ],
      tip: 'Rhythm hint: Push to the beat of "Stayin\' Alive" by the Bee Gees.',
    },
    {
      id: 'fast',
      title: 'Stroke Identification (FAST Protocol)',
      category: 'Neurological',
      icon: Activity,
      color: 'text-amber-600 bg-amber-50',
      steps: [
        'F - Face Drooping: Ask the person to smile. Does one side of the face droop or feel numb?',
        'A - Arm Weakness: Ask the person to raise both arms. Does one arm drift downward or feel weak?',
        'S - Speech Difficulty: Ask the person to repeat a simple phrase. Is their speech slurred or strange?',
        'T - Time to Act: Note the exact time symptoms began and inform the arriving ambulance crew immediately.',
      ],
      tip: 'Do not give the patient aspirin or food until evaluated by hospital doctors.',
    },
    {
      id: 'bleeding',
      title: 'Severe Bleeding & Trauma Control',
      category: 'Trauma',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      steps: [
        'Apply firm, direct pressure on the bleeding wound with a clean cloth, sterile gauze, or clothing.',
        'Keep continuous firm pressure for at least 5-10 minutes without lifting to check.',
        'If blood soaks through, add another cloth on top—do not remove the original dressing.',
        'If bleeding is in an arm or leg and direct pressure is insufficient, elevate the limb above heart level.',
      ],
      tip: 'Keep the patient warm and calm to prevent shock.',
    },
    {
      id: 'choking',
      title: 'Choking & Airway Blockage',
      category: 'Respiratory',
      icon: ShieldAlert,
      color: 'text-blue-600 bg-blue-50',
      steps: [
        'Stand behind the person, wrap your arms around their waist, and lean them slightly forward.',
        'Make a fist with one hand and place it just above the navel.',
        'Grasp your fist with your other hand and deliver quick, upward abdominal thrusts (Heimlich Maneuver).',
        'Repeat thrusts until the blockage is dislodged or person breathes freely.',
      ],
      tip: 'If the person becomes unresponsive, lower them to the floor and begin CPR immediately.',
    },
  ];

  return (
    <div id="first-aid-guide-widget" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 bg-[#0f172a] text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Immediate First-Aid Protocols</h3>
            <p className="text-xs text-slate-400">Actionable guidance while ambulance is en route</p>
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
          Emergency Care
        </span>
      </div>

      <div className="divide-y divide-slate-100 p-2 sm:p-3">
        {guides.map((item) => {
          const Icon = item.icon;
          const isOpen = openSection === item.id;

          return (
            <div key={item.id} className="py-1">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                    <span className="text-[11px] text-slate-500">{item.category}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="mt-1 px-3 pb-3 pt-2 text-xs text-slate-600 bg-slate-50/70 rounded-xl space-y-2 border border-slate-100">
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-700">
                    {item.steps.map((step, i) => (
                      <li key={i} className="pl-1">
                        <span className="font-medium text-slate-800">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {item.tip && (
                    <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium text-[11px]">
                      💡 {item.tip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

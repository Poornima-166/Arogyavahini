import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Heart, Activity, AlertTriangle, ShieldAlert, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const FirstAidGuide: React.FC = () => {
  const { language, t } = useLanguage();
  const [openSection, setOpenSection] = useState<string | null>('cpr');

  const toggle = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const firstAidData = {
    en: [
      {
        id: 'cpr',
        title: 'CPR (Cardiopulmonary Resuscitation)',
        category: 'Cardiac & Breathing Emergency',
        icon: Heart,
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
        steps: [
          'Place heel of one hand in the center of the chest; place other hand on top, interlocking fingers.',
          'Push hard and fast: 100 to 120 compressions per minute at a depth of 5 to 6 cm (2 inches).',
          'Allow chest to recoil fully between compressions.',
          'Continue continuous chest compressions without stopping until paramedics arrive.',
        ],
        tip: 'Rhythm hint: Push to the beat of "Stayin\' Alive" or 2 beats per second.',
      },
      {
        id: 'fast',
        title: 'Stroke FAST Identification Protocol',
        category: 'Neurological Emergency',
        icon: Activity,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        steps: [
          'F - Face Drooping: Ask person to smile. Does one side of the face droop?',
          'A - Arm Weakness: Ask person to raise both arms. Does one arm drift downward?',
          'S - Speech Difficulty: Ask person to repeat a simple phrase. Is speech slurred?',
          'T - Time to Act: Note exact time symptoms began and alert the arriving ambulance crew.',
        ],
        tip: 'Do not administer food, water, or aspirin before medical evaluation.',
      },
      {
        id: 'bleeding',
        title: 'Severe Bleeding & Trauma Control',
        category: 'Trauma & Hemorrhage',
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
        steps: [
          'Apply firm, continuous direct pressure on the wound with clean cloth or sterile gauze.',
          'Maintain pressure for at least 5 to 10 minutes without lifting to inspect.',
          'If blood soaks through, add another cloth on top—do not remove the original dressing.',
          'If injury is on a limb, elevate above heart level while maintaining pressure.',
        ],
        tip: 'Keep patient calm and warm with a blanket to prevent shock.',
      },
      {
        id: 'choking',
        title: 'Choking & Airway Clearance',
        category: 'Respiratory Blockage',
        icon: ShieldAlert,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
        steps: [
          'Stand behind the person, wrap your arms around their waist, and lean them forward.',
          'Make a fist with one hand and place it just above the navel.',
          'Grasp your fist with your other hand and deliver quick, upward abdominal thrusts.',
          'Repeat until airway blockage is cleared and normal breathing resumes.',
        ],
        tip: 'If person becomes unconscious, lower gently to floor and begin chest compressions immediately.',
      },
    ],
    kn: [
      {
        id: 'cpr',
        title: 'ಸಿಪಿಆರ್ (ಹೃದಯ ಮತ್ತು ಉಸಿರಾಟ ಪುನಶ್ಚೇತನ)',
        category: 'ಹೃದಯ ಮತ್ತು ಉಸಿರಾಟದ ತುರ್ತುಸ್ಥಿತಿ',
        icon: Heart,
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
        steps: [
          'ಎದೆಯ ಮಧ್ಯಭಾಗದಲ್ಲಿ ಒಂದು ಅಂಗೈ ಇರಿಸಿ, ಇನ್ನೊಂದು ಕೈಯನ್ನು ಅದರ ಮೇಲಿಟ್ಟು ಬೆರಳುಗಳನ್ನು ಜೋಡಿಸಿ.',
          'ಪ್ರತಿ ನಿಮಿಷಕ್ಕೆ 100 ರಿಂದ 120 ಬಾರಿ ವೇಗವಾಗಿ ಮತ್ತು 5 ರಿಂದ 6 ಸೆಂ.ಮೀ ಆಳಕ್ಕೆ ಒತ್ತಿರಿ.',
          'ಪ್ರತಿ ಒತ್ತಡದ ನಂತರ ಎದೆಯು ಮೊದಲಿನ ಸ್ಥಿತಿಗೆ ಬರಲು ಬಿಡಿ.',
          'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಬರುವವರೆಗೂ ಎದೆಯ ಒತ್ತಡವನ್ನು ನಿಲ್ಲಿಸದೆ ಮುಂದುವರಿಸಿ.',
        ],
        tip: 'ಸಲಹೆ: ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ 2 ಬಾರಿ ನಿಯಮಿತ ಲಯದಲ್ಲಿ ಎದೆಯೊತ್ತಡ ನೀಡಿ.',
      },
      {
        id: 'fast',
        title: 'ಪಾರ್ಶ್ವವಾಯು (ಸ್ಟ್ರೋಕ್) ಪತ್ತೆ FAST ಸೂತ್ರ',
        category: 'ನರವಿಜ್ಞಾನ ತುರ್ತುಸ್ಥಿತಿ',
        icon: Activity,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        steps: [
          'F - ಮುಖ: ಮುಗುಳ್ನಗಲು ಹೇಳಿ. ಮುಖದ ಒಂದು ಬದಿ ವಾಲುತ್ತಿದೆಯೇ?',
          'A - ತೋಳು: ಎರಡೂ ತೋಳುಗಳನ್ನು ಮೇಲಕ್ಕೆತ್ತಲು ಹೇಳಿ. ಒಂದು ತೋಳು ಕೆಳಗೆ ಜಾರುತ್ತಿದೆಯೇ?',
          'S - ಮಾತು: ಸರಳ ವಾಕ್ಯ ಹೇಳಲು ತಿಳಿಸಿ. ಮಾತು ತೊದಲುತ್ತಿದೆಯೇ?',
          'T - ಸಮಯ: ರೋಗಲಕ್ಷಣಗಳು ಪ್ರಾರಂಭವಾದ ಸಮಯವನ್ನು ನೆನಪಿಟ್ಟುಕೊಂಡು ಸಿಬ್ಬಂದಿಗೆ ತಿಳಿಸಿ.',
        ],
        tip: 'ವೈದ್ಯರ ತಪಾಸಣೆಯಾಗುವವರೆಗೆ ರೋಗಿಗೆ ಯಾವುದೇ ಆಹಾರ, ನೀರು ಅಥವಾ ಮಾತ್ರೆಗಳನ್ನು ನೀಡಬೇಡಿ.',
      },
      {
        id: 'bleeding',
        title: 'ತೀವ್ರ ರಕ್ತಸ್ರಾವ ನಿಯಂತ್ರಣ',
        category: 'ಗಾಯ ಮತ್ತು ರಕ್ತಸ್ರಾವ',
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
        steps: [
          'ಗಾಯದ ಮೇಲೆ ಸ್ವಚ್ಛವಾದ ಬಟ್ಟೆ ಅಥವಾ ಬ್ಯಾಂಡೇಜ್ ಇಟ್ಟು ಗಟ್ಟಿಯಾಗಿ ಒತ್ತಿ ಹಿಡಿಯಿರಿ.',
          'ಕನಿಷ್ಠ 5 ರಿಂದ 10 ನಿಮಿಷಗಳ ಕಾಲ ಒತ್ತಡವನ್ನು ತೆಗೆಯದೆ ಹಾಗೆಯೇ ಹಿಡಿದುಕೊಳ್ಳಿ.',
          'ರಕ್ತ ಬಟ್ಟೆಯಿಂದ ಹೊರಬಂದರೆ, ಅದರ ಮೇಲೆಯೇ ಮತ್ತೊಂದು ಬಟ್ಟೆ ಇರಿಸಿ - ಹಳೆಯ ಬಟ್ಟೆ ತೆಗೆಯಬೇಡಿ.',
          'ಗಾಯವು ಕೈ ಅಥವಾ ಕಾಲಿನಲ್ಲಿದ್ದರೆ, ಹೃದಯದ ಮಟ್ಟಕ್ಕಿಂತ ಮೇಲಕ್ಕೆತ್ತಿ ಹಿಡಿಯಿರಿ.',
        ],
        tip: 'ರೋಗಿಗೆ ನಡುಕ ಬಾರದಂತೆ ಬೆಚ್ಚನೆಯ ಹೊದಿಕೆ ಹೊದಿಸಿ ಶಾಂತವಾಗಿರಿಸಿ.',
      },
      {
        id: 'choking',
        title: 'ಉಸಿರುಗಟ್ಟುವಿಕೆ (ಚೋಕಿಂಗ್)',
        category: 'ಉಸಿರಾಟದ ಅಡಚಣೆ',
        icon: ShieldAlert,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
        steps: [
          'ವ್ಯಕ್ತಿಯ ಹಿಂದೆ ನಿಂತು ಅವರ ಸೊಂಟದ ಸುತ್ತ ನಿಮ್ಮ ಕೈಗಳನ್ನು ಸುತ್ತಿಕೊಳ್ಳಿ ಮತ್ತು ಅವರನ್ನು ಮುಂದಕ್ಕೆ ಬಗ್ಗಿಸಿ.',
          'ಒಂದು ಕೈಯಿಂದ ಮುಷ್ಟಿ ಮಾಡಿ ಹೊಕ್ಕುಳಿನ ಮೇಲ್ಭಾಗದಲ್ಲಿ ಇರಿಸಿ.',
          'ಇನ್ನೊಂದು ಕೈಯಿಂದ ಮುಷ್ಟಿಯನ್ನು ಹಿಡಿದು ವೇಗವಾಗಿ ಮೇಲ್ಮುಖವಾಗಿ ಒತ್ತಿರಿ (ಹೈಮ್ಲಿಕ್ ವಿಧಾನ).',
          'ಉಸಿರಾಟ ಸಹಜವಾಗುವವರೆಗೆ ಈ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪುನರಾವರ್ತಿಸಿ.',
        ],
        tip: 'ವ್ಯಕ್ತಿ ಪ್ರಜ್ಞಾಹೀನರಾದರೆ, ತಕ್ಷಣ ನೆಲದ ಮೇಲೆ ಮಲಗಿಸಿ ಸಿಪಿಆರ್ ಪ್ರಾರಂಭಿಸಿ.',
      },
    ],
    hi: [
      {
        id: 'cpr',
        title: 'सीपीआर (हृदय और श्वसन पुनर्जीवन)',
        category: 'हृदय और सांस की आपात स्थिति',
        icon: Heart,
        color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
        steps: [
          'छाती के केंद्र में एक हाथ की हथेली रखें; दूसरा हाथ ऊपर रखकर उंगलियों को आपस में फंसाएं।',
          'तेजी से और जोर से दबाएं: 100 से 120 प्रति मिनट की गति से 5-6 सेमी गहराई तक छाती दबाएं।',
          'हर दबाव के बाद छाती को पूरी तरह वापस ऊपर आने दें।',
          'एम्बुलेंस आने तक बिना रुके लगातार छाती दबाते रहें।',
        ],
        tip: 'सलाह: प्रति सेकंड 2 बार की गति से निरंतर दबाव जारी रखें।',
      },
      {
        id: 'fast',
        title: 'स्ट्रोक पहचान (FAST प्रोटोकॉल)',
        category: 'न्यूरोलॉजिकल आपातकाल',
        icon: Activity,
        color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        steps: [
          'F - चेहरा: मुस्कुराने को कहें। क्या चेहरे का एक हिस्सा झुक रहा है?',
          'A - हाथ: दोनों हाथ उठाने को कहें। क्या एक हाथ नीचे गिर रहा है?',
          'S - बोली: एक साधारण वाक्य दोहराने को कहें। क्या बोली लड़खड़ा रही है?',
          'T - समय: लक्षण शुरू होने का सटीक समय नोट करें और एम्बुलेंस दल को बताएं।',
        ],
        tip: 'डॉक्टर की जांच से पहले मरीज को कोई खाना, पानी या दवा न दें।',
      },
      {
        id: 'bleeding',
        title: 'गंभीर रक्तस्राव और आघात नियंत्रण',
        category: 'ट्रॉमा एवं रक्तस्राव',
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
        steps: [
          'घाव पर साफ कपड़े या पट्टी से लगातार मजबूत सीधा दबाव बनाएं।',
          'कम से कम 5 से 10 मिनट तक बिना हटाए लगातार दबाव बनाए रखें।',
          'यदि खून कपड़े से रिसता है, तो उसके ऊपर दूसरा कपड़ा रखें—पहला कपड़ा न हटाएं।',
          'यदि चोट हाथ या पैर में है, तो दबाव बनाए रखते हुए उसे हृदय स्तर से ऊपर उठाएं।',
        ],
        tip: 'मरीज को शांत रखें और ठंड से बचाने के लिए कंबल ओढ़ाएं।',
      },
      {
        id: 'choking',
        title: 'गला घुटने पर प्राथमिक उपचार',
        category: 'श्वसन अवरोध',
        icon: ShieldAlert,
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
        steps: [
          'व्यक्ति के पीछे खड़े होकर अपनी बाहों को उसकी कमर के चारों ओर लपेटें और उसे थोड़ा आगे झुकाएं।',
          'एक हाथ से मुट्ठी बनाकर नाभि के ठीक ऊपर रखें।',
          'दूसरे हाथ से मुट्ठी पकड़कर तेजी से ऊपर की ओर पेट पर दबाव डालें (हाइमलिक प्रहार)।',
          'जब तक अटका हुआ पदार्थ बाहर न निकल जाए, तब तक दोहराएं।',
        ],
        tip: 'यदि व्यक्ति बेहोश हो जाए, तो तुरंत फर्श पर लिटाकर सीपीआर शुरू करें।',
      },
    ],
  };

  const guides = firstAidData[language] || firstAidData.en;

  return (
    <div id="first-aid-guide-widget" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 bg-[#0f172a] dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">{t.patientFirstAidTitle}</h3>
            <p className="text-xs text-slate-400">{t.patientFirstAidSubtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-900 text-amber-400 border border-slate-700">
          First Aid
        </span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-3">
        {guides.map((item) => {
          const Icon = item.icon;
          const isOpen = openSection === item.id;

          return (
            <div key={item.id} className="py-1">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.category}</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {isOpen && (
                <div className="mt-1 px-3 pb-3 pt-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700/60">
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-700 dark:text-slate-200">
                    {item.steps.map((step, i) => (
                      <li key={i} className="pl-1">
                        <span className="font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {item.tip && (
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 font-medium text-[11px]">
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

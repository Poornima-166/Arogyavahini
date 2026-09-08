import React, { useState } from 'react';
import { EmergencyRequest, AmbulanceRatingInput } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Star, 
  Truck, 
  User, 
  Send, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  HeartHandshake, 
  Sparkles,
  X,
  MessageSquare
} from 'lucide-react';

interface AmbulanceRatingCardProps {
  emergency: EmergencyRequest;
  onRatingSubmitted?: (updatedEmergency: EmergencyRequest) => void;
  onDismiss?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const AmbulanceRatingCard: React.FC<AmbulanceRatingCardProps> = ({
  emergency,
  onRatingSubmitted,
  onDismiss,
  className = '',
  isCompact = false,
}) => {
  const { showToast } = useAuth();
  const { language } = useLanguage();

  // If already rated previously, initialize with existing values
  const hasExistingRating = Boolean(emergency.rating_submitted_at || emergency.rating_speed_stars);

  const [speedStars, setSpeedStars] = useState<number>(emergency.rating_speed_stars || 5);
  const [serviceStars, setServiceStars] = useState<number>(emergency.rating_service_stars || 5);
  const [hoverSpeed, setHoverSpeed] = useState<number | null>(null);
  const [hoverService, setHoverService] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(emergency.rating_feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(hasExistingRating);

  // Quick feedback suggestion pills
  const QUICK_TAGS = [
    { en: 'Rapid Arrival', kn: 'ವೇಗದ ಆಗಮನ', hi: 'तेज़ आगमन' },
    { en: 'Compassionate Care', kn: 'ಆತ್ಮೀಯ ಆರೈಕೆ', hi: 'सहानुभूतिपूर्ण देखभाल' },
    { en: 'Smooth Transport', kn: 'ಸುಲಭ ಸಾಗಣೆ', hi: 'सुगम परिवहन' },
    { en: 'Skilled Paramedics', kn: 'ಕುಶಲ ಅರೆವೈದ್ಯರು', hi: 'कुशल पैरामेडिक्स' },
    { en: 'Well Equipped', kn: 'ಉತ್ತಮ ಉಪಕರಣಗಳು', hi: 'सुसज्जित एम्बुलेंस' },
  ];

  const getSpeedLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return language === 'kn' ? 'ಅತ್ಯಂತ ವೇಗದ ಸ್ಪಂದನೆ (< 8 ನಿಮಿಷ)' : language === 'hi' ? 'बेहद तेज़ प्रतिक्रिया (< 8 मिनट)' : 'Lightning Fast Arrival (< 8 mins)';
      case 4:
        return language === 'kn' ? 'ಸಮಯೋಚಿತ ಆಗಮನ' : language === 'hi' ? 'समय पर आगमन' : 'Prompt & Timely Response';
      case 3:
        return language === 'kn' ? 'ಸಾಧಾರಣ ಸಮಯ' : language === 'hi' ? 'सामान्य समय' : 'Moderate / Acceptable Time';
      case 2:
        return language === 'kn' ? 'ನಿರೀಕ್ಷೆಗಿಂತ ತಡ' : language === 'hi' ? 'अपेक्षा से धीमा' : 'Slower than Expected';
      case 1:
        return language === 'kn' ? 'ಗಣನೀಯ ವಿಳಂಬ' : language === 'hi' ? 'काफी देरी' : 'Significant Delay';
      default:
        return '';
    }
  };

  const getServiceLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return language === 'kn' ? 'ಅತ್ಯುತ್ತಮ ಮತ್ತು ಕಾಳಜಿಯುಕ್ತ ಸೇವೆ' : language === 'hi' ? 'उत्कृष्ट और करुणामयी सेवा' : 'Outstanding & Compassionate Care';
      case 4:
        return language === 'kn' ? 'ವೃತ್ತಿಪರ ಹಾಗೂ ಜವಾಬ್ದಾರಿಯುತ' : language === 'hi' ? 'पेशेवर और मददगार' : 'Attentive & Professional';
      case 3:
        return language === 'kn' ? 'ತೃಪ್ತಿದಾಯಕ ಸೇವೆ' : language === 'hi' ? 'संतोषजनक' : 'Satisfactory Service';
      case 2:
        return language === 'kn' ? 'ಸುಧಾರಣೆಯ ಅಗತ್ಯವಿದೆ' : language === 'hi' ? 'सुधार की आवश्यकता' : 'Needs Improvement';
      case 1:
        return language === 'kn' ? 'ಅಸಮಾಧಾನಕರ' : language === 'hi' ? 'असंतोषजनक' : 'Unsatisfactory Care';
      default:
        return '';
    }
  };

  const handleAddTag = (tagText: string) => {
    if (!feedback.includes(tagText)) {
      setFeedback((prev) => (prev ? `${prev.trim()}, ${tagText}` : tagText));
    }
  };

  const handleSubmitRating = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!speedStars || !serviceStars) {
      showToast('Please select ratings for response speed and service.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const overallStars = Math.round((speedStars + serviceStars) / 2);
      const payload: AmbulanceRatingInput = {
        rating_speed_stars: speedStars,
        rating_service_stars: serviceStars,
        rating_overall_stars: overallStars,
        rating_feedback: feedback.trim(),
      };

      const res = await api.submitEmergencyRating(emergency.id, payload);
      setIsSubmittedSuccess(true);
      showToast(res.message || 'Feedback submitted successfully!', 'success');
      if (onRatingSubmitted) {
        onRatingSubmitted(res.emergency);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit rating. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already submitted state
  if (isSubmittedSuccess) {
    return (
      <div 
        id={`ambulance-rating-submitted-${emergency.id}`}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 p-5 sm:p-6 shadow-sm ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Feedback Recorded</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                Thank You for Rating Your Emergency Response
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your feedback on <strong className="text-slate-700 dark:text-slate-200">{emergency.vehicle_number || 'Assigned Ambulance'}</strong> helps ensure high-speed emergency response standards.
              </p>
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              id={`btn-dismiss-rating-${emergency.id}`}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close Rating Card"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rating Summary Breakdown */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Response Speed:
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= (speedStars || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
              {getSpeedLabel(speedStars || 5)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                Crew Service:
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= (serviceStars || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
              {getServiceLabel(serviceStars || 5)}
            </p>
          </div>
        </div>

        {feedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 italic border border-slate-200/50 dark:border-slate-800 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>"{feedback}"</span>
          </div>
        )}

        {onDismiss && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              id={`btn-close-completed-session-${emergency.id}`}
              onClick={onDismiss}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Done / Return to Dashboard</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Rating Form
  return (
    <div 
      id={`ambulance-rating-card-${emergency.id}`}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-md transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Rate Ambulance & Paramedic Service
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                SOS #{emergency.id} Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Please rate the response speed and ambulance care you received.
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            id={`btn-skip-rating-${emergency.id}`}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Skip feedback for now"
          >
            Skip
          </button>
        )}
      </div>

      {/* Ambulance & Driver Context Badge */}
      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span>Unit: {emergency.vehicle_number || 'Standard Ambulance BLS'}</span>
          </div>
          {emergency.driver_name && (
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <User className="w-3 h-3 text-slate-400" />
              <span>Driver/Crew: {emergency.driver_name}</span>
            </div>
          )}
        </div>
        {emergency.selected_hospital && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
            Hospital: <strong>{emergency.selected_hospital}</strong>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmitRating} className="mt-5 space-y-5">
        {/* Rating 1: Response Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>1. Ambulance Response Speed</span>
            </label>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {getSpeedLabel(hoverSpeed ?? speedStars)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverSpeed ?? speedStars);
              return (
                <button
                  key={star}
                  type="button"
                  id={`star-speed-${star}-${emergency.id}`}
                  onClick={() => setSpeedStars(star)}
                  onMouseEnter={() => setHoverSpeed(star)}
                  onMouseLeave={() => setHoverSpeed(null)}
                  className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition cursor-pointer group"
                  aria-label={`Rate response speed ${star} out of 5 stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
              {hoverSpeed ?? speedStars}/5 Stars
            </span>
          </div>
        </div>

        {/* Rating 2: Service & Care */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-emerald-500" />
              <span>2. Paramedic Care & Ambulance Service</span>
            </label>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {getServiceLabel(hoverService ?? serviceStars)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= (hoverService ?? serviceStars);
              return (
                <button
                  key={star}
                  type="button"
                  id={`star-service-${star}-${emergency.id}`}
                  onClick={() => setServiceStars(star)}
                  onMouseEnter={() => setHoverService(star)}
                  onMouseLeave={() => setHoverService(null)}
                  className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700 transition cursor-pointer group"
                  aria-label={`Rate paramedic service ${star} out of 5 stars`}
                >
                  <Star
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
              {hoverService ?? serviceStars}/5 Stars
            </span>
          </div>
        </div>

        {/* Quick praise chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Quick feedback tags (optional):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag, idx) => {
              const label = language === 'kn' ? tag.kn : language === 'hi' ? tag.hi : tag.en;
              const isSelected = feedback.includes(label);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTag(label)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  + {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Written Feedback Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <label htmlFor={`textarea-feedback-${emergency.id}`} className="font-semibold">
              Additional Comments / Note for Dispatch & Crew (Optional)
            </label>
            <span className="text-[11px] text-slate-400">{feedback.length}/500</span>
          </div>
          <textarea
            id={`textarea-feedback-${emergency.id}`}
            rows={isCompact ? 2 : 3}
            maxLength={500}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share details about the crew's response time, professionalism, or emergency equipment..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {onDismiss && (
            <button
              type="button"
              id={`btn-skip-rating-bottom-${emergency.id}`}
              onClick={onDismiss}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Skip
            </button>
          )}
          <button
            type="submit"
            id={`btn-submit-ambulance-rating-${emergency.id}`}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting Feedback...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Rating</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

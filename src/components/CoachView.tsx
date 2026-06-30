import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SketchAvatar } from './SketchAvatar';
import {
  Users,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Search,
  Plus,
  CheckCircle2,
  Activity,
  Compass,
  X,
  Sparkles,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { PlayerStatus, Workout } from '../types';

interface CoachViewProps {
  athletes: PlayerStatus[];
  onAddAthlete: (athlete: Omit<PlayerStatus, 'id' | 'workouts'>) => void;
  onApprovePlan: (athleteId: string, updatedWorkouts: Workout[]) => void;
  activeAlerts: any[];
  onResolveAlert: (alertId: string, adjustedWorkout?: any) => void;
  onUpdateWorkout: (athleteId: string, workoutId: string, updatedFields: Partial<Workout>) => void;
}

export default function CoachView({
  athletes,
  onAddAthlete,
  onApprovePlan,
  activeAlerts,
  onResolveAlert,
  onUpdateWorkout
}: CoachViewProps) {
  
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'athlete_detail' | 'review_plan' | 'all_athletes'>('dashboard');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modals / forms states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [newAthleteGoal, setNewAthleteGoal] = useState('');
  const [newAthleteHR, setNewAthleteHR] = useState(58);

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId) || athletes[0];

  // Temp draft workout editing state
  const [draftWorkouts, setDraftWorkouts] = useState<Workout[]>([]);
  const [currentPlanMonth, setCurrentPlanMonth] = useState<number>(1);
  const [safetyStatus, setSafetyStatus] = useState<{ isSafe: boolean; warnings: string[] }>({ isSafe: true, warnings: [] });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [alertRecommendations, setAlertRecommendations] = useState<Record<string, string>>({
    'a1': 'تخفيض مسافة الجري الطويل بمقدار 4 كم هذا الأسبوع (من 18 كم إلى 14 كم)، واستبدال تمرين فترات السرعة بـهرولة تعافي مريحة لبناء الاستشفاء وتحسين نبض الراحة.'
  });
  const [loadingAlerts, setLoadingAlerts] = useState<Record<string, boolean>>({});
  const [activeEditIndex, setActiveEditIndex] = useState<number | null>(0);

  // Real-time plan safety checks
  const runSafetyCheck = (workoutsList: Workout[], athlete: PlayerStatus) => {
    const warnings: string[] = [];
    let isSafe = true;

    if (!workoutsList || workoutsList.length === 0) {
      setSafetyStatus({ isSafe: true, warnings: [] });
      return;
    }

    if (workoutsList.length >= 7) {
      const activeW = workoutsList.filter(w => w.type !== 'Recovery').length;
      if (activeW >= 7) {
        isSafe = false;
        warnings.push("⚠️ الخطة مكثفة جداً: لا يوجد أي يوم راحة أو استشفاء مخصص خلال الأسبوع.");
      }
    }

    const parsedWeeklyKm = parseFloat(athlete.weeklyDistance.replace(/[^\d.]/g, '')) || 25;
    workoutsList.forEach((workout) => {
      const dist = parseFloat(workout.distance.replace(/[^\d.]/g, ''));
      if (dist && dist > parsedWeeklyKm * 0.5) {
        isSafe = false;
        warnings.push(`⚠️ تمرين "${workout.title}" بمسافة ${workout.distance} يتجاوز نصف الحِمل الأسبوعي الكلي للعداء (${athlete.weeklyDistance})، مما قد يجهد المفاصل.`);
      }
    });

    workoutsList.forEach((workout) => {
      const dist = parseFloat(workout.distance.replace(/[^\d.]/g, ''));
      if (dist && dist > 32 && !athlete.goal.includes("ماراثون")) {
        isSafe = false;
        warnings.push(`⚠️ مسافة طويلة جداً: تمرين الجري لمسافة ${workout.distance} لا يتناسب مع هدف العداء الحالي لمسافة أقصر.`);
      }
    });

    setSafetyStatus({ isSafe, warnings });
  };

  // Generate training plan using Gemini
  const handleGenerateAiPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const parsedWeeklyKm = parseFloat(selectedAthlete.weeklyDistance.replace(/[^\d.]/g, '')) || 25;
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteGoal: selectedAthlete.goal,
          athleteLevel: selectedAthlete.restingHR < 55 ? "محترف متمرس" : "هاوٍ نشط",
          targetDistance: selectedAthlete.goal,
          weeklyKm: parsedWeeklyKm,
          coachName: "أحمد فؤاد",
          coachStyle: "التركيز على ميكانيكية الحركة وزيادة التحمل بنسبة 10٪ أسبوعياً كحد أقصى"
        })
      });
      const data = await response.json();
      if (data.workouts && data.workouts.length > 0) {
        setDraftWorkouts(data.workouts);
        runSafetyCheck(data.workouts, selectedAthlete);
        setCurrentPlanMonth(1);
        setToastMessage(`✦ تم توليد خطة تدريبية مخصصة جديدة بنجاح عبر StrideLab AI.`);
      }
    } catch (error) {
      console.error("Error generating training plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Extend training plan using Gemini (progressive overload)
  const handleExtendAiPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await fetch('/api/ai/extend-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWorkouts: draftWorkouts,
          athleteGoal: selectedAthlete.goal,
          currentMonth: currentPlanMonth
        })
      });
      const data = await response.json();
      if (data.workouts && data.workouts.length > 0) {
        setDraftWorkouts(data.workouts);
        runSafetyCheck(data.workouts, selectedAthlete);
        setCurrentPlanMonth(prev => prev + 1);
        setToastMessage(`✦ تم تمديد الخطة للشهر التدريبي ${currentPlanMonth + 1} مع تدرج حمل آمن (≤ 10٪).`);
      }
    } catch (error) {
      console.error("Error extending training plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Fetch live alert risk recommendation on-demand
  const handleGenerateLiveAlertRecommendation = async (alertId: string) => {
    const alert = activeAlerts.find(a => a.id === alertId);
    if (!alert) return;

    setLoadingAlerts(prev => ({ ...prev, [alertId]: true }));
    try {
      const athlete = athletes.find(a => a.id === alert.athleteId);
      const response = await fetch('/api/ai/risk-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: athlete?.name || "خالد ناصر",
          restingHR: athlete?.restingHR || 64,
          trainingLoad: athlete?.trainingLoad || 210,
          status: athlete?.status || "at_risk"
        })
      });
      const data = await response.json();
      if (data.recommendation) {
        setAlertRecommendations(prev => ({ ...prev, [alertId]: data.recommendation }));
        setToastMessage(`✦ تم توليد توصية حية مخصصة من StrideLab AI بنجاح.`);
      }
    } catch (error) {
      console.error("Error generating alert recommendation:", error);
      setToastMessage("⚠️ عذراً، لم نتمكن من توليد التوصية الآن. يرجى المحاولة لاحقاً.");
    } finally {
      setLoadingAlerts(prev => ({ ...prev, [alertId]: false }));
    }
  };

  // Auto-dismiss toast notification
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open Draft review screen
  const startPlanReview = (athlete: PlayerStatus) => {
    setDraftWorkouts([...athlete.workouts]);
    setSelectedAthleteId(athlete.id);
    setCurrentPlanMonth(1);
    setActiveSubView('review_plan');
    runSafetyCheck([...athlete.workouts], athlete);
  };

  const handleWorkoutEdit = (index: number, field: keyof Workout, value: any) => {
    const updated = [...draftWorkouts];
    updated[index] = { ...updated[index], [field]: value };
    setDraftWorkouts(updated);
    runSafetyCheck(updated, selectedAthlete);
  };

  const submitApprovedPlan = () => {
    onApprovePlan(selectedAthlete.id, draftWorkouts);
    setActiveSubView('dashboard');
    setToastMessage(`✓ تم تفعيل واعتماد خطتك المخصصة لـ ${selectedAthlete.name}!`);
  };

  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAthleteName.trim()) return;
    onAddAthlete({
      name: newAthleteName,
      status: 'on_track',
      lastActivity: 'الآن',
      avatar: 'sketch',
      weeklyDistance: '0 كم',
      restingHR: Number(newAthleteHR),
      recentPace: '--:--',
      trainingLoad: 100,
      goal: newAthleteGoal || 'تحسين اللياقة الهوائية'
    });
    setNewAthleteName('');
    setNewAthleteGoal('');
    setShowAddModal(false);
    setToastMessage(`✓ تم تسجيل اللاعب الجديد ${newAthleteName} بنجاح.`);
  };

  // Filter athletes based on search
  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Sub tabs inside Coach mode (Premium Pill Switcher) */}
      <div className="flex justify-center md:justify-start">
        <div className="bg-stone-100 p-1 rounded-sm flex gap-1 w-full max-w-sm md:max-w-md shadow-sm border border-stone-200">
          <button
            onClick={() => setActiveSubView('dashboard')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all text-center rounded-sm flex items-center justify-center gap-2 ${
              activeSubView === 'dashboard' 
                ? 'bg-emerald-950 text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            مركز القيادة
          </button>
          <button
            onClick={() => setActiveSubView('all_athletes')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all text-center rounded-sm flex items-center justify-center gap-2 ${
              activeSubView === 'all_athletes' || activeSubView === 'athlete_detail'
                ? 'bg-emerald-950 text-white shadow-sm' 
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            قائمة اللاعبين والملفات
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- C1: MAIN COMMAND CENTER --- */}
        {activeSubView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-stone-950 tracking-tight font-display">مركز القيادة</h1>
                <p className="text-stone-500 text-xs md:text-sm">نظرة عامة على أداء لاعبيك والإجراءات التي تحتاج لمتابعتك.</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-950 text-white hover:bg-emerald-900 transition-colors text-xs font-bold rounded-sm"
              >
                <Plus className="w-4 h-4" /> إضافة لاعب جديد
              </button>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div
                onClick={() => setActiveSubView('all_athletes')}
                className="bg-white p-5 border border-stone-200 rounded-sm flex justify-between items-center cursor-pointer hover:border-stone-300 transition-colors"
              >
                <div>
                  <p className="text-xs text-stone-500 mb-1">العدّاؤون النشطون</p>
                  <h3 className="text-3xl font-bold text-stone-900">{athletes.length}</h3>
                </div>
                <div className="w-10 h-10 bg-stone-50 rounded-sm flex items-center justify-center text-stone-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div
                onClick={() => {
                  const toReview = athletes.find(a => a.status === 'needs_review') || athletes[2] || athletes[0];
                  if (toReview) startPlanReview(toReview);
                }}
                className="bg-white p-5 border border-stone-200 rounded-sm flex justify-between items-center cursor-pointer hover:border-stone-300 transition-colors"
              >
                <div>
                  <p className="text-xs text-stone-500 mb-1">مسودات بانتظار المراجعة</p>
                  <h3 className="text-3xl font-bold text-stone-900">
                    {athletes.filter(a => a.status === 'needs_review').length}
                  </h3>
                </div>
                <div className="w-10 h-10 bg-stone-50 rounded-sm flex items-center justify-center text-stone-500">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 border border-stone-200 rounded-sm flex justify-between items-center">
                <div>
                  <p className="text-xs text-stone-500 mb-1">تنبيهات الحمل الزائد</p>
                  <h3 className={`text-3xl font-bold ${activeAlerts.length > 0 ? 'text-red-600' : 'text-stone-900'}`}>
                    {activeAlerts.length}
                  </h3>
                </div>
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                  activeAlerts.length > 0 ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-stone-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Priority Actions and List layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Actions columns */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-bold text-stone-800 pb-1">يحتاج إلى متابعتك</h2>

                {activeAlerts.length === 0 && athletes.filter(a => a.status === 'needs_review').length === 0 && (
                  <div className="bg-white p-8 border border-stone-200 text-center rounded-sm space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto" />
                    <p className="font-semibold text-stone-800 text-sm">لا توجد إجراءات معلّقة</p>
                    <p className="text-xs text-stone-400">لاعبوك يسيرون على خططهم التدريبية بأمان حالياً.</p>
                  </div>
                )}

                {/* Risk Alerts Cards */}
                {activeAlerts.map((alert) => {
                  const athlete = athletes.find(a => a.id === alert.athleteId) || athletes[1];
                  return (
                    <div
                      key={alert.id}
                      className="bg-white border border-stone-200 border-r-2 border-r-red-500 rounded-sm p-5 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-3">
                          <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-9 h-9" />
                          <div>
                            <h4 className="font-semibold text-stone-900 text-sm">{athlete.name}</h4>
                            <p className="text-xs text-stone-400">{athlete.goal}</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-sm">
                          {alert.title}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">{alert.description}</p>

                      <div className="bg-stone-50 p-3 rounded-sm text-xs text-stone-700 leading-relaxed">
                        {loadingAlerts[alert.id] ? (
                          <span className="text-stone-400">جاري صياغة التوصية...</span>
                        ) : (
                          <span>{alertRecommendations[alert.id] || "اضغط على \"توصية مخصصة\" لتوليد إرشاد علاجي مبني على بيانات اللاعب."}</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            onResolveAlert(alert.id, { workoutIndex: 3, field: 'distance', value: '14 كم' });
                            setToastMessage(`تم تطبيق التوصية وتخفيض مسافة جري ${athlete.name}.`);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-sm transition-colors"
                        >
                          اعتماد التوصية فوراً
                        </button>
                        <button
                          onClick={() => handleGenerateLiveAlertRecommendation(alert.id)}
                          disabled={loadingAlerts[alert.id]}
                          className="px-4 py-2 bg-white border border-stone-200 text-stone-700 text-xs font-bold rounded-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
                        >
                          {loadingAlerts[alert.id] ? 'جاري التحليل...' : 'توصية مخصصة'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAthleteId(athlete.id);
                            setActiveSubView('athlete_detail');
                          }}
                          className="px-4 py-2 text-stone-500 text-xs font-bold rounded-sm hover:bg-stone-50 transition-colors"
                        >
                          عرض الملف
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Draft Review Cards */}
                {athletes.filter(a => a.status === 'needs_review').map((athlete) => (
                  <div
                    key={athlete.id}
                    className="bg-white border border-stone-200 rounded-sm p-5 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-9 h-9" />
                        <div>
                          <h4 className="font-semibold text-stone-900 text-sm">{athlete.name}</h4>
                          <p className="text-xs text-stone-400">آخر نشاط: {athlete.lastActivity}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-sm">
                        مسودة جاهزة للمراجعة
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      خطة الشهر القادم لـ {athlete.name} (المستهدف: {athlete.goal}) جاهزة بزيادة حمل تدريجية وهرولة تحمل 15 كم.
                    </p>

                    <button
                      onClick={() => startPlanReview(athlete)}
                      className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-sm transition-colors"
                    >
                      مراجعة الخطة
                    </button>
                  </div>
                ))}

              </div>

              {/* Mini Roster sidebar in C1 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-1">
                  <h2 className="text-sm font-bold text-stone-800">اللاعبون</h2>
                  <button
                    onClick={() => setActiveSubView('all_athletes')}
                    className="text-xs text-emerald-800 font-medium hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="bg-white border border-stone-200 rounded-sm overflow-hidden divide-y divide-stone-100">
                  {athletes.map((ath) => (
                    <div
                      key={ath.id}
                      onClick={() => {
                        setSelectedAthleteId(ath.id);
                        setActiveSubView('athlete_detail');
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <SketchAvatar name={ath.name} avatarUrl={ath.avatar} className="w-8 h-8" />
                        <div>
                          <h4 className="font-medium text-stone-900 text-xs">{ath.name}</h4>
                          <p className="text-[10px] text-stone-400">{ath.weeklyDistance}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm ${
                        ath.status === 'on_track' ? 'bg-emerald-50 text-emerald-700' :
                        ath.status === 'needs_review' ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {ath.status === 'on_track' && 'مستقر'}
                        {ath.status === 'needs_review' && 'مراجعة'}
                        {ath.status === 'at_risk' && 'حمل زائد'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
        
        {/* --- C2: ATHLETE DETAIL SCREEN --- */}
        {activeSubView === 'athlete_detail' && (
          <motion.div
            key="athlete_detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-8"
          >
            <button 
              onClick={() => setActiveSubView('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-950 transition-all uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 ml-1" /> العودة للوحة القيادة
            </button>

            {/* Profile Overview Card */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-150">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16">
                    <SketchAvatar name={selectedAthlete.name} avatarUrl={selectedAthlete.avatar} className="w-14 h-14 md:w-16 md:h-16" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-light text-stone-950">{selectedAthlete.name}</h2>
                    <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-stone-400" />
                      <span>المستهدف: <strong className="font-bold text-stone-800">{selectedAthlete.goal}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <button 
                    onClick={() => startPlanReview(selectedAthlete)}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-950 text-white hover:bg-emerald-900 transition-colors text-xs font-bold uppercase rounded-sm shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" /> تعديل وبناء الخطة التدريبية
                  </button>
                </div>
              </div>

              {/* Metrics grid bento style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center space-y-1">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">المسافة الأسبوعية</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-stone-850 block">{selectedAthlete.weeklyDistance}</span>
                  <span className="text-[9px] text-stone-400 block">خلال آخر 7 أيام</span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center space-y-1">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">نبض الراحة المتوسط</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-stone-850 block">{selectedAthlete.restingHR} BPM</span>
                  <span className="text-[9px] text-emerald-800 font-medium block">مستقر ومثالي</span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center space-y-1">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">الحمل التدريبي التراكمي</span>
                  <span className={`text-lg md:text-xl font-bold font-mono block ${selectedAthlete.trainingLoad > 200 ? 'text-red-700' : 'text-emerald-800'}`}>
                    {selectedAthlete.trainingLoad}
                  </span>
                  <span className="text-[9px] text-stone-400 block">مجموع الجهد المستهلك</span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center space-y-1">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold tracking-wider">الرتم الأخير المتوسط</span>
                  <span className="text-lg md:text-xl font-bold font-mono text-stone-850 block">{selectedAthlete.recentPace}/كم</span>
                  <span className="text-[9px] text-stone-400 block">وتيرة السرعة المتوسطة</span>
                </div>

              </div>

              {/* Athlete Workout Schedule Timeline */}
              <div className="space-y-4 pt-6 border-t border-stone-150">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-900 text-xs tracking-widest uppercase flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-stone-400" /> الجدول التدريبي الحالي للاعب
                  </h3>
                  <span className="text-[10px] font-mono text-stone-400">تحديث: اليوم</span>
                </div>
                
                <div className="space-y-3">
                  {selectedAthlete.workouts.map((workout, index) => (
                    <div 
                      key={workout.id} 
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-stone-50/50 border border-stone-150 rounded-sm hover:bg-white hover:border-stone-300 transition-all shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-stone-500 font-bold bg-white border border-stone-200 px-2 py-0.5 rounded-sm">
                            {workout.date}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                            workout.type === 'Long Run' ? 'bg-amber-100 text-amber-800' :
                            workout.type === 'Intervals' ? 'bg-red-100 text-red-800' :
                            workout.type === 'Tempo' ? 'bg-indigo-100 text-indigo-800' :
                            workout.type === 'Recovery' ? 'bg-teal-100 text-teal-800' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            {workout.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-stone-950 text-sm">{workout.title}</h4>
                        <p className="text-[11px] text-stone-400 font-light">{workout.description}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-none border-stone-200/60">
                        <span className="text-xs font-mono text-stone-500 font-bold bg-white px-2.5 py-1 rounded-sm border border-stone-150">
                          {workout.distance} • {workout.duration}
                        </span>
                        {workout.completed ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-sm shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> مكتمل ومسجل
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-400 bg-white border border-stone-200 px-2.5 py-1 rounded-sm shrink-0">
                            مجدول بانتظار الركض
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- C3: DETAILED PLAN REVIEW & AI CUSTOMIZATION SCREEN (Dramatically simplified & organized) --- */}
        {activeSubView === 'review_plan' && (
          <motion.div
            key="review_plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <button 
                onClick={() => setActiveSubView('dashboard')}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-950 transition-all uppercase tracking-widest"
              >
                <ArrowRight className="w-4 h-4 ml-1" /> إلغاء المراجعة والرجوع
              </button>
              
              <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> مسودة معززة بالذكاء الاصطناعي
              </div>
            </div>

            {/* Split Grid Layout on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
              
              {/* Main Column (Workouts Editor) - Col span 2 */}
              <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
                
                <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-5 md:p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-stone-950 font-display">تعديل وتخصيص تفاصيل التمارين</h2>
                    <p className="text-stone-400 text-xs mt-1">عدّل التكرارات، العناوين، أو المسافات قبل إرسال الخطة للتفعيل فورياً عند الرياضي.</p>
                  </div>

                   <div className="space-y-3 pt-2">
                    {draftWorkouts.map((workout, index) => {
                      const isEditing = activeEditIndex === index;
                      return (
                        <div 
                          key={workout.id} 
                          className={`p-4 border rounded-sm transition-all duration-200 ${
                            isEditing 
                              ? 'bg-stone-50 border-stone-300 shadow-sm' 
                              : 'bg-white border-stone-200 hover:border-stone-300 cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isEditing) setActiveEditIndex(index);
                          }}
                        >
                          {/* Header Summary */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100/80">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${
                                isEditing ? 'bg-emerald-950 text-white' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-xs font-bold text-stone-600 font-mono">{workout.date}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                                workout.type === 'Long Run' ? 'bg-amber-100 text-amber-800' :
                                workout.type === 'Intervals' ? 'bg-red-100 text-red-800' :
                                workout.type === 'Tempo' ? 'bg-indigo-100 text-indigo-800' :
                                workout.type === 'Recovery' ? 'bg-teal-100 text-teal-800' :
                                'bg-stone-200 text-stone-700'
                              }`}>
                                {workout.type}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
                              <span>{workout.distance}</span>
                              <span>•</span>
                              <span>{workout.duration}</span>
                              {!isEditing && (
                                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm mr-2 hover:bg-emerald-100 transition-colors">
                                  تعديل التفاصيل ✎
                                </span>
                              )}
                            </div>
                          </div>

                          {!isEditing ? (
                            <div className="mt-2 space-y-1">
                              <h4 className="font-semibold text-stone-900 text-xs">{workout.title}</h4>
                              <p className="text-[10px] text-stone-400 font-light truncate">{workout.description}</p>
                            </div>
                          ) : (
                            <div className="space-y-4 pt-3" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">نوع التمرين</label>
                                  <select 
                                    value={workout.type}
                                    onChange={(e) => handleWorkoutEdit(index, 'type', e.target.value)}
                                    className="w-full bg-white border border-stone-200 text-xs font-bold px-2.5 py-2 outline-none rounded-sm text-stone-700 focus:border-stone-400"
                                  >
                                    <option value="Easy">جري سهل (Easy)</option>
                                    <option value="Tempo">جري تمبو (Tempo)</option>
                                    <option value="Intervals">فترات سرعة (Intervals)</option>
                                    <option value="Long Run">جري طويل (Long Run)</option>
                                    <option value="Recovery">استشفاء (Recovery)</option>
                                  </select>
                                </div>
                                
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">عنوان التمرين</label>
                                  <input 
                                    type="text" 
                                    value={workout.title}
                                    onChange={(e) => handleWorkoutEdit(index, 'title', e.target.value)}
                                    className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none font-medium text-stone-800 focus:border-stone-400" 
                                  />
                                </div>
                                
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">المسافة المستهدفة</label>
                                  <input 
                                    type="text" 
                                    value={workout.distance}
                                    onChange={(e) => handleWorkoutEdit(index, 'distance', e.target.value)}
                                    className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none font-medium text-stone-800 focus:border-stone-400" 
                                  />
                                </div>
                                
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">المدة الزمنية</label>
                                  <input 
                                    type="text" 
                                    value={workout.duration}
                                    onChange={(e) => handleWorkoutEdit(index, 'duration', e.target.value)}
                                    className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none font-medium text-stone-800 focus:border-stone-400" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">الوصف الفني والتفاصيل</label>
                                <textarea 
                                  value={workout.description || ''}
                                  onChange={(e) => handleWorkoutEdit(index, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none font-light text-stone-600 focus:border-stone-400 resize-none leading-relaxed" 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions buttons bottom */}
                  <div className="pt-5 border-t border-stone-200 flex flex-col sm:flex-row justify-end gap-2.5">
                    <button 
                      onClick={() => setActiveSubView('dashboard')}
                      className="w-full sm:w-auto px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase rounded-sm border border-stone-200 text-center"
                    >
                      إلغاء وتجاهل التعديلات
                    </button>
                    <button 
                      onClick={submitApprovedPlan}
                      className="w-full sm:w-auto px-6 py-3 bg-emerald-950 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-sm shadow-md text-center"
                    >
                      تفعيل وإرسال خطة التدريب للعداء ✓
                    </button>
                  </div>
                </div>

              </div>

              {/* Sidebar Column (Plan Assistant & Live Analysis) - Col span 1 */}
              <div className="space-y-4 order-1 lg:order-2 lg:sticky lg:top-4">

                {/* Plan generation panel */}
                <div className="bg-white border border-stone-200 rounded-sm p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">مساعد بناء الخطة</h3>
                    <p className="text-stone-500 text-xs mt-1">
                      توليد أو تمديد خطة {selectedAthlete.name} تلقائياً — الشهر {currentPlanMonth}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      disabled={isGeneratingPlan}
                      onClick={handleGenerateAiPlan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50 text-xs font-bold rounded-sm transition-colors"
                    >
                      {isGeneratingPlan ? "جاري التوليد..." : "إعادة توليد الخطة"}
                    </button>

                    <button
                      disabled={isGeneratingPlan}
                      onClick={handleExtendAiPlan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-50 text-xs font-bold rounded-sm transition-colors"
                    >
                      {isGeneratingPlan ? "جاري التمديد..." : "تمديد للشهر التالي (≤ 10٪)"}
                    </button>
                  </div>
                </div>

                {/* Safety Diagnostics Panel */}
                <div className={`p-5 border rounded-sm space-y-2 ${
                  safetyStatus.warnings.length > 0
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {safetyStatus.warnings.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <h4 className={`font-bold text-xs ${
                      safetyStatus.warnings.length > 0 ? 'text-red-900' : 'text-emerald-900'
                    }`}>
                      فحص السلامة
                    </h4>
                  </div>

                  {safetyStatus.warnings.length > 0 ? (
                    <ul className="text-xs text-red-900 space-y-1.5">
                      {safetyStatus.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-1.5 bg-white/60 p-2 rounded-sm">
                          <span className="text-red-600">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      الخطة الحالية مطابقة لتوصيات أمان الحمل والزيادة التدريجية الآمنة (أقل من 10٪).
                    </p>
                  )}
                </div>

                {/* Athlete Context info */}
                <div className="bg-white border border-stone-200 rounded-sm p-4 text-xs space-y-2.5">
                  <span className="text-stone-400 font-medium block pb-1 border-b border-stone-100">
                    ملخص {selectedAthlete.name}
                  </span>

                  <div className="space-y-2 text-stone-600">
                    <div className="flex justify-between"><span>الهدف:</span> <span className="text-stone-900 font-medium">{selectedAthlete.goal}</span></div>
                    <div className="flex justify-between"><span>نبض الاستراحة:</span> <span className="text-stone-900 font-medium">{selectedAthlete.restingHR} BPM</span></div>
                    <div className="flex justify-between"><span>الحمل الأسبوعي:</span> <span className="text-stone-900 font-medium">{selectedAthlete.weeklyDistance}</span></div>
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* --- C6: ALL ATHLETES LIST --- */}
        {activeSubView === 'all_athletes' && (
          <motion.div
            key="all_athletes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 md:space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-stone-200 shadow-sm rounded-sm">
              <div>
                <h1 className="text-2xl font-bold text-stone-950 tracking-tight font-display">ملفات العدائين والقائمة التدريبية</h1>
                <p className="text-stone-500 text-xs md:text-sm">البحث وإدارة اللاعبين ومستويات الجهد ومناطق نبضات القلب الخاصة بهم.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-950 text-white text-xs font-bold uppercase rounded-sm hover:bg-emerald-800 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" /> إضافة لاعب جديد
              </button>
            </div>

            {/* Search filter panel */}
            <div className="relative bg-white border border-stone-200 rounded-sm shadow-sm p-1.5 flex items-center">
              <Search className="w-5 h-5 text-stone-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="ابحث عن لاعب بالاسم..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs outline-none px-2 py-2 text-stone-800 placeholder-stone-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-stone-100 text-stone-400 rounded-full ml-2">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {filteredAthletes.length === 0 ? (
              <div className="bg-white p-12 border border-stone-200 text-center text-stone-500 text-xs rounded-sm shadow-sm">
                لا يوجد أي لاعب مطابق لبحثك حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAthletes.map((ath) => (
                  <div 
                    key={ath.id}
                    onClick={() => {
                      setSelectedAthleteId(ath.id);
                      setActiveSubView('athlete_detail');
                    }}
                    className="bg-white border border-stone-200 shadow-sm p-5 hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer rounded-sm flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <SketchAvatar name={ath.name} avatarUrl={ath.avatar} className="w-11 h-11" />
                        <div>
                          <h4 className="font-semibold text-stone-950 text-sm group-hover:text-emerald-950 transition-colors">{ath.name}</h4>
                          <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-sm ${
                            ath.status === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                            ath.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ath.status === 'on_track' && 'مستقر ومثالي'}
                            {ath.status === 'needs_review' && 'بانتظار مراجعة الخطة'}
                            {ath.status === 'at_risk' && 'تنبيه حمل زائد'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-stone-100 pt-3 space-y-2 text-xs text-stone-500 font-mono">
                        <div className="flex justify-between items-center">
                          <span>المسافة الأسبوعية:</span> 
                          <span className="font-bold text-stone-850 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-sm">{ath.weeklyDistance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>نبض الراحة:</span> 
                          <span className="font-bold text-stone-850 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-sm">{ath.restingHR} BPM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>الحمل التراكمي:</span> 
                          <span className={`font-bold px-2 py-0.5 rounded-sm ${ath.trainingLoad > 200 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>{ath.trainingLoad}</span>
                        </div>
                      </div>
                    </div>

                    <button className="w-full text-center mt-2 py-2 bg-stone-50 border border-stone-200 group-hover:bg-emerald-950 group-hover:border-emerald-950 group-hover:text-white transition-all text-[9px] font-bold uppercase tracking-wider rounded-sm shadow-inner">
                      عرض السجل التدريبي الكامل والمخططات ←
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Add Athlete Modal (C7) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-md w-full p-6 md:p-8 rounded-sm space-y-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute left-6 top-6 p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-stone-950 font-display">إضافة لاعب جديد يدوياً للتدريب</h3>
              <p className="text-stone-400 text-xs mt-1">سيتم ربط بيانات هذا اللاعب ليتسنى للمساعد الذكي البدء في تجهيز المسودات التدريبية المخصصة له.</p>
            </div>

            <form onSubmit={handleCreateAthlete} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">اسم اللاعب بالكامل</label>
                <input 
                  type="text" 
                  required 
                  value={newAthleteName} 
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  placeholder="مثال: خالد ناصر" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">الهدف التدريبي المستهدف</label>
                <input 
                  type="text" 
                  value={newAthleteGoal} 
                  onChange={(e) => setNewAthleteGoal(e.target.value)}
                  placeholder="مثال: إنهاء ماراثون الرياض في 3:45" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">نبض القلب أثناء الراحة (Resting HR BPM)</label>
                <input 
                  type="number" 
                  value={newAthleteHR} 
                  onChange={(e) => setNewAthleteHR(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold py-3 uppercase tracking-wider rounded-sm transition-colors mt-4 shadow-sm"
              >
                تأكيد وإضافة اللاعب للرصيد التدريبي
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Premium Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 left-6 md:left-auto bg-stone-950 border border-stone-850 text-stone-100 px-5 py-4 rounded-sm shadow-2xl flex items-center justify-between gap-3 animate-fadeIn z-50 max-w-md" style={{ direction: 'rtl' }}>
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs font-light leading-relaxed">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-stone-100 text-xs font-mono shrink-0 pl-1"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

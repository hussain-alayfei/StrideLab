import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SketchAvatar } from './SketchAvatar';
import { 
  Users, 
  ClipboardCheck, 
  AlertTriangle, 
  ArrowRight, 
  BrainCircuit, 
  Search, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Activity, 
  Clock, 
  Compass,
  X,
  Sparkles,
  Calendar,
  ShieldCheck,
  Dumbbell,
  Zap
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
            {/* Header section with responsive layout */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-stone-200/80 rounded-sm shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono">لوحة تحكم المدرب فؤاد</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-950 tracking-tight font-display">مركز القيادة (Coach Dashboard)</h1>
                <p className="text-stone-500 text-xs md:text-sm font-sans font-light">نظرة عامة على أداء لاعبيك، تنبيهات الإجهاد، واعتمادات الذكاء الاصطناعي الجاهزة.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-emerald-950 text-white hover:bg-emerald-900 transition-all text-xs font-bold tracking-wider uppercase rounded-sm shadow-sm"
              >
                <Plus className="w-4 h-4" /> إضافة لاعب جديد للتدريب
              </button>
            </div>

            {/* Metric counters Bento style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              
              <div 
                onClick={() => setActiveSubView('all_athletes')}
                className="bg-white p-5 md:p-6 border border-stone-200 border-r-4 border-r-emerald-800 shadow-sm flex justify-between items-center cursor-pointer hover:border-emerald-600 hover:shadow transition-all rounded-sm group"
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1 tracking-wider">العدّاؤون النشطون</p>
                  <h3 className="text-3xl md:text-4xl font-light text-stone-900 group-hover:text-emerald-950 transition-colors">{athletes.length}</h3>
                  <span className="text-[9px] text-emerald-800 font-medium block mt-1">عرض جميع الملفات ←</span>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-sm border border-emerald-100 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div 
                onClick={() => {
                  const toReview = athletes.find(a => a.status === 'needs_review') || athletes[2] || athletes[0];
                  if (toReview) startPlanReview(toReview);
                }}
                className="bg-white p-5 md:p-6 border border-stone-200 border-r-4 border-r-amber-500 shadow-sm flex justify-between items-center cursor-pointer hover:border-amber-400 hover:shadow transition-all rounded-sm group"
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1 tracking-wider">مسودات خطط للمراجعة</p>
                  <h3 className="text-3xl md:text-4xl font-light text-stone-900 group-hover:text-amber-850 transition-colors">
                    {athletes.filter(a => a.status === 'needs_review').length}
                  </h3>
                  <span className="text-[9px] text-amber-700 font-medium block mt-1">توليد وموافقة بالذكاء الاصطناعي ←</span>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-sm border border-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>

              <div 
                className={`p-5 md:p-6 border shadow-sm flex justify-between items-center rounded-sm transition-all ${
                  activeAlerts.length > 0 
                    ? 'border-red-200 border-r-4 border-r-red-600 bg-red-50/25 hover:bg-red-50/40 cursor-pointer' 
                    : 'border-stone-200 border-r-4 border-r-stone-400 bg-white'
                }`}
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1 tracking-wider">تنبيهات الحمل الزائد</p>
                  <h3 className={`text-3xl md:text-4xl font-light ${activeAlerts.length > 0 ? 'text-red-700' : 'text-stone-700'}`}>
                    {activeAlerts.length}
                  </h3>
                  <span className="text-[9px] text-stone-400 block mt-1">
                    {activeAlerts.length > 0 ? 'يتطلب تعديل مسار تدريبي فوري!' : 'جميع الحيوية والجهد مستقر'}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                  activeAlerts.length > 0 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-stone-100 text-stone-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Priority Actions and List layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              
              {/* Actions columns */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-stone-500">إجراءات مستعجلة ذات أولوية</h2>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm font-medium font-mono">تنبيهات المدرب</span>
                </div>

                {activeAlerts.length === 0 && athletes.filter(a => a.status === 'needs_review').length === 0 && (
                  <div className="bg-white p-10 border border-stone-200/80 text-center text-stone-500 text-xs rounded-sm shadow-sm space-y-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-stone-800">لا توجد مسودات أو إجهاد حاد للرياضيين</p>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto">✓ جميع الإجراءات مكتملة! لاعبوك يسيرون على الخطط التدريبية بأمان ومؤشراتهم الحيوية ممتازة.</p>
                  </div>
                )}

                {/* Risk Alerts Cards */}
                {activeAlerts.map((alert) => {
                  const athlete = athletes.find(a => a.id === alert.athleteId) || athletes[1];
                  return (
                    <div 
                      key={alert.id}
                      className="bg-white border border-stone-200 border-r-4 border-r-red-600 shadow-sm p-5 md:p-6 relative rounded-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-10 h-10" />
                          <div>
                            <h4 className="font-semibold text-stone-900 text-sm">{athlete.name}</h4>
                            <p className="text-[9px] font-mono text-stone-400">الهدف: {athlete.goal}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-sm flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> {alert.title}
                        </span>
                      </div>
                      
                      <div className="bg-rose-50/50 p-4 border border-rose-100 rounded-sm text-xs text-stone-600 leading-relaxed font-light space-y-3">
                        <p>{alert.description}</p>
                        
                        <div className="pt-3 border-t border-rose-200/50 space-y-2">
                          <div className="flex items-start gap-1.5 text-stone-800">
                            <Sparkles className={`w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5 ${loadingAlerts[alert.id] ? 'animate-spin' : ''}`} />
                            <span className="leading-relaxed">
                              <strong className="text-emerald-950 font-bold">توصية الذكاء الاصطناعي:</strong>{' '}
                              {loadingAlerts[alert.id] ? (
                                <span className="text-stone-400 italic animate-pulse">جاري صياغة التوصية الحية المخصصة عبر StrideLab AI...</span>
                              ) : (
                                alertRecommendations[alert.id] || "اضغط على الزر أدناه لتوليد توصية علاجية وقائية مخصصة."
                              )}
                            </span>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleGenerateLiveAlertRecommendation(alert.id)}
                              disabled={loadingAlerts[alert.id]}
                              className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 px-3 py-1.5 rounded-sm transition-all shadow-inner disabled:opacity-50"
                            >
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              {loadingAlerts[alert.id] ? 'جاري التحليل...' : 'طلب توصية حية بالذكاء الاصطناعي ✦'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button 
                          onClick={() => {
                            onResolveAlert(alert.id, { workoutIndex: 3, field: 'distance', value: '14 كم' });
                            setToastMessage(`✓ تم تطبيق التوصية الطبية والتدريبية لتخفيض مسافة جري ${athlete.name} وتثبيت حمله التدريبي.`);
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold tracking-wider uppercase rounded-sm transition-colors shadow-sm text-center"
                        >
                          اعتماد التوصية الوقائية فوراً
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAthleteId(athlete.id);
                            setActiveSubView('athlete_detail');
                          }}
                          className="px-4 py-2.5 bg-stone-50 border border-stone-200 text-stone-700 text-[10px] font-bold tracking-wider uppercase rounded-sm hover:bg-stone-100 transition-colors text-center"
                        >
                          المراجعة التدريبية للملف
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Draft Review Cards */}
                {athletes.filter(a => a.status === 'needs_review').map((athlete) => (
                  <div 
                    key={athlete.id}
                    className="bg-white border border-stone-200 shadow-sm p-5 md:p-6 rounded-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3">
                        <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-10 h-10" />
                        <div>
                          <h4 className="font-semibold text-stone-900 text-sm">{athlete.name}</h4>
                          <p className="text-[9px] font-mono text-stone-400">آخر نشاط: {athlete.lastActivity}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-sm flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-emerald-800" /> مسودة ذكية جاهزة للمراجعة
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed font-light">
                      قام StrideLab AI بإنشاء مسودة خطة الشهر الثاني المخصصة لـ {athlete.name} (المستهدف: {athlete.goal}) مدمجاً بها زيادة تكتيكية تدريجية في حجم التدريب الهوائي وهرولة التحمل لمسافة 15 كم.
                    </p>

                    <div className="pt-2">
                      <button 
                        onClick={() => startPlanReview(athlete)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white text-[10px] font-bold tracking-wider uppercase rounded-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> مراجعة وتعديل الخطة التدريبية
                      </button>
                    </div>
                  </div>
                ))}

              </div>

              {/* Mini Roster sidebar in C1 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-stone-500">قائمة العدّائين الفورية</h2>
                  <button 
                    onClick={() => setActiveSubView('all_athletes')}
                    className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider hover:underline"
                  >
                    عرض الكل ({athletes.length})
                  </button>
                </div>

                <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden divide-y divide-stone-100">
                  {athletes.map((ath) => (
                    <div 
                      key={ath.id}
                      onClick={() => {
                        setSelectedAthleteId(ath.id);
                        setActiveSubView('athlete_detail');
                      }}
                      className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <SketchAvatar name={ath.name} avatarUrl={ath.avatar} className="w-9 h-9" />
                        <div>
                          <h4 className="font-semibold text-stone-900 text-xs">{ath.name}</h4>
                          <p className="text-[9px] text-stone-400 font-mono">آخر نشاط: {ath.lastActivity}</p>
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <span className={`inline-block text-[8px] font-bold px-2 py-0.5 rounded-sm ${
                          ath.status === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                          ath.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ath.status === 'on_track' && 'مستقر'}
                          {ath.status === 'needs_review' && 'مراجعة الخطة'}
                          {ath.status === 'at_risk' && 'حمل زائد'}
                        </span>
                        <p className="text-[9px] text-stone-400 font-mono font-bold">{ath.weeklyDistance}</p>
                      </div>
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

              {/* Sidebar Column (AI Copilot Panel & Live Analysis) - Col span 1 */}
              <div className="space-y-4 md:space-y-6 order-1 lg:order-2 lg:sticky lg:top-4">
                
                {/* AI Copilot control board */}
                <div className="bg-emerald-950 text-white border border-emerald-900 shadow-lg rounded-sm p-5 md:p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-800/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-1.5 relative z-10">
                    <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>StrideLab AI Copilot</span>
                    </div>
                    <h3 className="text-lg font-bold font-display">مساعد التعديل والنمذجة</h3>
                    <p className="text-emerald-100/70 text-xs leading-relaxed font-light">
                      أتمتة تعديل الحمل التدريبي وحجم التدريب الأسبوعي لـ {selectedAthlete.name} بلمسة واحدة.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-900/50 border border-emerald-800 rounded-sm text-xs space-y-1 relative z-10">
                    <span className="text-[10px] text-emerald-300 font-bold uppercase block tracking-wider">الحالة الحالية للبرنامج:</span>
                    <span className="font-semibold block text-emerald-50 text-[11px]">الشهر التدريبي المستهدف: الشهر {currentPlanMonth}</span>
                  </div>

                  <div className="space-y-2 pt-2 relative z-10">
                    <button
                      disabled={isGeneratingPlan}
                      onClick={handleGenerateAiPlan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-emerald-950 hover:bg-emerald-50 disabled:opacity-50 text-xs font-bold uppercase rounded-sm shadow-sm transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{isGeneratingPlan ? "جاري التوليد..." : "إعادة التوليد تلقائياً ✦"}</span>
                    </button>

                    <button
                      disabled={isGeneratingPlan}
                      onClick={handleExtendAiPlan}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-900/40 text-emerald-100 border border-emerald-800 hover:bg-emerald-900/60 disabled:opacity-50 text-xs font-bold uppercase rounded-sm transition-all"
                    >
                      <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{isGeneratingPlan ? "جاري التمديد..." : "تمديد خطة الشهر التالي (≤ 10٪) ✦"}</span>
                    </button>
                  </div>
                </div>

                {/* StrideLab AI Live Safety Diagnostics Panel */}
                <div className={`p-5 border shadow-sm rounded-sm space-y-3 transition-colors ${
                  safetyStatus.warnings.length > 0 
                    ? 'bg-rose-50 border-rose-200' 
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {safetyStatus.warnings.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <h4 className={`font-bold text-xs uppercase ${
                      safetyStatus.warnings.length > 0 ? 'text-red-950' : 'text-emerald-950'
                    }`}>
                      فحص السلامة الرياضية من StrideLab
                    </h4>
                  </div>

                  {safetyStatus.warnings.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-red-800 font-medium">الخطة الحالية بها بعض النقاط التي تتطلب تحذيراً وقائياً:</p>
                      <ul className="text-[11px] text-red-900 space-y-1.5 font-light">
                        {safetyStatus.warnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-1 bg-white/60 p-2 rounded-sm border border-red-150">
                            <span className="text-red-700 font-bold">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-emerald-900 font-light leading-relaxed">
                        ✓ تهانينا! الخطة الحالية مطابقة بالكامل لجميع توصيات أمان الحمل والزيادة التكتيكية التدريجية للجري (Progressive Overload &lt; 10%).
                      </p>
                    </div>
                  )}
                </div>

                {/* Patient / Athlete Context info */}
                <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-4 text-xs space-y-3">
                  <span className="text-[10px] text-stone-400 block font-bold uppercase tracking-wider pb-1 border-b border-stone-100">
                    الملخص الفسيولوجي المرجعي لـ {selectedAthlete.name}
                  </span>
                  
                  <div className="space-y-2 font-mono text-stone-600 font-bold">
                    <div className="flex justify-between"><span>الهدف الإجمالي:</span> <span className="text-stone-900">{selectedAthlete.goal}</span></div>
                    <div className="flex justify-between"><span>نبض الاستراحة:</span> <span className="text-stone-900">{selectedAthlete.restingHR} BPM</span></div>
                    <div className="flex justify-between"><span>الحمل الأسبوعي الحالي:</span> <span className="text-stone-900">{selectedAthlete.weeklyDistance}</span></div>
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

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
  Calendar
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
  
  const [activeSubView, setActiveSubView] = useState<'dashboard' | 'athlete_detail' | 'review_plan' | 'review_alert' | 'all_athletes'>('dashboard');
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
  const [alertRecommendations, setAlertRecommendations] = useState<Record<string, string>>({});

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
        warnings.push(`⚠️ فحص السلامة: تمرين "${workout.title}" بمسافة ${workout.distance} يتجاوز نصف الحِمل الأسبوعي الكلي للمستجد (${athlete.weeklyDistance})، مما يزيد من خطر الإصابة.`);
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
          coachStyle: "التركيز على ميكانيكية الحركة وزيادة التحمل بنسبة ١٠٪ أسبوعياً كحد أقصى"
        })
      });
      const data = await response.json();
      if (data.workouts && data.workouts.length > 0) {
        setDraftWorkouts(data.workouts);
        runSafetyCheck(data.workouts, selectedAthlete);
        setCurrentPlanMonth(1);
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
        setToastMessage(`✦ تم تمديد الخطة بنجاح للشهر ${currentPlanMonth + 1} مع تطبيق تدرج الحِمل الآمن (≤ 10٪).`);
      }
    } catch (error) {
      console.error("Error extending training plan:", error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Fetch alert risk recommendations
  React.useEffect(() => {
    const fetchAlertRecommendations = async () => {
      const recommendations: Record<string, string> = {};
      for (const alert of activeAlerts) {
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
            recommendations[alert.id] = data.recommendation;
          }
        } catch (error) {
          console.error("Error fetching risk recommendation:", error);
        }
      }
      setAlertRecommendations(prev => ({ ...prev, ...recommendations }));
    };

    if (activeAlerts.length > 0) {
      fetchAlertRecommendations();
    }
  }, [activeAlerts, athletes]);

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
    alert(`✓ تم اعتماد وتفعيل الخطة التدريبية بنجاح لـ ${selectedAthlete.name}!`);
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
  };

  // Filter athletes based on search
  const filteredAthletes = athletes.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn" dir="rtl">
      
      {/* Sub tabs inside Coach mode */}
      <div className="flex border-b border-stone-200 overflow-x-auto pb-px gap-6">
        <button
          onClick={() => setActiveSubView('dashboard')}
          className={`pb-4 text-sm font-medium transition-all shrink-0 ${
            activeSubView === 'dashboard' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          مركز القيادة
        </button>
        <button
          onClick={() => setActiveSubView('all_athletes')}
          className={`pb-4 text-sm font-medium transition-all shrink-0 ${
            activeSubView === 'all_athletes' || activeSubView === 'athlete_detail' ? 'text-emerald-900 font-bold border-b-2 border-emerald-800' : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          قائمة اللاعبين والملفات
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* --- C1: MAIN COMMAND CENTER --- */}
        {activeSubView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-4xl font-bold text-stone-950 tracking-tight mb-2 font-display">مركز القيادة (Coach Control)</h1>
                <p className="text-stone-500 text-sm font-sans font-light">نظرة عامة على أداء لاعبيك، تنبيهات الإجهاد، واعتمادات الذكاء الاصطناعي الجاهزة.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-6 py-3 bg-emerald-950 text-white hover:bg-emerald-800 transition-colors text-xs font-bold tracking-widest uppercase rounded-sm shadow-sm"
              >
                <Plus className="w-4 h-4 ml-1" /> إضافة لاعب جديد
              </button>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div 
                onClick={() => setActiveSubView('all_athletes')}
                className="bg-white p-6 border-r-4 border-emerald-800 shadow-sm flex justify-between items-center cursor-pointer hover:bg-stone-50/50 transition-all rounded-sm"
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1.5 tracking-wider">العدّاؤون النشطون</p>
                  <h3 className="text-3xl font-light text-emerald-950">{athletes.length}</h3>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-sm border border-emerald-100/50 flex items-center justify-center text-emerald-800">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div 
                onClick={() => startPlanReview(athletes.find(a => a.status === 'needs_review') || athletes[2] || athletes[0])}
                className="bg-white p-6 border-r-4 border-amber-500 shadow-sm flex justify-between items-center cursor-pointer hover:bg-stone-50/50 transition-all rounded-sm"
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1.5 tracking-wider">مسودات خطط للمراجعة</p>
                  <h3 className="text-3xl font-light text-amber-950">
                    {athletes.filter(a => a.status === 'needs_review').length}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-sm border border-amber-100 flex items-center justify-center text-amber-800">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
              </div>

              <div 
                className={`p-6 border-r-4 shadow-sm flex justify-between items-center rounded-sm transition-all ${
                  activeAlerts.length > 0 
                    ? 'border-red-600 bg-red-50/20 hover:bg-red-50/40 cursor-pointer' 
                    : 'border-stone-200 bg-white'
                }`}
              >
                <div>
                  <p className="text-[10px] uppercase text-stone-400 font-bold mb-1.5 tracking-wider">تنبيهات الحمل الزائد</p>
                  <h3 className={`text-3xl font-light ${activeAlerts.length > 0 ? 'text-red-700' : 'text-stone-700'}`}>
                    {activeAlerts.length}
                  </h3>
                </div>
                <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${
                  activeAlerts.length > 0 ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

            </div>

            {/* Priority Actions and List layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Actions columns */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xs font-bold tracking-widest uppercase text-stone-500 mb-2">إجراءات مستعجلة ذات أولوية</h2>

                {activeAlerts.length === 0 && athletes.filter(a => a.status === 'needs_review').length === 0 && (
                  <div className="bg-white p-8 border border-stone-200 text-center text-stone-500 text-sm rounded-sm">
                    ✓ جميع الإجراءات مكتملة! لا توجد تنبيهات أو مسودات معلقة حالياً.
                  </div>
                )}

                {/* Risk Alerts Cards */}
                {activeAlerts.map((alert) => {
                  const athlete = athletes.find(a => a.id === alert.athleteId) || athletes[1];
                  return (
                    <div 
                      key={alert.id}
                      className="bg-white border-r-4 border-red-600 shadow-sm p-6 relative group rounded-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12">
                            <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-12 h-12" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-stone-950 text-base">{athlete.name}</h4>
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> {alert.title}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-light mb-6">
                        {alert.description} <strong className="text-red-800 font-semibold">توصية الذكاء الاصطناعي:</strong> {alertRecommendations[alert.id] || "تقليص مسافة الجري الطويل المجدول في نهاية الأسبوع بمقدار ٤ كم فورياً لتجنب تمزق العضلة الخلفية."}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => {
                            onResolveAlert(alert.id, { workoutIndex: 3, field: 'distance', value: '14 كم' });
                            alert(`✓ تم تطبيق تخفيض مسافة جري خالد ن. بمقدار 4 كم بنجاح وتأمين الحمل التدريبي.`);
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-colors shadow-sm"
                        >
                          اعتماد تقليص المسافة (الذكاء)
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAthleteId(athlete.id);
                            setActiveSubView('athlete_detail');
                          }}
                          className="px-4 py-2 bg-stone-50 border border-stone-200 text-stone-700 text-[10px] font-bold tracking-widest uppercase rounded-sm hover:bg-stone-100 transition-colors"
                        >
                          المراجعة اليدوية للملف التدريبي
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Draft Review Cards */}
                {athletes.filter(a => a.status === 'needs_review').map((athlete) => (
                  <div 
                    key={athlete.id}
                    className="bg-white border border-stone-200 shadow-sm p-6 relative group rounded-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12">
                          <SketchAvatar name={athlete.name} avatarUrl={athlete.avatar} className="w-12 h-12" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-stone-950 text-base">{athlete.name}</h4>
                          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                            <BrainCircuit className="w-3.5 h-3.5" /> مسودة الخطة من الذكاء الاصطناعي جاهزة للمراجعة
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-light mb-6">
                      تم إنشاء خطة الشهر الثاني المخصصة لـ {athlete.name} (المستهدف: {athlete.goal}) مدمجاً بها زيادة تكتيكية تدريجية في حجم التدريب الهوائي وهرولة التحمل لمسافة ١٥ كم.
                    </p>
                    <button 
                      onClick={() => startPlanReview(athlete)}
                      className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm transition-all shadow-sm"
                    >
                      مراجعة وتعديل الخطة التدريبية
                    </button>
                  </div>
                ))}

              </div>

              {/* Mini Roster sidebar in C1 */}
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xs font-bold tracking-widest uppercase text-stone-500">قائمة العدّائين الفورية</h2>
                  <button 
                    onClick={() => setActiveSubView('all_athletes')}
                    className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider hover:underline"
                  >
                    عرض الكل
                  </button>
                </div>

                <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
                  {athletes.map((ath, idx) => (
                    <div 
                      key={ath.id}
                      onClick={() => {
                        setSelectedAthleteId(ath.id);
                        setActiveSubView('athlete_detail');
                      }}
                      className={`p-4 flex items-center justify-between hover:bg-stone-50 cursor-pointer transition-colors ${
                        idx !== athletes.length - 1 ? 'border-b border-stone-150' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SketchAvatar name={ath.name} avatarUrl={ath.avatar} className="w-8 h-8" />
                        <div>
                          <h4 className="font-semibold text-stone-900 text-xs">{ath.name}</h4>
                          <p className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">آخر نشاط: {ath.lastActivity}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                          ath.status === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                          ath.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ath.status === 'on_track' && 'مستقر'}
                          {ath.status === 'needs_review' && 'مراجعة'}
                          {ath.status === 'at_risk' && 'حمل زائد'}
                        </span>
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
            className="space-y-8"
          >
            <button 
              onClick={() => setActiveSubView('dashboard')}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-all uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 ml-1" /> العودة للوحة القيادة
            </button>

            {/* Profile Overview Card */}
            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-150">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16">
                    <SketchAvatar name={selectedAthlete.name} avatarUrl={selectedAthlete.avatar} className="w-16 h-16" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-stone-950">{selectedAthlete.name}</h2>
                    <p className="text-xs text-stone-500 mt-1 font-mono">الهدف: {selectedAthlete.goal}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => startPlanReview(selectedAthlete)}
                    className="px-4 py-2.5 bg-emerald-950 text-white hover:bg-emerald-900 transition-colors text-xs font-bold uppercase rounded-sm shadow-sm"
                  >
                    تعديل وبناء الخطة التدريبية
                  </button>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1">المسافة الأسبوعية</span>
                  <span className="text-xl font-bold font-mono text-stone-800">{selectedAthlete.weeklyDistance}</span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1">نبض الراحة متوسط</span>
                  <span className="text-xl font-bold font-mono text-stone-800">{selectedAthlete.restingHR} BPM</span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1">الحمل التدريبي</span>
                  <span className={`text-xl font-bold font-mono ${selectedAthlete.trainingLoad > 200 ? 'text-red-700' : 'text-emerald-800'}`}>
                    {selectedAthlete.trainingLoad}
                  </span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm text-center">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold mb-1">الرتم المتوسط</span>
                  <span className="text-xl font-bold font-mono text-stone-800">{selectedAthlete.recentPace}/كم</span>
                </div>

              </div>

              {/* Athlete Workout List */}
              <div className="space-y-4 pt-6 border-t border-stone-100">
                <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase">الجدول التدريبي الحالي للاعب</h3>
                
                <div className="border border-stone-200 rounded-sm overflow-hidden divide-y divide-stone-150">
                  {selectedAthlete.workouts.map((workout, index) => (
                    <div key={workout.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white hover:bg-stone-50/50 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-stone-400">{workout.date}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-sm">{workout.type}</span>
                        </div>
                        <h4 className="font-semibold text-stone-950 text-sm">{workout.title}</h4>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-stone-500">{workout.distance} • {workout.duration}</span>
                        {workout.completed ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل ومسجل
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-stone-400 bg-stone-50 border border-stone-200 px-2.5 py-1 rounded-sm">
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

        {/* --- C3: DETAILED PLAN REVIEW / CUSTOMIZATION SCREEN --- */}
        {activeSubView === 'review_plan' && (
          <motion.div
            key="review_plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setActiveSubView('dashboard')}
                className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-all uppercase tracking-widest"
              >
                <ArrowRight className="w-4 h-4 ml-1" /> إلغاء المراجعة والرجوع
              </button>
              
              <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> مسودة معززة بالذكاء الاصطناعي
              </div>
            </div>

             <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-8 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-light text-stone-950 mb-1">مراجعة وتخصيص مسودة خطة {selectedAthlete.name}</h2>
                  <p className="text-stone-500 text-sm">عدّل التكرارات، المسافات، أو الأهداف لكل تمرين قبل إرسال الخطة للتفعيل فورياً عند اللاعب.</p>
                </div>
              </div>

              {/* AI Action Center Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-stone-50 border border-stone-200 rounded-sm gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-sm">
                    الشهر التدريبي المستهدف: الشهر {currentPlanMonth}
                  </span>
                  <p className="text-xs text-stone-500 font-light pt-1">
                    يمكّنك المساعد من إعادة توليد المسودة أو تمديدها للأشهر التالية لضمان تدرج الحمل (Progressive Overload) الآمن.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    disabled={isGeneratingPlan}
                    onClick={handleGenerateAiPlan}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-950 text-white hover:bg-emerald-900 disabled:opacity-50 text-xs font-bold uppercase rounded-sm shadow-sm transition-all"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
                    <span>{isGeneratingPlan ? "جاري معالجة الخطة..." : "إعادة توليد الخطة تلقائياً ✦"}</span>
                  </button>

                  <button
                    disabled={isGeneratingPlan}
                    onClick={handleExtendAiPlan}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 disabled:opacity-50 text-xs font-bold uppercase rounded-sm transition-all shadow-sm"
                  >
                    <Plus className="w-5 h-5 text-emerald-800 shrink-0" />
                    <span>{isGeneratingPlan ? "جاري التمديد..." : "اقترح خطة الشهر التالي (≤ 10٪) ✦"}</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Safety Warnings Card */}
              {safetyStatus.warnings.length > 0 && (
                <div className="p-5 bg-red-50 border-r-4 border-red-600 rounded-sm space-y-2 animate-fadeIn">
                  <h4 className="text-red-950 font-bold text-xs uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    تنبيهات سلامة الحِمل التدريبي من StrideLab AI
                  </h4>
                  <ul className="list-inside text-xs text-red-800 space-y-1.5">
                    {safetyStatus.warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editable workouts list */}
              <div className="space-y-4">
                {draftWorkouts.map((workout, index) => (
                  <div key={workout.id} className="p-5 border border-stone-200 rounded-sm bg-stone-50/50 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-950 text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-stone-500 font-mono">{workout.date}</span>
                      </div>

                      <div className="flex gap-2">
                        <select 
                          value={workout.type}
                          onChange={(e) => handleWorkoutEdit(index, 'type', e.target.value)}
                          className="bg-white border border-stone-200 text-xs font-medium px-2 py-1.5 outline-none rounded-sm"
                        >
                          <option value="Easy">جري سهل (Easy)</option>
                          <option value="Tempo">جري تمبو (Tempo)</option>
                          <option value="Intervals">فترات سرعة (Intervals)</option>
                          <option value="Long Run">جري طويل (Long Run)</option>
                          <option value="Recovery">استشفاء (Recovery)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">عنوان التمرين</label>
                        <input 
                          type="text" 
                          value={workout.title}
                          onChange={(e) => handleWorkoutEdit(index, 'title', e.target.value)}
                          className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">المسافة المستهدفة</label>
                        <input 
                          type="text" 
                          value={workout.distance}
                          onChange={(e) => handleWorkoutEdit(index, 'distance', e.target.value)}
                          className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase">المدة الزمنية</label>
                        <input 
                          type="text" 
                          value={workout.duration}
                          onChange={(e) => handleWorkoutEdit(index, 'duration', e.target.value)}
                          className="w-full bg-white border border-stone-200 px-3 py-2 text-xs rounded-sm outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-stone-150 flex justify-end gap-3">
                <button 
                  onClick={() => setActiveSubView('dashboard')}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase rounded-sm border border-stone-200"
                >
                  إلغاء التغييرات
                </button>
                <button 
                  onClick={submitApprovedPlan}
                  className="px-6 py-3 bg-emerald-950 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-sm shadow-md"
                >
                  اعتماد الخطة وإرسالها للعداء ✓
                </button>
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
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-950 tracking-tight font-display">ملفات العدائين والقائمة التدريبية</h1>
                <p className="text-stone-500 text-sm">البحث وإدارة اللاعبين ومستويات الجهد ومناطق نبضات القلب الخاصة بهم.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-950 text-white text-xs font-bold uppercase rounded-sm hover:bg-emerald-800 transition-colors"
              >
                <Plus className="w-4 h-4 ml-1" /> إضافة لاعب جديد
              </button>
            </div>

            {/* Search filter */}
            <div className="relative bg-white border border-stone-200 rounded-sm shadow-sm p-2 flex items-center">
              <Search className="w-5 h-5 text-stone-400 mr-3 shrink-0" />
              <input 
                type="text" 
                placeholder="ابحث عن لاعب بالاسم..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs outline-none px-2 py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAthletes.map((ath) => (
                <div 
                  key={ath.id}
                  onClick={() => {
                    setSelectedAthleteId(ath.id);
                    setActiveSubView('athlete_detail');
                  }}
                  className="bg-white border border-stone-200 shadow-sm p-6 hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer rounded-sm flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <SketchAvatar name={ath.name} avatarUrl={ath.avatar} className="w-12 h-12" />
                      <div>
                        <h4 className="font-semibold text-stone-950 text-sm">{ath.name}</h4>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-sm ${
                          ath.status === 'on_track' ? 'bg-emerald-100 text-emerald-800' :
                          ath.status === 'needs_review' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ath.status === 'on_track' && 'مستقر ومثالي'}
                          {ath.status === 'needs_review' && 'بانتظار المراجعة'}
                          {ath.status === 'at_risk' && 'تنبيه حمل زائد'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-stone-100 pt-3 space-y-2 text-xs text-stone-500 font-mono">
                      <div className="flex justify-between"><span>المسافة الأسبوعية:</span> <span className="font-bold text-stone-800">{ath.weeklyDistance}</span></div>
                      <div className="flex justify-between"><span>نبض الراحة:</span> <span className="font-bold text-stone-800">{ath.restingHR} BPM</span></div>
                      <div className="flex justify-between"><span>الحمل التراكمي:</span> <span className="font-bold text-stone-800">{ath.trainingLoad}</span></div>
                    </div>
                  </div>

                  <button className="w-full text-center mt-6 py-2 bg-stone-50 border border-stone-200 hover:bg-emerald-950 hover:border-emerald-950 hover:text-white transition-all text-[10px] font-bold uppercase tracking-wider rounded-sm">
                    عرض السجل التدريبي الكامل
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Add Athlete Modal (C7) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-md w-full p-8 rounded-sm space-y-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute left-6 top-6 p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-stone-900 font-display">إضافة لاعب جديد يدوياً للتدريب</h3>
              <p className="text-stone-400 text-xs mt-1">سيتم ربط بيانات هذا اللاعب ليتسنى للذكاء الاصطناعي البدء في تجهيز المسودات له.</p>
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
                <label className="text-[10px] font-bold text-stone-500 uppercase">الهدف التدريبي</label>
                <input 
                  type="text" 
                  value={newAthleteGoal} 
                  onChange={(e) => setNewAthleteGoal(e.target.value)}
                  placeholder="مثال: إنهاء ماراثون الرياض في 3:45" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">نبض القلب أثناء الراحة (BPM)</label>
                <input 
                  type="number" 
                  value={newAthleteHR} 
                  onChange={(e) => setNewAthleteHR(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold py-3 uppercase tracking-widest rounded-sm transition-colors mt-4 shadow-sm"
              >
                تأكيد وإضافة اللاعب للرصيد التدريبي
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Premium Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-stone-950 border border-stone-800 text-stone-100 px-5 py-4 rounded-sm shadow-2xl flex items-center gap-3 animate-fadeIn z-50 max-w-sm" style={{ direction: 'rtl' }}>
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-light leading-relaxed">{toastMessage}</p>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-stone-100 text-xs font-mono mr-auto shrink-0 pr-2"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

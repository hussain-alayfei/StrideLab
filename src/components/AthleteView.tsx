import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SketchAvatar } from './SketchAvatar';
import { 
  Target, 
  Activity, 
  ChevronLeft, 
  Play, 
  CheckCircle2, 
  Calendar, 
  Video, 
  Send, 
  User, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Compass, 
  Heart,
  Flame,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { Workout, Coach, ChatMessage } from '../types';

interface AthleteViewProps {
  workouts: Workout[];
  onCompleteWorkout: (id: string) => void;
  selectedCoach: Coach | null;
  hasApprovedPlan: boolean;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
  videoAnalysis: any;
  setVideoAnalysis: (analysis: any) => void;
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  onResetData: () => void;
  onUnsubscribeCoach?: () => void;
}

export default function AthleteView({
  workouts,
  onCompleteWorkout,
  selectedCoach,
  hasApprovedPlan,
  chatMessages,
  onSendMessage,
  videoAnalysis,
  setVideoAnalysis,
  activeSubTab,
  setActiveSubTab,
  onResetData,
  onUnsubscribeCoach
}: AthleteViewProps) {
  
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [workoutProgress, setWorkoutProgress] = useState(0);
  const [workoutTimerActive, setWorkoutTimerActive] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState('00:00');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Dynamic Dashboard Insight State
  const [dashboardInsight, setDashboardInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState<boolean>(false);

  React.useEffect(() => {
    const fetchInsight = async () => {
      setIsLoadingInsight(true);
      try {
        const completedWorkouts = workouts.filter(w => w.completed).length;
        const totalWorkouts = workouts.length;
        const activeAthlete = {
          restingHR: 54,
          trainingLoad: 120,
          status: 'on_track',
          recentPace: '4:45',
          completedWorkoutsCount: completedWorkouts,
          totalWorkoutsCount: totalWorkouts
        };
        const response = await fetch('/api/ai/dashboard-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeAthlete)
        });
        const data = await response.json();
        if (data.insight) {
          setDashboardInsight(data.insight);
        } else {
          setDashboardInsight(`بناءً على أدائك الأخير وثبات نطاقات نبضك، أنت في الطريق لتحقيق هدفك بأمان تام تحت إشراف المساعد الذكي و${selectedCoach?.name || 'المدرب أحمد أحمد'}.`);
        }
      } catch (error) {
        console.error("Error fetching dashboard insight:", error);
        setDashboardInsight(`بناءً على أدائك الأخير وثبات نطاقات نبضك، أنت في الطريق لتحقيق هدفك بأمان تام تحت إشراف المساعد الذكي و${selectedCoach?.name || 'المدرب أحمد أحمد'}.`);
      } finally {
        setIsLoadingInsight(false);
      }
    };

    fetchInsight();
  }, [workouts, selectedCoach]);

  // Video Upload and Analysis using real backend Gemini API
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsAnalyzing(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result?.toString().split(',')[1] || '';
          const response = await fetch('/api/ai/analyze-running-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoBase64: base64String,
              mimeType: file.type,
              fileName: file.name
            })
          });
          const data = await response.json();
          setVideoAnalysis(data);
        } catch (error) {
          console.error("Error analyzing running form:", error);
          // Safe fallback
          setVideoAnalysis({
            cadence: 174,
            strideLength: "1.12 م",
            bodyLean: "5.8 درجات للأمام",
            footStrike: "منتصف القدم (Midfoot)",
            score: 92,
            feedback: "حدث خطأ أثناء الاتصال بالخادم، ولكن بناءً على عينة الميكانيكية التلقائية: طريقة جري ممتازة ومتوازنة هندسياً! زاوية ميلان الجسم للأمام مثالية بـ 5.8 درجات، مما يقلل من الصدمات على الركبة. يُنصح بزيادة وتيرة إيقاع الخطوات (Cadence) لتصل إلى 180 خطوة/دقيقة."
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      reader.onerror = () => {
        setIsAnalyzing(false);
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Workout simulator timer
  const startWorkoutSimulation = (workout: Workout) => {
    setWorkoutTimerActive(true);
    setWorkoutProgress(0);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setWorkoutProgress(currentProgress);
      // simulate elapsed time
      const min = Math.floor((currentProgress * 4.5) / 10);
      setSimulatedTime(`0${min}:34`);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setWorkoutTimerActive(false);
        onCompleteWorkout(workout.id);
        setSelectedWorkout(prev => prev ? { ...prev, completed: true } : null);
      }
    }, 400);
  };

  const handleSend = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const activeWorkout = workouts.find(w => !w.completed) || workouts[0];

  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Sub Navigation Tabs for Athlete */}
      <div className="flex border-b border-stone-200 overflow-x-auto pb-px gap-6">
        {[
          { id: 'dashboard', label: 'الرئيسية' },
          { id: 'schedule', label: 'خطتي الكاملة' },
          { id: 'analysis', label: 'تحليل الجري (AI)' },
          { id: 'chat', label: 'محادثة المدرب' },
          { id: 'profile', label: 'ملفي الرياضي' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id);
              setSelectedWorkout(null);
            }}
            className={`pb-4 text-sm font-medium transition-all relative shrink-0 ${
              activeSubTab === tab.id 
                ? 'text-emerald-900 font-bold border-b-2 border-emerald-800' 
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* --- 1. DASHBOARD SUBTAB --- */}
        {activeSubTab === 'dashboard' && !selectedWorkout && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-4xl font-bold text-stone-950 tracking-tight mb-2 font-display">أهلاً بك مجدداً، فهد</h1>
                <p className="text-stone-500 text-sm">رحلتك التدريبية المخصصة تحت إشراف {selectedCoach?.name || 'المدرب أحمد'}.</p>
              </div>
              <button 
                onClick={onResetData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-sm text-xs transition-colors border border-stone-200/60"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة تعيين البيانات الافتراضية</span>
              </button>
            </div>

            {/* AI Insights banner */}
            <div className="bg-white border-r-4 border-emerald-800 shadow-sm p-6 relative overflow-hidden rounded-sm">
              <div className="absolute left-0 top-0 w-32 h-32 bg-stone-50 rounded-br-full -z-10 opacity-50"></div>
              <div className="flex flex-col md:flex-row gap-5 items-start">
                <div className="bg-stone-50 p-3 rounded-sm text-emerald-800 border border-stone-200 shrink-0">
                  <Sparkles className={`w-6 h-6 ${isLoadingInsight ? 'animate-pulse text-emerald-500' : ''}`} />
                </div>
                <div className="w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-sm">تحليل الاستشفاء والنبض (StrideLab AI)</span>
                  </div>
                  {isLoadingInsight ? (
                    <div className="space-y-2 animate-pulse py-1">
                      <div className="h-3 bg-stone-200 rounded-sm w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded-sm w-5/6"></div>
                    </div>
                  ) : (
                    <p className="text-stone-700 text-sm leading-relaxed font-light">
                      {dashboardInsight || `بناءً على أدائك الأخير وثبات نطاقات نبضك، أنت في الطريق لتحقيق هدفك بأمان تام تحت إشراف المساعد الذكي و${selectedCoach?.name || 'المدرب أحمد أحمد'}.`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Primary content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Today's Workout Card */}
              <div className="bg-white border border-stone-200 shadow-sm p-8 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-bold tracking-widest uppercase text-stone-500">خطة اليوم المقررة</h2>
                    <button 
                      onClick={() => setActiveSubTab('schedule')}
                      className="text-emerald-800 text-[11px] font-bold uppercase tracking-widest hover:text-emerald-900 flex items-center gap-1"
                    >
                      <span>الجدول الكامل</span>
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  </div>

                  {activeWorkout ? (
                    <div 
                      onClick={() => setSelectedWorkout(activeWorkout)}
                      className={`group border p-6 rounded-sm cursor-pointer transition-all flex justify-between items-center ${
                        activeWorkout.completed 
                          ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50' 
                          : 'border-stone-200 bg-stone-50 hover:bg-emerald-50/50 hover:border-emerald-200'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1.5 block">
                          {activeWorkout.type === 'Tempo' && 'جري تمبو (Tempo Run)'}
                          {activeWorkout.type === 'Easy' && 'جري سهل (Easy Run)'}
                          {activeWorkout.type === 'Intervals' && 'فترات سرعة (Intervals)'}
                          {activeWorkout.type === 'Long Run' && 'جري طويل (Long Run)'}
                          {activeWorkout.type === 'Recovery' && 'جري استشفائي (Recovery)'}
                        </span>
                        <h3 className="text-2xl font-light text-stone-950 mb-1">{activeWorkout.title}</h3>
                        <div className="text-stone-500 text-sm flex items-center gap-3">
                          <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-stone-400" />{activeWorkout.distance}</span>
                          <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-stone-400" />{activeWorkout.duration}</span>
                        </div>
                      </div>

                      {activeWorkout.completed ? (
                        <div className="bg-emerald-800 text-white p-3 rounded-full shadow-sm">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-emerald-950 text-white flex items-center justify-center rounded-sm group-hover:bg-emerald-800 transition-colors shadow-sm">
                          <Play className="w-5 h-5 mr-0.5" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-500 text-sm">
                      تم الانتهاء من جميع تمارين هذا الأسبوع بنجاح! 🎉
                    </div>
                  )}
                </div>

                <div className="border-t border-stone-100 pt-6 mt-6 flex justify-between text-xs text-stone-400 font-mono">
                  <span>تم إنجاز: {workouts.filter(w => w.completed).length} من أصل {workouts.length} تمارين</span>
                  <span>النسبة: {Math.round((workouts.filter(w => w.completed).length / workouts.length) * 100)}%</span>
                </div>
              </div>

              {/* Coach status & watch monitoring */}
              <div className="space-y-6">
                
                {/* Coach status */}
                <div className="bg-white border-r-4 border-stone-300 shadow-sm p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 shrink-0">
                        <SketchAvatar name={selectedCoach?.name || 'المدرب أحمد'} avatarUrl={selectedCoach?.avatar} className="w-16 h-16" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-950 text-lg font-display">{selectedCoach?.name || 'المدرب أحمد'}</h3>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest flex items-center gap-1 mt-1 font-bold">
                          {hasApprovedPlan ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="text-emerald-800">الخطة التدريبية معتمدة</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span className="text-amber-700">بانتظار اعتماد التعديلات من المدرب</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setActiveSubTab('chat')}
                        className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 font-bold tracking-wide px-4 py-2.5 rounded-sm transition-all"
                      >
                        مراسلة
                      </button>
                      <button 
                        onClick={() => setShowCancelConfirm(true)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold tracking-wide px-4 py-2.5 rounded-sm transition-all"
                      >
                        إلغاء الاشتراك
                      </button>
                    </div>
                  </div>

                  {showCancelConfirm && (
                    <div className="bg-red-50/70 border border-red-100 p-4 rounded-sm space-y-3 mt-4 text-right">
                      <p className="text-xs text-red-800 font-bold">تنبيه إلغاء التعاقد والاشتراك:</p>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        هل أنت متأكد من رغبتك في إلغاء اشتراكك وتجميد خطتك التدريبية الحالية مع المدرب {selectedCoach?.name || 'أحمد'}؟ سيتعين عليك اختيار مدرب بديل للبدء بخطة جديدة تماماً.
                      </p>
                      <div className="flex justify-end gap-2.5 pt-1">
                        <button
                          onClick={() => {
                            setShowCancelConfirm(false);
                            if (onUnsubscribeCoach) onUnsubscribeCoach();
                          }}
                          className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-sm transition-colors shadow-sm"
                        >
                          نعم، إلغاء الاشتراك وتأكيد الإلغاء
                        </button>
                        <button
                          onClick={() => setShowCancelConfirm(false)}
                          className="text-[10px] bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold px-3 py-1.5 rounded-sm transition-colors"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Smart wearable connection */}
                <div className="bg-emerald-950 text-white p-6 rounded-sm relative overflow-hidden shadow-sm">
                  <div className="absolute left-0 top-0 opacity-10">
                    <div className="w-32 h-32 border-[12px] border-current rounded-full -translate-x-10 -translate-y-10"></div>
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> المراقبة الحيوية اللحظية
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300 tracking-wider">متصل الآن</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed font-light text-emerald-100 mb-6">
                      ساعة Apple Watch الخاصة بك تتزامن بنجاح. نقوم بمراقبة حِمل التمارين ومستويات نبض الاستشفاء والجهد فورياً.
                    </p>

                    {/* Mini metrics cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-900/40 p-2.5 rounded border border-emerald-800/30 text-center">
                        <span className="text-[9px] uppercase block text-emerald-300 font-medium mb-1">نبض الراحة</span>
                        <div className="text-lg font-mono font-bold flex justify-center items-center gap-0.5">
                          <span>54</span>
                          <span className="text-[10px] text-emerald-400">BPM</span>
                        </div>
                      </div>
                      <div className="bg-emerald-900/40 p-2.5 rounded border border-emerald-800/30 text-center">
                        <span className="text-[9px] uppercase block text-emerald-300 font-medium mb-1">السعرات اليومية</span>
                        <div className="text-lg font-mono font-bold flex justify-center items-center gap-0.5">
                          <span>420</span>
                          <span className="text-[10px] text-emerald-400">KCAL</span>
                        </div>
                      </div>
                      <div className="bg-emerald-900/40 p-2.5 rounded border border-emerald-800/30 text-center">
                        <span className="text-[9px] uppercase block text-emerald-300 font-medium mb-1">جودة النوم</span>
                        <div className="text-lg font-mono font-bold flex justify-center items-center gap-0.5">
                          <span>88</span>
                          <span className="text-[10px] text-emerald-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* --- 2. FULL SCHEDULE SUBTAB --- */}
        {activeSubTab === 'schedule' && !selectedWorkout && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-stone-950 tracking-tight mb-2 font-display">جدولك التدريبي الأسبوعي</h1>
              <p className="text-stone-500 text-sm">الخطة المعتمدة من قبل {selectedCoach?.name || 'المدرب أحمد'} ومعدلة ذكياً لتناسب أهدافك.</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
              <div className="p-6 bg-stone-50 border-b border-stone-200 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-sm">الأسبوع 3: زيادة التحمل</span>
                  <span className="text-xs text-stone-500">تم إنجاز {workouts.filter(w => w.completed).length} من أصل {workouts.length} أيام تدريب</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-xs text-stone-600 font-medium">خطة معتمدة</span>
                </div>
              </div>

              <div className="divide-y divide-stone-150">
                {workouts.map((workout) => (
                  <div 
                    key={workout.id}
                    onClick={() => setSelectedWorkout(workout)}
                    className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-stone-50/70 transition-all cursor-pointer ${
                      workout.completed ? 'bg-emerald-50/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-sm border shrink-0 ${
                        workout.completed 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-wide">{workout.date}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                            workout.type === 'Tempo' ? 'bg-amber-100 text-amber-800' :
                            workout.type === 'Easy' ? 'bg-blue-100 text-blue-800' :
                            workout.type === 'Intervals' ? 'bg-purple-100 text-purple-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {workout.type}
                          </span>
                        </div>
                        <h3 className={`text-lg font-medium text-stone-950 ${workout.completed ? 'line-through text-stone-400' : ''}`}>
                          {workout.title}
                        </h3>
                        <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                          {workout.description || 'تمرين تكتيكي لرفع معدلات اللياقة والتحمّل العضلي.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-stone-150">
                      <div className="text-stone-600 text-xs font-mono flex items-center gap-3">
                        <span className="bg-stone-100 px-2.5 py-1 rounded-sm">{workout.distance}</span>
                        <span className="bg-stone-100 px-2.5 py-1 rounded-sm">{workout.duration}</span>
                      </div>
                      
                      {workout.completed ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-sm">
                          <CheckCircle2 className="w-4 h-4" /> مكتمل
                        </span>
                      ) : (
                        <button 
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950 text-white hover:bg-emerald-800 transition-colors text-xs font-bold tracking-wider uppercase rounded-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> البدء
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* --- 3. WORKOUT DETAIL SIMULATOR VIEW --- */}
        {selectedWorkout && (
          <motion.div
            key="workout_detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedWorkout(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-all uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 ml-1" /> الرجوع لقائمة التمارين
            </button>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-stone-150">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-stone-400 font-mono font-bold uppercase tracking-wider">{selectedWorkout.date}</span>
                    <span className="w-1 h-1 rounded-full bg-stone-300"></span>
                    <span className="text-xs font-bold text-emerald-800">{selectedWorkout.type}</span>
                  </div>
                  <h1 className="text-3xl font-light text-stone-950">{selectedWorkout.title}</h1>
                </div>

                <div className="flex gap-4 font-mono">
                  <div className="bg-stone-50 border border-stone-200 px-4 py-2 text-center rounded-sm">
                    <span className="text-[10px] text-stone-400 block uppercase font-sans font-bold">المسافة</span>
                    <span className="text-lg font-bold text-stone-800">{selectedWorkout.distance}</span>
                  </div>
                  <div className="bg-stone-50 border border-stone-200 px-4 py-2 text-center rounded-sm">
                    <span className="text-[10px] text-stone-400 block uppercase font-sans font-bold">المدة المقدرة</span>
                    <span className="text-lg font-bold text-stone-800">{selectedWorkout.duration}</span>
                  </div>
                </div>
              </div>

              {/* Workout description and guidelines */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase">تعليمات التمرين والمراحل التدريبية</h3>
                  
                  <div className="space-y-4">
                    <div className="p-5 border-r-4 border-blue-400 bg-stone-50 rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-stone-900 text-sm">المرحلة الأولى: الإحماء (Warm up)</h4>
                        <span className="text-xs text-blue-800 font-bold">15 دقيقة</span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        هرولة خفيفة لتهيئة العضلات مع تمارين إطالة ديناميكية. ابقَ في نطاق معدل ضربات القلب الأول (Zone 1).
                      </p>
                    </div>

                    <div className="p-5 border-r-4 border-amber-500 bg-stone-50 rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-stone-900 text-sm">المرحلة الثانية: الركض المستهدف (Target Effort)</h4>
                        <span className="text-xs text-amber-800 font-bold">20 دقيقة</span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        رفع الرتم لسرعة التمبو المستهدفة (Zone 3 - حد الـ Lactate Threshold). تواصل مع تنفسك وحافظ على إيقاع الخطوات متزن.
                      </p>
                    </div>

                    <div className="p-5 border-r-4 border-emerald-500 bg-stone-50 rounded-sm">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-stone-900 text-sm">المرحلة الثالثة: التهدئة (Cool down)</h4>
                        <span className="text-xs text-emerald-800 font-bold">10 دقائق</span>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">
                        هرولة خفيفة متناقصة تدريجياً، متبوعة بتمارين إطالة ثابتة (Static stretching) للمساعدة في سرعة الاستشفاء.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated session launcher */}
                <div className="bg-stone-50 border border-stone-200 p-6 rounded-sm flex flex-col justify-between">
                  <div className="text-center py-4">
                    <h3 className="font-bold text-stone-800 text-sm mb-4">محاكي ساعة StrideLab</h3>
                    
                    {workoutTimerActive ? (
                      <div className="space-y-4">
                        <div className="w-24 h-24 rounded-full border-4 border-emerald-800 border-t-transparent animate-spin mx-auto flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-800 font-mono font-light rotate-0">{workoutProgress}%</span>
                        </div>
                        <div>
                          <p className="text-lg font-mono font-bold text-emerald-950">{simulatedTime}</p>
                          <p className="text-[10px] text-emerald-700 animate-pulse font-bold mt-1">جارٍ محاكاة التزامن والركض...</p>
                        </div>
                      </div>
                    ) : selectedWorkout.completed ? (
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                          <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">تم إنجاز التمرين بنجاح!</p>
                          <p className="text-xs text-stone-400 font-light mt-1">تمت مزامنة البيانات وتحديث تقارير الاستشفاء للمدرب.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 py-6">
                        <Play className="w-12 h-12 text-stone-300 mx-auto" />
                        <p className="text-xs text-stone-500">ابدأ المحاكاة لتزامن الجري لحظياً مع حساب المدرب</p>
                      </div>
                    )}
                  </div>

                  {!selectedWorkout.completed && !workoutTimerActive && (
                    <button 
                      onClick={() => startWorkoutSimulation(selectedWorkout)}
                      className="w-full bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold tracking-widest uppercase py-3 rounded-sm transition-colors mt-6 shadow-sm"
                    >
                      بدء التمرين (محاكاة المزامنة)
                    </button>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* --- 4. AI VIDEO FORM ANALYSIS --- */}
        {activeSubTab === 'analysis' && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-stone-950 tracking-tight mb-2 font-display">تحليل الهيئة وميكانيكية الجري (AI)</h1>
              <p className="text-stone-500 text-sm">ارفع مقطع فيديو قصير أثناء ركضك للحصول على قياسات دقيقة لزوايا المفاصل ووتيرة الخطوة.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Upload Zone */}
              <div className="bg-white border border-stone-200 shadow-sm p-8 rounded-sm text-center flex flex-col justify-center items-center h-80 relative">
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={handleVideoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  disabled={isAnalyzing}
                />
                
                {isAnalyzing ? (
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-transparent animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">جاري مسح الفيديو وتحليل الهيكل التدريبي...</p>
                      <p className="text-xs text-stone-400 mt-1">يستغرق ذلك بضع ثوانٍ</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center mx-auto text-emerald-800 shadow-sm">
                      <Video className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">اسحب فيديو الركض هنا أو تصفّح جهازك</p>
                      <p className="text-xs text-stone-400 mt-1">يفضّل تصوير جانبي بطيء لمدة لا تقل عن 10 ثوانٍ</p>
                    </div>
                    <button className="px-5 py-2.5 bg-stone-100 border border-stone-200 text-xs font-bold uppercase rounded-sm text-stone-700">
                      اختر ملفاً
                    </button>
                  </div>
                )}
              </div>

              {/* Analysis Result */}
              <div className="lg:col-span-2 bg-white border border-stone-200 shadow-sm rounded-sm p-8">
                <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" /> نتيجة التقييم الذكي للهيئة التدريبية
                </h3>

                {videoAnalysis ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">إيقاع الخطوة (Cadence)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-bold text-stone-800">{videoAnalysis.cadence}</span>
                          <span className="text-xs text-stone-500">خطوة/دقيقة</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">يحتاج تحسين طفيف</span>
                      </div>

                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">طول الخطوة (Stride Length)</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-bold text-stone-800">{videoAnalysis.strideLength}</span>
                          <span className="text-xs text-stone-500">متر</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">مثالي</span>
                      </div>

                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">ميلان الجذع للأمام</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono font-bold text-stone-800">{videoAnalysis.bodyLean}°</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">مثالي (هندسة حيوية ممتازة)</span>
                      </div>

                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm">
                        <span className="text-[10px] text-stone-400 uppercase font-bold block mb-1">طريقة الهبوط على الأرض</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-stone-800">{videoAnalysis.footStrike}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block mt-2">آمن ومثالي للركبتين</span>
                      </div>

                    </div>

                    <div className="p-5 bg-emerald-50 border-r-4 border-emerald-800 rounded-sm mt-6">
                      <h4 className="font-bold text-emerald-950 text-xs uppercase mb-2">توصية الذكاء الاصطناعي الطبية والتدريبية</h4>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {videoAnalysis.feedback}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-stone-400">
                      <span>معدل توافق الهيئة: {videoAnalysis.score}/100</span>
                      <span>أُرسل التقرير تلقائياً إلى: {selectedCoach?.name || 'المدرب أحمد'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-stone-400 space-y-2">
                    <Video className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-sm">لم يتم رفع أو تحليل أي فيديو جري حتى الآن</p>
                    <p className="text-xs">ارفع مقطع فيديو على اليمين لتوليد القياسات البيوميكانيكية فوراً</p>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {/* --- 5. COACH CHAT (A12) --- */}
        {activeSubTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-stone-950 tracking-tight mb-2 font-display">محادثة المدرب</h1>
              <p className="text-stone-500 text-sm">تواصل مباشر وتلقَّ الملاحظات والاعتمادات على خطتك التدريبية من {selectedCoach?.name || 'المدرب أحمد'}.</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden flex flex-col h-[500px]">
              
              {/* Chat Header */}
              <div className="p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10">
                    <SketchAvatar name={selectedCoach?.name || 'المدرب أحمد'} avatarUrl={selectedCoach?.avatar} className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">{selectedCoach?.name || 'المدرب أحمد'}</h3>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">متصل الآن ومستعد للإرشاد</p>
                  </div>
                </div>
                <div className="bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
                  قناة مشفرة وآمنة
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-stone-50/50">
                {chatMessages.map((msg) => {
                  const isMe = msg.sender === 'athlete';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] p-4 rounded-sm text-xs leading-relaxed shadow-sm ${
                        isMe 
                          ? 'bg-emerald-950 text-emerald-50 border border-emerald-900' 
                          : 'bg-white text-stone-800 border border-stone-200'
                      }`}>
                        <p>{msg.text}</p>
                        <span className={`text-[9px] block mt-1.5 font-mono text-left ${isMe ? 'text-emerald-300' : 'text-stone-400'}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 bg-white border-t border-stone-200 flex gap-3">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اكتب رسالتك للمدرب هنا..." 
                  className="flex-1 bg-stone-100 border-none rounded-sm px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-emerald-800 transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="bg-emerald-950 hover:bg-emerald-900 text-white p-3 rounded-sm transition-colors shadow-sm shrink-0"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- 6. ATHLETE PROFILE (A13) --- */}
        {activeSubTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-stone-950 tracking-tight mb-2 font-display">ملفك الرياضي الشخصي</h1>
              <p className="text-stone-500 text-sm">بياناتك القياسية والتكتيكية المستعملة لتقديرات الذكاء الاصطناعي ومراجعة المدربين.</p>
            </div>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm p-8 space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-stone-150">
                <div className="w-20 h-20">
                  <SketchAvatar name="فهد آل سعود" avatarUrl="https://i.pravatar.cc/150?img=11" className="w-20 h-20" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-950 text-xl">فهد آل سعود</h3>
                  <p className="text-stone-500 text-xs mt-1 font-mono">معرّف المتدرب: STL-74892</p>
                  <span className="inline-block mt-2.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">مستوى: هاوٍ نشط</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">العمر</label>
                  <input type="text" readOnly value="28 عام" className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs font-medium text-stone-700 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">الوزن الحالي</label>
                  <input type="text" readOnly value="74 كجم" className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs font-medium text-stone-700 outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-500 uppercase">الطول</label>
                  <input type="text" readOnly value="178 سم" className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs font-medium text-stone-700 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100">
                <div className="p-5 bg-stone-50 rounded-sm border border-stone-200/60">
                  <h4 className="font-bold text-stone-900 text-xs mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700" /> الأرقام الشخصية المستهدفة (Personal Records)
                  </h4>
                  <ul className="space-y-2 text-xs font-medium font-mono text-stone-600">
                    <li className="flex justify-between"><span>مسافة 5 كم:</span> <span className="font-bold text-stone-900">21:15 دقيقة</span></li>
                    <li className="flex justify-between"><span>مسافة 10 كم (المستهدف حالياً):</span> <span className="font-bold text-emerald-800">45:00 دقيقة</span></li>
                    <li className="flex justify-between"><span>نصف ماراثون 21 كم:</span> <span className="font-bold text-stone-900">1:42:30 ساعة</span></li>
                  </ul>
                </div>

                <div className="p-5 bg-stone-50 rounded-sm border border-stone-200/60">
                  <h4 className="font-bold text-stone-900 text-xs mb-3 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-emerald-700" /> مناطق معدل ضربات القلب (HR Zones)
                  </h4>
                  <ul className="space-y-2 text-xs font-medium font-mono text-stone-600">
                    <li className="flex justify-between"><span>المنطقة 1 (هرولة استشفائية):</span> <span className="font-bold text-stone-900">110 - 125 BPM</span></li>
                    <li className="flex justify-between"><span>المنطقة 2 (التحمل الهوائي أساسي):</span> <span className="font-bold text-stone-900">125 - 142 BPM</span></li>
                    <li className="flex justify-between"><span>المنطقة 3 (التمبو / عتبة التحمل):</span> <span className="font-bold text-emerald-800">142 - 160 BPM</span></li>
                  </ul>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

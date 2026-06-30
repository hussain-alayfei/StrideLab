import { useState } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Users, 
  SwitchCamera, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft, 
  UserCheck, 
  RotateCcw,
  Search,
  Check,
  AlertTriangle
} from 'lucide-react';
import AthleteView from './components/AthleteView';
import CoachView from './components/CoachView';
import CommunitiesView from './components/CommunitiesView';
import { SketchAvatar } from './components/SketchAvatar';
import { Role, PlayerStatus, Workout, Community, Coach, ChatMessage } from './types';

// Coaches catalog list
const coaches: Coach[] = [
  {
    id: '1',
    name: 'المدرب أحمد فؤاد',
    specialty: 'مسافات متوسطة وطويلة و5 كم/10 كم',
    experience: 'خبرة 8 سنوات',
    athletesCount: 124,
    rating: 4.9,
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: 'متخصص في تحسين ميكانيكية الركض والهندسة الحيوية للجسم. دربتُ أكثر من 120 عداءً محلياً لتحقيق أرقام شخصية جديدة بأمان وبدون إصابات.'
  },
  {
    id: '2',
    name: 'المدربة سارة منصور',
    specialty: 'الماراثون والجري الجبلي الطويل',
    experience: 'خبرة 6 سنوات',
    athletesCount: 82,
    rating: 4.8,
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: 'أركّز على بناء عتبة التحمل الهوائي (Zone 2) وإدارة تغذية الماراثونات. ساعدت العديد من العدائين لإنهاء الماراثونات الكاملة بنجاح.'
  },
  {
    id: '3',
    name: 'المدرب خالد ناصر',
    specialty: 'جري السرعات (Sprint) وتطوير ركض المسافات',
    experience: 'خبرة 10 سنوات',
    athletesCount: 156,
    rating: 5.0,
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: 'مدرب معتمد للسرعات وتكنيكات الانطلاق القوي. خطط تدريبية ذكية مكثفة لكسر حاجز الـ 5 كم والـ 10 كم للمتسابقين والمحترفين.'
  }
];

export default function App() {
  const [userSession, setUserSession] = useState<'welcome' | 'login_athlete' | 'login_coach' | 'dashboard'>('welcome');
  const [role, setRole] = useState<Role>('athlete');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'communities'>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [clickedGate, setClickedGate] = useState<'athlete' | 'coach' | null>(null);

  // Onboarding Form data
  const [onboardForm, setOnboardForm] = useState({
    age: '28',
    weight: '74',
    height: '178',
    level: 'هاوٍ نشط',
    targetDistance: '10 كم',
    targetPR: '45:00 دقيقة',
    weeklyKm: '32 كم',
    hasWatch: 'نعم'
  });

  // Onboarding AI Assessment states
  const [aiAssessment, setAiAssessment] = useState<{ estimatedTime: string; confidence: string; advice: string } | null>(null);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState<boolean>(false);

  const handleGenerateAssessment = async () => {
    setOnboardingStep(3);
    setIsGeneratingAssessment(true);
    setAiAssessment(null);
    try {
      const response = await fetch('/api/ai/initial-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: onboardForm.age,
          weight: onboardForm.weight,
          height: onboardForm.height,
          level: onboardForm.level,
          targetDistance: onboardForm.targetDistance,
          weeklyKm: onboardForm.weeklyKm
        })
      });
      const data = await response.json();
      setAiAssessment(data);
    } catch (error) {
      console.error("Error generating initial assessment:", error);
      // Safe fallback
      setAiAssessment({
        estimatedTime: "~45:00 دقيقة",
        confidence: "متوسط إلى مرتفع",
        advice: "بناءً على وتيرة لياقتك الحالية، يُنصح بالالتزام بجري هوائي منخفض الشدة في البداية لبناء عتبة تحمل قوية وتفادي الإصابات الشائعة."
      });
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(coaches[0]);
  const [hasApprovedPlan, setHasApprovedPlan] = useState<boolean>(true);
  const [athleteActiveSubTab, setAthleteActiveSubTab] = useState<string>('dashboard');

  // Shared database state
  const [athletes, setAthletes] = useState<PlayerStatus[]>([
    {
      id: '1',
      name: 'فهد آل سعود (أنا)',
      status: 'on_track',
      lastActivity: 'منذ ساعتين',
      avatar: 'https://i.pravatar.cc/150?img=11',
      weeklyDistance: '32 كم',
      restingHR: 54,
      recentPace: '4:45',
      trainingLoad: 120,
      goal: 'ركض 10 كم في 45 دقيقة',
      workouts: [
        { id: 'w1', title: 'جري تمبو (Tempo Run)', distance: '8 كم', duration: '45 د', type: 'Tempo', completed: false, date: 'الأربعاء، اليوم' },
        { id: 'w2', title: 'جري استشفائي سهل (Recovery Easy)', distance: '5 كم', duration: '35 د', type: 'Recovery', completed: false, date: 'الخميس' },
        { id: 'w3', title: 'فترات سرعة مستهدفة (Intervals)', distance: '6 كم', duration: '40 د', type: 'Intervals', completed: false, date: 'السبت' },
        { id: 'w4', title: 'الجري الطويل المعتاد (Long Run)', distance: '15 كم', duration: '90 د', type: 'Long Run', completed: false, date: 'الأحد' }
      ]
    },
    {
      id: '2',
      name: 'خالد ناصر',
      status: 'at_risk',
      lastActivity: 'أمس',
      avatar: 'https://i.pravatar.cc/150?img=15',
      weeklyDistance: '48 كم',
      restingHR: 64,
      recentPace: '5:10',
      trainingLoad: 210,
      goal: 'إنهاء نصف ماراثون الرياض',
      workouts: [
        { id: 'wk1', title: 'جري سهل أساسي', distance: '10 كم', duration: '55 د', type: 'Easy', completed: true, date: 'أمس' },
        { id: 'wk2', title: 'فترات سرعة قصيرة', distance: '8 كم', duration: '45 د', type: 'Intervals', completed: false, date: 'الخميس' },
        { id: 'wk3', title: 'جري تمبو تدريجي', distance: '10 كم', duration: '50 د', type: 'Tempo', completed: false, date: 'السبت' },
        { id: 'wk4', title: 'الجري الطويل المجهد', distance: '18 كم', duration: '110 د', type: 'Long Run', completed: false, date: 'الأحد' }
      ]
    },
    {
      id: '3',
      name: 'سارة منصور',
      status: 'needs_review',
      lastActivity: 'منذ 3 أيام',
      avatar: 'https://i.pravatar.cc/150?img=47',
      weeklyDistance: '20 كم',
      restingHR: 58,
      recentPace: '5:35',
      trainingLoad: 90,
      goal: 'تحسين نبض الجري الأساسي',
      workouts: [
        { id: 'ws1', title: 'جري استشفائي خفيف', distance: '5 كم', duration: '35 د', type: 'Recovery', completed: true, date: 'أمس' },
        { id: 'ws2', title: 'تكرارات سرعة هوائية', distance: '6 كم', duration: '35 د', type: 'Intervals', completed: false, date: 'السبت' }
      ]
    }
  ]);

  const [activeAlerts, setActiveAlerts] = useState<any[]>([
    {
      id: 'a1',
      athleteId: '2',
      title: 'ارتفاع حاد في الحِمل التدريبي',
      description: 'رصد النظام ارتفاعًا بنسبة 30٪ في الحِمل التدريبي التراكمي للعداء خالد ناصر مع نبض راحة مرتفع (64 BPM)، مما يرفع احتمالية الإجهاد أو الإصابة العضلية.'
    }
  ]);

  const [communities, setCommunities] = useState<Community[]>([
    {
      id: '1',
      name: 'عدّاؤو الرياض الحضري (R7)',
      location: 'الرياض، السعودية',
      members: 1240,
      nextRun: 'غداً، 5:00 ص @ وادي حنيفة',
      imageUrl: 'https://images.unsplash.com/photo-1552674605-15c2145eba11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: true
    },
    {
      id: '2',
      name: 'عدّاؤو جدة الساحليون',
      location: 'جدة، السعودية',
      members: 890,
      nextRun: 'الجمعة، 6:00 ص @ كورنيش جدة',
      imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: false
    },
    {
      id: '3',
      name: 'نادي الخبر للجري',
      location: 'الخبر، السعودية',
      members: 450,
      nextRun: 'السبت، 5:30 ص @ الواجهة البحرية',
      imageUrl: 'https://images.unsplash.com/photo-1502224562085-639556652f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: false
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'coach', text: 'أهلاً فهد! قمت بمراجعة بيانات الجري الأخيرة وهدفك في الـ 10 كم. تبدو بصحة ممتازة وجاهز لبدء الخطة.', time: 'أمس، 3:40 م' }
  ]);

  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);

  // Actions for sync
  const handleCompleteWorkout = (id: string) => {
    // Complete workout for Fahad (id: '1')
    setAthletes(prev => prev.map(ath => {
      if (ath.id === '1') {
        const updatedWorkouts = ath.workouts.map(w => {
          if (w.id === id) return { ...w, completed: true };
          return w;
        });
        return {
          ...ath,
          workouts: updatedWorkouts,
          weeklyDistance: `${parseInt(ath.weeklyDistance) + 5} كم`,
          lastActivity: 'الآن'
        };
      }
      return ath;
    }));
  };

  const handleSendMessage = async (text: string) => {
    const newMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'athlete',
      text,
      time: 'الآن'
    };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);

    // Call dynamic backend coach reply API
    try {
      const res = await fetch("/api/ai/draft-coach-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
          athleteName: "فهد آل سعود",
          athleteGoal: onboardForm.targetDistance ? `إنهاء ركض مسافة ${onboardForm.targetDistance}` : "ركض 10 كم في 45 دقيقة"
        })
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(),
          sender: 'coach',
          text: data.reply,
          time: 'الآن'
        }]);
      } else {
        throw new Error();
      }
    } catch (e) {
      setTimeout(() => {
        const responseMsg: ChatMessage = {
          id: Math.random().toString(),
          sender: 'coach',
          text: 'أحسنت يا بطل! رسالتك مستلمة وسأقوم بمتابعة قراءات أدائك التدريبي ومؤشرات التعافي من ساعة الجري مباشرة. واصل تدريبك وعزيمتك!',
          time: 'الآن'
        };
        setChatMessages(prev => [...prev, responseMsg]);
      }, 1000);
    }
  };

  const handleAddAthlete = (newAthlete: Omit<PlayerStatus, 'id' | 'workouts'>) => {
    const athlete: PlayerStatus = {
      ...newAthlete,
      id: (athletes.length + 1).toString(),
      workouts: [
        { id: Math.random().toString(), title: 'جري هوائي أساسي سهل', distance: '6 كم', duration: '35 د', type: 'Easy', completed: false, date: 'السبت القادم' },
        { id: Math.random().toString(), title: 'جري تمبو متناسق اللياقة', distance: '8 كم', duration: '45 د', type: 'Tempo', completed: false, date: 'الإثنين القادم' }
      ]
    };
    setAthletes(prev => [...prev, athlete]);
  };

  const handleApprovePlan = (athleteId: string, updatedWorkouts: Workout[]) => {
    setAthletes(prev => prev.map(ath => {
      if (ath.id === athleteId) {
        return {
          ...ath,
          workouts: updatedWorkouts,
          status: 'on_track'
        };
      }
      return ath;
    }));
    if (athleteId === '1') {
      setHasApprovedPlan(true);
    }
  };

  const handleResolveAlert = (alertId: string, adjustedWorkout?: any) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    // Resolve Khalid's at_risk status back to stable
    setAthletes(prev => prev.map(ath => {
      if (ath.id === '2') {
        const workoutsCopy = [...ath.workouts];
        if (adjustedWorkout) {
          workoutsCopy[adjustedWorkout.workoutIndex] = {
            ...workoutsCopy[adjustedWorkout.workoutIndex],
            [adjustedWorkout.field]: adjustedWorkout.value
          };
        }
        return {
          ...ath,
          workouts: workoutsCopy,
          status: 'on_track',
          trainingLoad: 170 // safe training load now
        };
      }
      return ath;
    }));
  };

  const handleUpdateWorkout = (athleteId: string, workoutId: string, updatedFields: Partial<Workout>) => {
    setAthletes(prev => prev.map(ath => {
      if (ath.id === athleteId) {
        const updatedWorkouts = ath.workouts.map(w => {
          if (w.id === workoutId) return { ...w, ...updatedFields };
          return w;
        });
        return { ...ath, workouts: updatedWorkouts };
      }
      return ath;
    }));
  };

  // Join/leave communities
  const handleJoinCommunity = (id: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, joined: true, members: c.members + 1 };
      return c;
    }));
  };

  const handleLeaveCommunity = (id: string) => {
    setCommunities(prev => prev.map(c => {
      if (c.id === id) return { ...c, joined: false, members: c.members - 1 };
      return c;
    }));
  };

  const handleUnsubscribeCoach = () => {
    const nextCoach = coaches.find(c => c.id !== selectedCoach?.id) || coaches[0];
    setSelectedCoach(nextCoach);
    setHasApprovedPlan(true);
    setIsOnboarded(true);
    setAthleteActiveSubTab('dashboard');
  };

  // Reset to default
  const handleResetData = () => {
    setIsOnboarded(true);
    setOnboardingStep(1);
    setSelectedCoach(coaches[0]);
    setHasApprovedPlan(true);
    setVideoAnalysis(null);
    setAthleteActiveSubTab('dashboard');
    // Reload athletes
    setAthletes([
      {
        id: '1',
        name: 'فهد آل سعود (أنا)',
        status: 'on_track',
        lastActivity: 'منذ ساعتين',
        avatar: 'https://i.pravatar.cc/150?img=11',
        weeklyDistance: '32 كم',
        restingHR: 54,
        recentPace: '4:45',
        trainingLoad: 120,
        goal: 'ركض 10 كم في 45 دقيقة',
        workouts: [
          { id: 'w1', title: 'جري تمبو (Tempo Run)', distance: '8 كم', duration: '45 د', type: 'Tempo', completed: false, date: 'الأربعاء، اليوم' },
          { id: 'w2', title: 'جري استشفائي سهل (Recovery Easy)', distance: '5 كم', duration: '35 د', type: 'Recovery', completed: false, date: 'الخميس' },
          { id: 'w3', title: 'فترات سرعة مستهدفة (Intervals)', distance: '6 كم', duration: '40 د', type: 'Intervals', completed: false, date: 'السبت' },
          { id: 'w4', title: 'الجري الطويل المعتاد (Long Run)', distance: '15 كم', duration: '90 د', type: 'Long Run', completed: false, date: 'الأحد' }
        ]
      },
      {
        id: '2',
        name: 'خالد ناصر',
        status: 'at_risk',
        lastActivity: 'أمس',
        avatar: 'https://i.pravatar.cc/150?img=15',
        weeklyDistance: '48 كم',
        restingHR: 64,
        recentPace: '5:10',
        trainingLoad: 210,
        goal: 'إنهاء نصف ماراثون الرياض',
        workouts: [
          { id: 'wk1', title: 'جري سهل أساسي', distance: '10 كم', duration: '55 د', type: 'Easy', completed: true, date: 'أمس' },
          { id: 'wk2', title: 'فترات سرعة قصيرة', distance: '8 كم', duration: '45 د', type: 'Intervals', completed: false, date: 'الخميس' },
          { id: 'wk3', title: 'جري تمبو تدريجي', distance: '10 كم', duration: '50 د', type: 'Tempo', completed: false, date: 'السبت' },
          { id: 'wk4', title: 'الجري الطويل المجهد', distance: '18 كم', duration: '110 د', type: 'Long Run', completed: false, date: 'الأحد' }
        ]
      },
      {
        id: '3',
        name: 'سارة منصور',
        status: 'needs_review',
        lastActivity: 'منذ 3 أيام',
        avatar: 'https://i.pravatar.cc/150?img=47',
        weeklyDistance: '20 كم',
        restingHR: 58,
        recentPace: '5:35',
        trainingLoad: 90,
        goal: 'تحسين نبض الجري الأساسي',
        workouts: [
          { id: 'ws1', title: 'جري استشفائي خفيف', distance: '5 كم', duration: '35 د', type: 'Recovery', completed: true, date: 'أمس' },
          { id: 'ws2', title: 'تكرارات سرعة هوائية', distance: '6 كم', duration: '35 د', type: 'Intervals', completed: false, date: 'السبت' }
        ]
      }
    ]);
    setActiveAlerts([
      {
        id: 'a1',
        athleteId: '2',
        title: 'ارتفاع حاد في الحِمل التدريبي',
        description: 'رصد النظام ارتفاعًا بنسبة 30٪ في الحِمل التدريبي التراكمي للعداء خالد ناصر مع نبض راحة مرتفع (64 BPM)، مما يرفع احتمالية الإجهاد أو الإصابة العضلية.'
      }
    ]);
  };

  const currentAthleteWorkouts = athletes.find(a => a.id === '1')?.workouts || [];

  const renderContent = () => {
    if (activeTab === 'communities') {
      return (
        <CommunitiesView 
          communities={communities}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
        />
      );
    }

    if (role === 'athlete') {
      // If onboarded, render Athlete View
      return (
        <AthleteView 
          workouts={currentAthleteWorkouts}
          onCompleteWorkout={handleCompleteWorkout}
          selectedCoach={selectedCoach}
          hasApprovedPlan={hasApprovedPlan}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          videoAnalysis={videoAnalysis}
          setVideoAnalysis={setVideoAnalysis}
          activeSubTab={athleteActiveSubTab}
          setActiveSubTab={setAthleteActiveSubTab}
          onResetData={handleResetData}
          onUnsubscribeCoach={handleUnsubscribeCoach}
        />
      );
    } else {
      // Coach Dashboard C1 - C9
      return (
        <CoachView 
          athletes={athletes}
          onAddAthlete={handleAddAthlete}
          onApprovePlan={handleApprovePlan}
          activeAlerts={activeAlerts}
          onResolveAlert={handleResolveAlert}
          onUpdateWorkout={handleUpdateWorkout}
        />
      );
    }
  };

  if (userSession === 'welcome') {
    return (
      <div className="min-h-screen bg-[#071913] flex flex-col justify-between p-6 md:p-12 text-right relative overflow-hidden font-sans text-stone-100" dir="rtl">
        {/* Background Decorative patterns */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="flex justify-between items-center z-10 max-w-6xl mx-auto w-full shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500 rounded-sm flex items-center justify-center shadow-lg text-emerald-950 font-bold text-lg">
              S
            </div>
            <span className="text-white font-bold tracking-tight text-2xl font-display">StrideLab</span>
          </div>
        </div>

        {/* Hero Body */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full z-10 py-12">
          <div className="text-center space-y-3 max-w-2xl mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              منصة StrideLab التدريبية
            </h1>
            <p className="text-stone-400 text-sm">
              إدارة برامج الجري الفردية والمتابعة الفسيولوجية المباشرة بين المدرب والعدّاء.
            </p>
          </div>

          {/* Role selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-6">
            
            {/* Athlete Entry Card */}
            <div 
              onClick={() => {
                if (clickedGate) return;
                setClickedGate('athlete');
                setTimeout(() => {
                  setRole('athlete');
                  setIsOnboarded(true);
                  setSelectedCoach(coaches[0]);
                  setHasApprovedPlan(true);
                  setUserSession('dashboard');
                  setAthleteActiveSubTab('dashboard');
                  setClickedGate(null);
                }, 180);
              }}
              className={`bg-stone-900/40 border border-stone-850 p-8 rounded-sm hover:border-emerald-500/40 hover:bg-stone-900/60 cursor-pointer group flex flex-col justify-between text-right shadow-lg transform transition-all duration-200 ease-out ${
                clickedGate === 'athlete' 
                  ? 'scale-[1.12] border-emerald-500 shadow-emerald-950/70 shadow-2xl z-20 bg-stone-900/90' 
                  : clickedGate 
                    ? 'scale-[0.88] opacity-20 pointer-events-none' 
                    : 'hover:scale-[1.03]'
              }`}
              id="athlete-gate-card"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 rounded-sm flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-950 transition-all">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">بوابة العدّائين والرياضيين</h3>
                  <p className="text-stone-400 text-xs leading-relaxed font-light">
                    سجل بياناتك الحيوية، تواصل مع مدربك المعتمد، وتلقَّ خطط الركض والسرعة المعززة بالنبض والاستكشاف.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs mt-6 group-hover:translate-x-[-4px] transition-transform">
                <span>دخول المتدربين</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
            </div>

            {/* Coach Entry Card */}
            <div 
              onClick={() => {
                if (clickedGate) return;
                setClickedGate('coach');
                setTimeout(() => {
                  setRole('coach');
                  setIsOnboarded(true);
                  setUserSession('dashboard');
                  setClickedGate(null);
                }, 180);
              }}
              className={`bg-stone-900/40 border border-stone-850 p-8 rounded-sm hover:border-emerald-500/40 hover:bg-stone-900/60 cursor-pointer group flex flex-col justify-between text-right shadow-lg transform transition-all duration-200 ease-out ${
                clickedGate === 'coach' 
                  ? 'scale-[1.12] border-emerald-500 shadow-emerald-950/70 shadow-2xl z-20 bg-stone-900/90' 
                  : clickedGate 
                    ? 'scale-[0.88] opacity-20 pointer-events-none' 
                    : 'hover:scale-[1.03]'
              }`}
              id="coach-gate-card"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 rounded-sm flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-emerald-950 transition-all">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">بوابة المدربين والأخصائيين</h3>
                  <p className="text-stone-400 text-xs leading-relaxed font-light">
                    تولَّ قيادة الأبطال، راقب المخططات الفسيولوجية لعدّائيك لحظياً، واعتمد التحديثات والتعديلات الذكية.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs mt-6 group-hover:translate-x-[-4px] transition-transform">
                <span>دخول المدربين</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-stone-800/40 pt-6 z-10 max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center text-[10px] text-stone-500 font-mono gap-4 shrink-0">
          <div>
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} StrideLab</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans text-stone-800 overflow-hidden" dir="rtl">
      
      {/* Desktop Sidebar Right-aligned for RTL */}
      <aside className="hidden md:flex flex-col w-72 bg-[#091b14] border-l border-emerald-900/20 min-h-screen fixed top-0 right-0 z-40">
        <div className="p-8 pb-4 space-y-8 flex-1 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-emerald-500 rounded-sm flex items-center justify-center shadow-lg">
                <div className="w-5 h-5 border-2 border-white rotate-45"></div>
              </div>
              <span className="text-white font-bold tracking-tight text-2xl font-display">StrideLab</span>
            </div>

            {/* Profile Identity Card (Top-level Context) */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/20 rounded-sm flex items-center gap-3">
              <SketchAvatar 
                name={role === 'athlete' ? 'فهد آل سعود' : (selectedCoach?.name || 'المدرب أحمد')} 
                avatarUrl={role === 'athlete' ? 'male' : (selectedCoach?.avatar || 'male')} 
                className="w-11 h-11 border border-emerald-800" 
              />
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-50">{role === 'athlete' ? 'فهد آل سعود' : (selectedCoach?.name || 'المدرب أحمد')}</p>
                <p className="text-[9px] text-emerald-400 uppercase tracking-wide font-bold">{role === 'athlete' ? 'عدّاء' : 'مدرب مـعتمد'}</p>
              </div>
            </div>

            {/* Desktop Quick Role Switcher Pill */}
            <div className="bg-[#05130d] p-1 rounded-sm flex gap-1 border border-emerald-900/30">
              <button
                onClick={() => {
                  setRole('athlete');
                  setActiveTab('dashboard');
                }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-sm transition-all text-center ${
                  role === 'athlete' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-emerald-400 hover:text-emerald-200'
                }`}
              >
                بوابة العدّاء
              </button>
              <button
                onClick={() => {
                  setRole('coach');
                  setActiveTab('dashboard');
                }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-sm transition-all text-center ${
                  role === 'coach' 
                    ? 'bg-emerald-800 text-white shadow-sm' 
                    : 'text-emerald-400 hover:text-emerald-200'
                }`}
              >
                لوحة المدرب
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-bold mb-3 px-1 italic">الأقسام الرئيسية</div>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-xs font-bold rounded-sm tracking-wider ${
                  activeTab === 'dashboard' 
                    ? 'bg-emerald-800 text-white border-r-2 border-emerald-500 shadow-sm' 
                    : 'text-emerald-300/70 hover:bg-emerald-900/20 hover:text-emerald-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>لوحة القيادة والمراقبة</span>
              </button>

              <button
                onClick={() => setActiveTab('communities')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-xs font-bold rounded-sm tracking-wider ${
                  activeTab === 'communities' 
                    ? 'bg-emerald-800 text-white border-r-2 border-emerald-500 shadow-sm' 
                    : 'text-emerald-300/70 hover:bg-emerald-900/20 hover:text-emerald-100'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>المجتمعات ونوادي الجري</span>
              </button>
            </nav>
          </div>

          {/* Logout/Reset */}
          <div className="pt-4 border-t border-emerald-900/10">
            <button 
              onClick={() => {
                setUserSession('welcome');
                setIsOnboarded(true);
                setOnboardingStep(1);
              }}
              className="w-full text-center text-[11px] text-emerald-400 hover:text-white transition-colors py-2 bg-emerald-950/20 border border-emerald-500/10 rounded-sm hover:bg-emerald-950/40"
            >
              تسجيل الخروج من البوابة
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area Left-aligned for RTL */}
      <main className="flex-1 md:mr-72 flex flex-col min-h-screen h-screen overflow-hidden bg-stone-50">
        
        {/* Top Header */}
        <header className="h-20 border-b border-stone-200 bg-white/50 flex items-center justify-between px-6 md:px-10 shrink-0">
          <div className="flex items-center gap-4 hidden md:flex">
            <span className="text-stone-400 text-xs">منصة سترايدلاب</span>
            <span className="text-stone-300">/</span>
            <span className="text-stone-800 font-bold text-xs">
              {activeTab === 'communities' ? 'مجتمعات الجري المحلية' : 'لوحة التحكم والتدريب'}
            </span>
          </div>

          <div className="flex md:hidden items-center gap-2">
             <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center shadow-sm">
              <div className="w-3 h-3 border-2 border-white rotate-45"></div>
            </div>
            <span className="font-bold text-stone-900 tracking-tight text-sm">StrideLab</span>
          </div>

          <div className="flex items-center gap-6">
          </div>
        </header>

        {/* Scrollable Content */}
        <section className="flex-1 p-4 md:p-10 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full pb-20 md:pb-0">
            {renderContent()}
          </div>
        </section>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden border-t border-stone-200 bg-white flex justify-around items-center px-4 py-3 shrink-0 fixed bottom-0 left-0 right-0 z-50">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'dashboard' ? 'text-emerald-800' : 'text-stone-400'
            }`}
          >
            <div className={`p-1.5 rounded-sm transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50' : 'bg-transparent'}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold">لوحة القيادة</span>
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'communities' ? 'text-emerald-800' : 'text-stone-400'
            }`}
          >
            <div className={`p-1.5 rounded-sm transition-colors ${activeTab === 'communities' ? 'bg-emerald-50' : 'bg-transparent'}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold">المجتمعات</span>
          </button>

          <button 
             onClick={() => {
               setRole(role === 'athlete' ? 'coach' : 'athlete');
               setActiveTab('dashboard');
             }}
             className="flex flex-col items-center gap-1 text-stone-400"
          >
            <div className="p-1.5 rounded-sm bg-transparent">
              <SwitchCamera className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold">تبديل الحساب</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

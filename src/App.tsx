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

export default function App() {
  const [role, setRole] = useState<Role>('athlete');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'communities'>('dashboard');
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);

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
        estimatedTime: "~٤٥:٠٠ دقيقة",
        confidence: "متوسط إلى مرتفع",
        advice: "بناءً على وتيرة لياقتك الحالية، يُنصح بالالتزام بجري هوائي منخفض الشدة في البداية لبناء عتبة تحمل قوية وتفادي الإصابات الشائعة."
      });
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [hasApprovedPlan, setHasApprovedPlan] = useState<boolean>(false);
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
      lastActivity: 'منذ ٣ أيام',
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
      description: 'رصد النظام ارتفاعًا بنسبة ٣٠٪ في الحِمل التدريبي التراكمي للعداء خالد ناصر مع نبض راحة مرتفع (64 BPM)، مما يرفع احتمالية الإجهاد أو الإصابة العضلية.'
    }
  ]);

  const [communities, setCommunities] = useState<Community[]>([
    {
      id: '1',
      name: 'عدّاؤو الرياض الحضري (R7)',
      location: 'الرياض، السعودية',
      members: 1240,
      nextRun: 'غداً، ٥:٠٠ ص @ وادي حنيفة',
      imageUrl: 'https://images.unsplash.com/photo-1552674605-15c2145eba11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: true
    },
    {
      id: '2',
      name: 'عدّاؤو جدة الساحليون',
      location: 'جدة، السعودية',
      members: 890,
      nextRun: 'الجمعة، ٦:٠٠ ص @ كورنيش جدة',
      imageUrl: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: false
    },
    {
      id: '3',
      name: 'نادي الخبر للجري',
      location: 'الخبر، السعودية',
      members: 450,
      nextRun: 'السبت، ٥:٣٠ ص @ الواجهة البحرية',
      imageUrl: 'https://images.unsplash.com/photo-1502224562085-639556652f33?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      joined: false
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', sender: 'coach', text: 'أهلاً فهد! قمت بمراجعة بيانات الجري الأخيرة وهدفك في الـ ١٠ كم. تبدو بصحة ممتازة وجاهز لبدء الخطة.', time: 'أمس، ٣:٤٠ م' }
  ]);

  const [videoAnalysis, setVideoAnalysis] = useState<any>(null);

  // Coaches catalog list
  const coaches: Coach[] = [
    {
      id: '1',
      name: 'المدرب أحمد فؤاد',
      specialty: 'مسافات متوسطة وطويلة و٥ كم/١٠ كم',
      experience: 'خبرة ٨ سنوات',
      athletesCount: 124,
      rating: 4.9,
      avatar: 'https://i.pravatar.cc/150?img=11',
      bio: 'متخصص في تحسين ميكانيكية الركض والهندسة الحيوية للجسم. دربتُ أكثر من ١٢٠ عداءً محلياً لتحقيق أرقام شخصية جديدة بأمان وبدون إصابات.'
    },
    {
      id: '2',
      name: 'المدربة سارة منصور',
      specialty: 'الماراثون والجري الجبلي الطويل',
      experience: 'خبرة ٦ سنوات',
      athletesCount: 82,
      rating: 4.8,
      avatar: 'https://i.pravatar.cc/150?img=47',
      bio: 'أركّز على بناء عتبة التحمل الهوائي (Zone 2) وإدارة تغذية الماراثونات. ساعدت العديد من العدائين لإنهاء الماراثونات الكاملة بنجاح.'
    },
    {
      id: '3',
      name: 'المدرب خالد ناصر',
      specialty: 'جري السرعات (Sprint) وتطوير ركض المسافات',
      experience: 'خبرة ١٠ سنوات',
      athletesCount: 156,
      rating: 5.0,
      avatar: 'https://i.pravatar.cc/150?img=15',
      bio: 'مدرب معتمد للسرعات وتكنيكات الانطلاق القوي. خطط تدريبية ذكية مكثفة لكسر حاجز الـ ٥ كم والـ ١٠ كم للمتسابقين والمحترفين.'
    }
  ];

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

  // Reset to default
  const handleResetData = () => {
    setIsOnboarded(false);
    setOnboardingStep(1);
    setSelectedCoach(null);
    setHasApprovedPlan(false);
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
        lastActivity: 'منذ ٣ أيام',
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
        description: 'رصد النظام ارتفاعًا بنسبة ٣٠٪ في الحِمل التدريبي التراكمي للعداء خالد ناصر مع نبض راحة مرتفع (64 BPM)، مما يرفع احتمالية الإجهاد أو الإصابة العضلية.'
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
      // If athlete is not onboarded, show onboarding flow A1 -> A2 -> A3 -> A4 -> A5
      if (!isOnboarded) {
        return (
          <div className="max-w-3xl mx-auto space-y-8 py-4 text-right" dir="rtl">
            
            {/* Step A1: Selection */}
            {onboardingStep === 1 && (
              <div className="bg-white border border-stone-200 shadow-md p-10 space-y-8 rounded-sm">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-950 text-white rounded-sm flex items-center justify-center mx-auto shadow-md">
                    <div className="w-8 h-8 border-4 border-white rotate-45"></div>
                  </div>
                  <h1 className="text-3xl font-bold text-stone-900 font-display">مرحباً بك في StrideLab</h1>
                  <p className="text-stone-500 text-sm max-w-md mx-auto">منصة الجري والتدريب الأولى المخصصة والمحمية بنصائح الذكاء الاصطناعي وإشراف المدربين المحترفين.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <button 
                    onClick={() => setOnboardingStep(2)}
                    className="p-8 border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 hover:border-emerald-800 transition-all text-right rounded-sm group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h3 className="font-bold text-stone-900 text-lg group-hover:text-emerald-900 transition-colors">أنا عدّاء / متدرب</h3>
                      <p className="text-xs text-stone-400 font-light leading-relaxed">ابحث عن مدرب، صمم خطتك بمساعدة الذكاء الاصطناعي، وراقب نبضك وتكنيك ركضك.</p>
                    </div>
                    <span className="text-emerald-800 text-xs font-bold mt-6 flex items-center gap-1 group-hover:underline">ابدأ إدخال بياناتي ←</span>
                  </button>

                  <button 
                    onClick={() => {
                      setRole('coach');
                      setIsOnboarded(true);
                      setActiveTab('dashboard');
                    }}
                    className="p-8 border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 hover:border-emerald-800 transition-all text-right rounded-sm group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h3 className="font-bold text-stone-900 text-lg group-hover:text-emerald-900 transition-colors">أنا مدرب محترف</h3>
                      <p className="text-xs text-stone-400 font-light leading-relaxed">أدر لاعبيك، اعتمد مسودات الخطط المقترحة من الذكاء الاصطناعي، وعالج تنبيهات الحِمل الزائد.</p>
                    </div>
                    <span className="text-emerald-800 text-xs font-bold mt-6 flex items-center gap-1 group-hover:underline">دخول لوحة التحكم ←</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step A2: Form Onboarding */}
            {onboardingStep === 2 && (
              <div className="bg-white border border-stone-200 shadow-md p-10 space-y-8 rounded-sm">
                <div className="flex justify-between items-center pb-4 border-b border-stone-150">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900 font-display">الملف الرياضي وإعدادات التقييم</h2>
                    <p className="text-stone-400 text-xs mt-1">يستعمل الذكاء الاصطناعي هذه الحسابات الرياضية لبناء مسودتك البدئية للتحمل الهوائي.</p>
                  </div>
                  <span className="text-xs text-stone-400 font-mono font-bold bg-stone-100 px-3 py-1.5 rounded-sm">الخطوة ٢ من ٥</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">العمر</label>
                    <input 
                      type="text" 
                      value={onboardForm.age} 
                      onChange={(e) => setOnboardForm({...onboardForm, age: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">الوزن الحالي (كجم)</label>
                    <input 
                      type="text" 
                      value={onboardForm.weight} 
                      onChange={(e) => setOnboardForm({...onboardForm, weight: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">الطول (سم)</label>
                    <input 
                      type="text" 
                      value={onboardForm.height} 
                      onChange={(e) => setOnboardForm({...onboardForm, height: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">التصنيف والخبرة الرياضية</label>
                    <select 
                      value={onboardForm.level}
                      onChange={(e) => setOnboardForm({...onboardForm, level: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none"
                    >
                      <option>مبتدئ (أقل من سنة جري)</option>
                      <option>هاوٍ نشط (١ - ٣ سنوات جري)</option>
                      <option>محترف متمرس (أكثر من ٣ سنوات)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">الهدف التدريبي الأساسي</label>
                    <select 
                      value={onboardForm.targetDistance}
                      onChange={(e) => setOnboardForm({...onboardForm, targetDistance: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none"
                    >
                      <option>تحسين اللياقة الهوائية العامة</option>
                      <option>إنهاء ركض مسافة ٥ كم</option>
                      <option>إنهاء ركض مسافة ١٠ كم</option>
                      <option>إنهاء نصف ماراثون ٢١ كم</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-stone-150">
                  <button 
                    onClick={() => setOnboardingStep(1)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-950 uppercase tracking-wider"
                  >
                    رجوع
                  </button>
                  <button 
                    onClick={handleGenerateAssessment}
                    className="px-6 py-3 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold uppercase rounded-sm shadow-sm"
                  >
                    تأكيد وإنشاء التقدير المبدئي
                  </button>
                </div>
              </div>
            )}

            {/* Step A3: AI Initial assessment feedback */}
            {onboardingStep === 3 && (
              <div className="bg-white border border-stone-200 shadow-md p-10 space-y-8 rounded-sm">
                <div className="flex justify-between items-center pb-4 border-b border-stone-150">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-800" />
                    <h2 className="text-2xl font-bold text-stone-900 font-display">التقدير المبدئي من ذكاء StrideLab AI</h2>
                  </div>
                  <span className="text-xs text-stone-400 font-mono font-bold bg-stone-100 px-3 py-1.5 rounded-sm">الخطوة ٣ من ٥</span>
                </div>

                {isGeneratingAssessment ? (
                  <div className="p-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-800 border-t-transparent animate-spin mx-auto" />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">جاري صياغة تقديرك المبدئي الفسيولوجي المخصص...</p>
                      <p className="text-xs text-stone-400 mt-1">يتحقق محرك الذكاء الاصطناعي من نسب الوزن والطول والخبرة مع الأهداف</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-6 bg-emerald-50 border-r-4 border-emerald-800 space-y-4 rounded-sm">
                      <h3 className="font-bold text-emerald-950 text-sm">المسار التدريبي المتوقع بمستواك الحالي</h3>
                      <p className="text-xs text-stone-700 leading-relaxed font-light">
                        بناءً على وزنك التدريبي المستقر وجدول لياقتك كـ <strong>{onboardForm.level}</strong>، يتوقع النظام قدرتك على استهداف مسافة <strong>{onboardForm.targetDistance}</strong> وإنهائها في غضون <strong className="text-emerald-900 font-semibold font-mono text-sm">{aiAssessment?.estimatedTime || "~٤٥:٠٠ دقيقة"}</strong> بأمان تام.
                      </p>
                      <div className="text-xs text-stone-600 font-light mt-2 border-t border-emerald-100 pt-3">
                        <strong className="text-emerald-950 font-bold">توصية الذكاء الاصطناعي الفسيولوجية:</strong> {aiAssessment?.advice || "بناءً على وتيرة لياقتك الحالية، يُنصح بالالتزام بجري هوائي منخفض الشدة في البداية لبناء عتبة تحمل قوية وتفادي الإصابات الشائعة."}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono pt-1">
                        <span>مستوى الثقة في التقدير الرياضي:</span>
                        <span className="text-emerald-800 font-bold">{aiAssessment?.confidence || "مرتفع"}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-stone-400 font-light italic">
                      * ملاحظة: هذا تقدير مبدئي فسيولوجي مخصص ويتطلب مراجعة وتعديل يدوي من مدربك الشخصي لضمان خطة خالية من الإصابات وعقد الاستقرار التدريبي.
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-stone-150">
                  <button 
                    disabled={isGeneratingAssessment}
                    onClick={() => setOnboardingStep(2)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-950 disabled:opacity-50 uppercase tracking-wider"
                  >
                    رجوع وتعديل البيانات
                  </button>
                  <button 
                    disabled={isGeneratingAssessment}
                    onClick={() => setOnboardingStep(4)}
                    className="px-6 py-3 bg-emerald-950 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-sm shadow-sm"
                  >
                    ابدأ البحث عن مدرب معتمد
                  </button>
                </div>
              </div>
            )}

            {/* Step A4: Coach catalog */}
            {onboardingStep === 4 && (
              <div className="bg-white border border-stone-200 shadow-md p-10 space-y-8 rounded-sm">
                <div className="flex justify-between items-center pb-4 border-b border-stone-150">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900 font-display">قائمة المدربين المعتمدين</h2>
                    <p className="text-stone-400 text-xs mt-1">اختر المدرب الأنسب لمتابعة ومراقبة خطتك المقترحة من الذكاء الاصطناعي.</p>
                  </div>
                  <span className="text-xs text-stone-400 font-mono font-bold bg-stone-100 px-3 py-1.5 rounded-sm">الخطوة ٤ من ٥</span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {coaches.map((coach) => (
                    <div 
                      key={coach.id}
                      onClick={() => {
                        setSelectedCoach(coach);
                        setOnboardingStep(5);
                      }}
                      className="p-6 border border-stone-200 bg-stone-50 hover:bg-emerald-50/20 hover:border-emerald-700 rounded-sm cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      <div className="flex items-center gap-5">
                        <SketchAvatar name={coach.name} avatarUrl={coach.avatar} className="w-14 h-14" />
                        <div>
                          <h3 className="font-bold text-stone-950 text-base">{coach.name}</h3>
                          <p className="text-xs text-stone-500 mt-1">{coach.specialty}</p>
                          <span className="text-[10px] text-stone-400 mt-1.5 inline-block font-mono font-bold">{coach.experience} • تقييم {coach.rating}/5</span>
                        </div>
                      </div>
                      <span className="text-emerald-800 text-xs font-bold hover:underline">عرض الملف والاشتراك ←</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-stone-150">
                  <button 
                    onClick={() => setOnboardingStep(3)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-950 uppercase tracking-wider"
                  >
                    رجوع
                  </button>
                </div>
              </div>
            )}

            {/* Step A5: Coach subscription and onboarding completion */}
            {onboardingStep === 5 && selectedCoach && (
              <div className="bg-white border border-stone-200 shadow-md p-10 space-y-8 rounded-sm">
                <div className="flex justify-between items-center pb-4 border-b border-stone-150">
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900 font-display">ملف المدرب وإتمام الاتصال التدريبي</h2>
                    <p className="text-stone-400 text-xs mt-1">تأكيد الاشتراك وتأسيس الاتصال الهاتفي والميكانيكي اللحظي لساعتك مع المدرب.</p>
                  </div>
                  <span className="text-xs text-stone-400 font-mono font-bold bg-stone-100 px-3 py-1.5 rounded-sm">الخطوة ٥ من ٥</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-stone-50 border border-stone-200 rounded-sm">
                    <SketchAvatar name={selectedCoach.name} avatarUrl={selectedCoach.avatar} className="w-16 h-16" />
                    <div>
                      <h3 className="font-bold text-stone-950 text-lg">{selectedCoach.name}</h3>
                      <p className="text-xs text-stone-500">{selectedCoach.specialty}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-stone-900 text-xs uppercase">السيرة الذاتية للمدرب</h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-light bg-stone-50 p-4 border border-stone-150 rounded-sm">
                      {selectedCoach.bio}
                    </p>
                  </div>

                  <div className="bg-amber-50 p-5 border-r-4 border-amber-500 rounded-sm">
                    <p className="text-xs text-amber-800 leading-relaxed font-light">
                      ✓ عند النقر على "اشترك الآن"، ستكتمل دورتك التدريبية وتبدأ كعدّاء نشط. سيتم إرسال مسودة خطة الذكاء التدريبية إلى مدربك {selectedCoach.name} للاعتماد اليدوي فورياً.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-stone-150">
                  <button 
                    onClick={() => setOnboardingStep(4)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-950 uppercase tracking-wider"
                  >
                    رجوع لقائمة المدربين
                  </button>
                  <button 
                    onClick={() => {
                      setIsOnboarded(true);
                      setAthleteActiveSubTab('dashboard');
                      // Simulate a welcome message in chat from this coach
                      setChatMessages([
                        {
                          id: Math.random().toString(),
                          sender: 'coach',
                          text: `أهلاً ومرحباً بك يا فهد! أنا ${selectedCoach.name}. قمت باستلام مسودة خطتك المقترحة من الذكاء الاصطناعي بنجاح وسأراجع توازن الحِمل والمسافات لاعتمادها فوراً. تذكر أن ساعتك الذكية الآن متصلة بحسابي لحظياً!`,
                          time: 'الآن'
                        }
                      ]);
                    }}
                    className="px-8 py-3 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold uppercase rounded-sm shadow-md"
                  >
                    اشترك الآن وابدأ التمرين!
                  </button>
                </div>
              </div>
            )}

          </div>
        );
      }

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

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans text-stone-800 overflow-hidden" dir="rtl">
      
      {/* Desktop Sidebar Right-aligned for RTL */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a261c] border-l border-emerald-900/10 min-h-screen fixed top-0 right-0 z-40">
        <div className="p-8 pb-2">
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center shadow-md">
              <div className="w-4 h-4 border-2 border-white rotate-45"></div>
            </div>
            <span className="text-emerald-50 font-bold tracking-tight text-xl font-display">StrideLab</span>
          </div>

          <nav className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold mb-4 px-3 italic opacity-70">قائمة العمليات</div>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-3 transition-colors text-xs font-bold uppercase rounded-sm tracking-wider ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-900/40 text-emerald-50 border-r-2 border-emerald-500' 
                  : 'text-emerald-300/70 hover:bg-emerald-900/20 hover:text-emerald-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة القيادة والمراقبة</span>
            </button>

            <button
              onClick={() => setActiveTab('communities')}
              className={`w-full flex items-center gap-3 px-3 py-3 transition-colors text-xs font-bold uppercase rounded-sm tracking-wider ${
                activeTab === 'communities' 
                  ? 'bg-emerald-900/40 text-emerald-50 border-r-2 border-emerald-500' 
                  : 'text-emerald-300/70 hover:bg-emerald-900/20 hover:text-emerald-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>المجتمعات ونوادي الجري</span>
            </button>
          </nav>
        </div>
        
        {/* Footer info & Switch */}
        <div className="mt-auto p-8 border-t border-emerald-900/30 space-y-4 bg-emerald-950/20">
          <button 
            onClick={() => {
              setRole(role === 'athlete' ? 'coach' : 'athlete');
              setActiveTab('dashboard');
            }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 py-3 rounded-sm transition-all text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30"
          >
            <SwitchCamera className="w-4 h-4" />
            <span>التبديل لوضع {role === 'athlete' ? 'المدرب' : 'المتدرب'}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <SketchAvatar 
                name={role === 'athlete' ? 'فهد آل سعود' : (selectedCoach?.name || 'المدرب أحمد')} 
                avatarUrl={role === 'athlete' ? 'male' : (selectedCoach?.avatar || 'male')} 
                className="w-10 h-10" 
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-50">{role === 'athlete' ? 'فهد آل سعود' : 'المدرب أحمد'}</p>
              <p className="text-[9px] text-emerald-400 uppercase tracking-wide font-bold">{role === 'athlete' ? 'عدّاء' : 'مدرب مـعتمد'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area Left-aligned for RTL */}
      <main className="flex-1 md:mr-64 flex flex-col min-h-screen h-screen overflow-hidden bg-stone-50">
        
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
            <span className="text-stone-400 text-xs hidden md:inline">التحديث الأخير: اليوم</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <section className="flex-1 p-6 md:p-10 overflow-y-auto">
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Users, Calendar, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, MessageSquare, Plus, Send } from 'lucide-react';
import { Community } from '../types';
import { CommunitySketch } from './SketchAvatar';

interface CommunitiesViewProps {
  communities: Community[];
  onJoinCommunity: (id: string) => void;
  onLeaveCommunity: (id: string) => void;
}

export default function CommunitiesView({
  communities,
  onJoinCommunity,
  onLeaveCommunity
}: CommunitiesViewProps) {
  
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [feedPosts, setFeedPosts] = useState<Array<{ id: string; user: string; text: string; time: string; distance: string }>>([
    { id: 'p1', user: 'أحمد ف.', text: 'تمارين فترات السرعة صباح اليوم في وادي حنيفة كانت ممتازة! طاقة القروب عالية جداً.', time: 'منذ ١٠ دقائق', distance: '٨ كم' },
    { id: 'p2', user: 'مروان م.', text: 'هرولة ممتعة مع الرفاق على ممشى الكورنيش. إيقاع خطوة متزن ودرجات حرارة رائعة.', time: 'منذ ساعة', distance: '١٢ كم' },
  ]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostDistance, setNewPostDistance] = useState('5 كم');

  const selectedCommunity = communities.find(c => c.id === selectedCommunityId);

  const handleToggleJoin = (community: Community) => {
    if (community.joined) {
      onLeaveCommunity(community.id);
    } else {
      onJoinCommunity(community.id);
    }
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    setFeedPosts([
      {
        id: Math.random().toString(),
        user: 'أنا (فهد)',
        text: newPostText,
        time: 'الآن',
        distance: newPostDistance
      },
      ...feedPosts
    ]);
    setNewPostText('');
    setShowUploadModal(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
      
      <AnimatePresence mode="wait">
        
        {/* --- A10: MAIN COMMUNITIES LIST --- */}
        {!selectedCommunityId && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl font-light text-stone-950 tracking-tight mb-2 italic font-serif">المجتمعات ونوادي الجري</h1>
              <p className="text-stone-500 text-sm font-sans">ابحث وانضم إلى مجموعات الجري المحلية لتتدرب في بيئة جماعية محفزة وتشارك مساراتك اليومية.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {communities.map((community) => (
                <div 
                  key={community.id} 
                  className="bg-white border border-stone-200 shadow-sm rounded-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col justify-between"
                >
                  <div 
                    onClick={() => setSelectedCommunityId(community.id)}
                    className="h-48 relative overflow-hidden bg-stone-100 p-2 border-b border-stone-200"
                  >
                    <div className="w-full h-full relative overflow-hidden rounded-sm">
                      <div className="absolute inset-0 bg-emerald-900/10 group-hover:bg-transparent transition-colors z-10" />
                      <CommunitySketch name={community.name} className="w-full h-full" />
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div onClick={() => setSelectedCommunityId(community.id)}>
                      <h3 className="font-semibold text-lg text-stone-900 mb-4 group-hover:text-emerald-900 transition-colors">{community.name}</h3>
                      
                      <div className="space-y-3 mb-6">
                        <p className="text-xs text-stone-500 flex items-center gap-3 font-medium">
                          <MapPin className="w-4 h-4 text-emerald-800" /> {community.location}
                        </p>
                        <p className="text-xs text-stone-500 flex items-center gap-3 font-medium">
                          <Users className="w-4 h-4 text-emerald-800" /> {community.members} عدّاء مشارك
                        </p>
                        <p className="text-xs text-stone-500 flex items-center gap-3 font-medium">
                          <Calendar className="w-4 h-4 text-emerald-800" /> <span className="truncate">{community.nextRun}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => setSelectedCommunityId(community.id)}
                        className="flex-1 bg-stone-50 text-stone-800 border border-stone-200 text-xs font-bold py-2.5 rounded-sm hover:bg-stone-100 transition-colors"
                      >
                        تفاصيل الجدول
                      </button>
                      <button 
                        onClick={() => handleToggleJoin(community)}
                        className={`px-4 py-2.5 text-xs font-bold uppercase rounded-sm transition-all ${
                          community.joined 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-emerald-950 text-white hover:bg-emerald-800 shadow-sm'
                        }`}
                      >
                        {community.joined ? 'عضو ✓' : 'انضمام'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- A11: COMMUNITY DETAIL SCREEN --- */}
        {selectedCommunityId && selectedCommunity && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setSelectedCommunityId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-all uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 ml-1" /> الرجوع لنوادي الجري
            </button>

            <div className="bg-white border border-stone-200 shadow-sm rounded-sm overflow-hidden">
              <div className="h-64 relative bg-stone-100">
                <CommunitySketch name={selectedCommunity.name} className="w-full h-full" />
                <div className="absolute inset-0 bg-stone-950/5 flex items-end p-8">
                  <div className="text-stone-950 space-y-2">
                    <span className="text-xs bg-emerald-800 text-white px-2.5 py-1 font-bold rounded-sm inline-block">تجمع رياضي معتمد</span>
                    <h1 className="text-3xl font-bold tracking-tight">{selectedCommunity.name}</h1>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Meta details and scheduling */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase mb-3">حول هذا المجتمع</h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-light">
                      الهدف من التجمع هو بناء روابط قوية بين العدائين في المنطقة، تحسين اللياقة البدنية والقلبية، وتشجيع المبتدئين والمحترفين على الجري في مسارات مجهزة تضمن السلامة والأداء الهندسي الحركي العالي.
                    </p>
                  </div>

                  <div className="border-t border-stone-100 pt-6">
                    <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase mb-4">الجدول القادم لتجمعات الركض</h3>
                    
                    <div className="space-y-3">
                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">الجمعة، ٥:٠٠ صباحاً</span>
                          <h4 className="font-semibold text-stone-900 text-xs">الجري الطويل الأسبوعي (Long Run) @ وادي حنيفة</h4>
                        </div>
                        <span className="text-xs font-mono text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded-sm">١٥ كم</span>
                      </div>

                      <div className="p-4 bg-stone-50 border border-stone-150 rounded-sm flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">الأحد، ٧:٠٠ مساءً</span>
                          <h4 className="font-semibold text-stone-900 text-xs">ركض هرولة خفيفة (Easy Aerobic Pace) @ ممشى السفارات</h4>
                        </div>
                        <span className="text-xs font-mono text-stone-500 font-bold bg-stone-100 px-2 py-1 rounded-sm">٧ كم</span>
                      </div>
                    </div>
                  </div>

                  {/* Community Feed / Wall */}
                  <div className="border-t border-stone-100 pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-stone-900 text-sm tracking-widest uppercase">حائط تمرين المجتمع</h3>
                      <button 
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-all"
                      >
                        <Plus className="w-4 h-4" /> شارك تمرينك الأخير
                      </button>
                    </div>

                    <div className="space-y-3">
                      {feedPosts.map((post) => (
                        <div key={post.id} className="p-4 bg-stone-50 border border-stone-150 rounded-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-stone-900 text-xs">{post.user}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{post.time}</span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed font-light">{post.text}</p>
                          <div className="flex justify-between items-center text-[10px] font-bold text-emerald-800">
                            <span>المسافة المنجزة: {post.distance}</span>
                            <span className="bg-emerald-50 px-2 py-0.5 rounded-sm">متحقق منه ✓</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Sidebar controls for detail view */}
                <div className="bg-stone-50 border border-stone-200 p-6 rounded-sm h-fit space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase mb-1">الأعضاء النشطون</span>
                    <div className="text-2xl font-mono font-bold text-stone-900 flex items-center gap-1">
                      <span>{selectedCommunity.members}</span>
                      <span className="text-xs font-sans text-stone-400 font-light">عدّاء</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase mb-1">الموقع والتغطية</span>
                    <p className="text-xs text-stone-600 font-medium">{selectedCommunity.location}</p>
                  </div>

                  <button 
                    onClick={() => handleToggleJoin(selectedCommunity)}
                    className={`w-full text-center text-xs font-bold py-3 uppercase tracking-widest rounded-sm transition-colors ${
                      selectedCommunity.joined 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-emerald-950 text-white hover:bg-emerald-900 shadow-sm'
                    }`}
                  >
                    {selectedCommunity.joined ? 'أنت عضو في هذا النادي ✓' : 'الانضمام إلى نادي الجري'}
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Share / Upload Run Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-stone-200 shadow-2xl max-w-md w-full p-8 rounded-sm space-y-6 relative text-right">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute left-6 top-6 p-1.5 hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5 animate-spin-once" />
            </button>

            <div>
              <h3 className="text-xl font-light text-stone-900 font-serif">مشاركة تمرين ركض مع مجتمعك</h3>
              <p className="text-stone-400 text-xs mt-1">اكتب ملخص تجربتك والمسافة التي أكملتها اليوم لتشجيع أعضاء النادي.</p>
            </div>

            <form onSubmit={handleAddPost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">ما هي تفاصيل الركض؟</label>
                <textarea 
                  required 
                  rows={3}
                  value={newPostText} 
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="مثال: أكملت ركض الـ ١٠ كم اليوم بنبض متوسط متزن جداً!" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase">المسافة التي قطعتها</label>
                <input 
                  type="text" 
                  value={newPostDistance} 
                  onChange={(e) => setNewPostDistance(e.target.value)}
                  placeholder="مثال: 10 كم" 
                  className="w-full bg-stone-50 border border-stone-200 rounded-sm px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-800" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold py-3 uppercase tracking-widest rounded-sm transition-colors mt-4 shadow-sm"
              >
                نشر على حائط التمرين الآن
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple placeholder class
interface XProps {
  className?: string;
}
function X({ className }: XProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}

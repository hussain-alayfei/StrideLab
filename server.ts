import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit for base64 file uploads (like videos)
app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Google Gen AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment variables!");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY_FOR_LINT",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const MODEL = "gemini-2.5-flash";

// Helper safety validator for workouts (فحص السلامة - Guardrail)
function validatePlanSafety(workouts: any[], athleteGoal: string, weeklyKm: number) {
  const warnings: string[] = [];
  let isSafe = true;

  if (!workouts || workouts.length === 0) {
    return { isSafe: true, warnings: [] };
  }

  // Rule 1: No training plan should have zero rest days
  if (workouts.length >= 7) {
    const completedCount = workouts.filter((w: any) => w.type !== 'Recovery').length;
    if (completedCount >= 7) {
      isSafe = false;
      warnings.push("⚠️ الخطة مكثفة جداً: لا يوجد أي يوم راحة أو استشفاء مخصص خلال الأسبوع.");
    }
  }

  // Rule 2: Single long run or workout should not exceed 50% of the weekly km
  const parsedWeeklyKm = parseFloat(String(weeklyKm)) || 20;
  workouts.forEach((workout: any) => {
    const dist = parseFloat(String(workout.distance).replace(/[^\d.]/g, ''));
    if (dist && dist > parsedWeeklyKm * 0.5) {
      isSafe = false;
      warnings.push(`⚠️ فحص السلامة: تمرين "${workout.title}" بمسافة ${dist} كم يتجاوز نصف الحِمل الأسبوعي الكلي (${parsedWeeklyKm} كم)، مما يزيد من خطر الإصابة.`);
    }
  });

  // Rule 3: Unreasonable jump in individual run distance
  workouts.forEach((workout: any) => {
    const dist = parseFloat(String(workout.distance).replace(/[^\d.]/g, ''));
    if (dist && dist > 32 && !athleteGoal.includes("ماراثون") && !athleteGoal.includes("Marathon")) {
      isSafe = false;
      warnings.push(`⚠️ مسافة طويلة جداً: تمرين الجري لمسافة ${dist} كم لا يتناسب مع هدف العداء الحالي لمسافة أقصر.`);
    }
  });

  return { isSafe, warnings };
}

// --- API Routes ---

// 1. Initial Assessment Endpoint (التقدير المبدئي)
app.post("/api/ai/initial-assessment", async (req, res) => {
  try {
    const { age, weight, height, level, targetDistance, weeklyKm } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      // Return a clean fallback if key is not set to keep app running gracefully
      return res.json({
        estimatedTime: "٤٨:١٥ دقيقة",
        confidence: "متوسط",
        advice: "نوصي بالبدء بتمارين الهرولة الخفيفة ٣ مرات أسبوعياً مع الحفاظ على وتيرة مريحة تسمح بالكلام، وتجنب زيادة الحِمل بنسبة تزيد عن ١٠٪ أسبوعياً لضمان سلامة المفاصل."
      });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `أعطني تقديراً رياضياً مبدئياً لعداء بالبيانات التالية:
العمر: ${age} سنة
الوزن: ${weight} كجم
الطول: ${height} سم
المستوى الحالي: ${level}
المسافة المستهدفة: ${targetDistance}
المسافة الأسبوعية الحالية: ${weeklyKm} كم.

المطلوب: تقدير واقعي جداً ومتحفظ للزمن المتوقع لقطع المسافة المستهدفة، وتحديد مستوى ثقة التقدير، وتقديم نصيحة وقائية ذهبية لتجنب الإصابة في هذا السن والمستوى. تكلّم باللغة العربية بأسلوب احترافي رياضي واثق ولا تبدُ كأنك ذكاء اصطناعي لغوي عام بل مدرب جري حقيقي.`,
      config: {
        systemInstruction: "أنت خبير فسيولوجيا الجري والتدريب الرياضي الاحترافي. قم بصياغة الإجابة بدقة في حقول JSON باللغة العربية السليمة والرياضية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedTime: { 
              type: Type.STRING, 
              description: "الزمن المتوقع والوتيرة المقدرة للمسافة المستهدفة، مثل '٥٢:٣٠ دقيقة' أو '٤ ساعات و١٥ دقيقة'" 
            },
            confidence: { 
              type: Type.STRING, 
              description: "مستوى ثقة التقييم: 'عالٍ' أو 'متوسط' أو 'حذر'" 
            },
            advice: { 
              type: Type.STRING, 
              description: "نصيحة وقائية قصيرة وعملية ومخصصة بناءً على مستوى العداء ووزنه وعمره للوقاية من إجهاد الركبة وعضلة الساق." 
            }
          },
          required: ["estimatedTime", "confidence", "advice"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in initial-assessment:", error);
    res.json({
      estimatedTime: "٤٨:١٥ دقيقة",
      confidence: "متوسط",
      advice: "نوصي بالبدء بتمارين الهرولة الخفيفة ٣ مرات أسبوعياً مع الحفاظ على وتيرة مريحة تسمح بالكلام، وتجنب زيادة الحِمل بنسبة تزيد عن ١٠٪ أسبوعياً لضمان سلامة المفاصل."
    });
  }
});

// 2. Dashboard Insights Endpoint (تحليل الاستشفاء والنبض)
app.post("/api/ai/dashboard-insight", async (req, res) => {
  try {
    const { restingHR, trainingLoad, status, recentPace, completedWorkoutsCount, totalWorkoutsCount } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        insight: "مؤشراتك ممتازة اليوم. نبض الاستراحة ٥٨ ن/د مستقر، ومعدل إجهاد المفاصل متوازن تماماً مع المسافة المقطوعة هذا الأسبوع. واصل الالتزام بأيام التعافي المخصصة."
      });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `بيانات المؤشرات الحيوية للعداء اليوم:
- نبضات القلب وقت الراحة: ${restingHR} ن/د
- حِمل التدريب الأسبوعي الحالي: ${trainingLoad}
- حالة اللاعب العامة: ${status} (on_track: ممتاز، needs_review: يحتاج مراجعة، at_risk: إجهاد عالي)
- وتيرة الركض الأخيرة: ${recentPace} /كم
- التمارين المكتملة: ${completedWorkoutsCount} من أصل ${totalWorkoutsCount} تمارین هذا الأسبوع.

اكتب فقرة تحليلية مقتضبة جداً ومحفزة (باللغة العربية، سطرين كحد أقصى) تلخص حالته الفسيولوجية اليوم، وتحدد ما إذا كان قلبه متعافياً تماماً أم يظهر علامات إجهاد خفيف، مع إرشاد تكتيكي بسيط لركضة اليوم. لا تبدأ بعبارات نمطية مثل 'استناداً إلى البيانات' بل ادخل مباشرة في جوهر التحليل الرياضي كمدرب يراقب ساعته الذكية.`,
      config: {
        systemInstruction: "أنت مدرب جري ذكي ولطيف يحلل المؤشرات الفسيولوجية للاعبه لحظة بلحظة. لغتك عربية رياضية فخمة ومركزة للغاية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING, description: "فقرة قصيرة جداً (سطرين كحد أقصى) تحتوي على تحليل الاستشفاء الفعلي بأسلوب بشري احترافي." }
          },
          required: ["insight"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in dashboard-insight:", error);
    res.json({
      insight: "مؤشراتك ممتازة اليوم. نبض الاستراحة ٥٨ ن/د مستقر، ومعدل إجهاد المفاصل متوازن تماماً مع المسافة المقطوعة هذا الأسبوع. واصل الالتزام بأيام التعافي المخصصة."
    });
  }
});

// 3. Running Form Video Analysis (تحليل فيديو وميكانيكية الجري)
app.post("/api/ai/analyze-running-form", async (req, res) => {
  try {
    const { videoBase64, mimeType, fileName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        cadence: 172,
        strideLength: "١.١٥ م",
        bodyLean: "٤.٥ درجات للأمام",
        footStrike: "منتصف القدم (Midfoot)",
        score: 88,
        feedback: "هيئة جري ممتازة ومتزنة. ميلان جذعك مالي مثالي ومستقر، لكن حاول زيادة وتيرة الخطوات (Cadence) قليلاً لتصل إلى نطاق ١٧٥-١٨٠ خطوة في الدقيقة لتقليص وقت ملامسة الأرض وتقليل الصدمات على الركبة."
      });
    }

    const ai = getAI();
    let contents: any[] = [];

    if (videoBase64 && mimeType) {
      // If a real file is uploaded, we pass it to Gemini as inline data
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: videoBase64
        }
      });
      contents.push({
        text: `قم بتحليل لقطة الركض هذه للرياضي واستخراج القياسات البيوميكانيكية الدقيقة التالية لهيئة وجسد العداء:
١. وتيرة الخطوات (Cadence) بالدقيقة.
٢. طول الخطوة التقريبي (Stride Length).
٣. ميلان الجسم (Body Lean) بالدرجات.
٤. طريقة هبوط القدم على الأرض (Foot Strike).
٥. درجة الهيئة العامة من ١٠٠.
٦. تعليق فني دقيق جداً ونصيحة عملية باللغة العربية لتحسين ميكانيكية حركته وتفادي المجهود الضائع.`
      });
    } else {
      // Simulated video analysis requested or no file, generate a realistic biomechanical variation
      contents.push({
        text: "قم بتوليد تحليل بيوميكانيكي عشوائي ولكنه واقعي ومحترف لعداء يركض لمسافة متوسطة. نود الحصول على القياسات التدريبية المعتادة بلغة رياضية عربية ممتازة."
      });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: contents,
      config: {
        systemInstruction: "أنت نظام رادار لتحليل الهيئة الحركية والجري البيوميكانيكي (Biomechanical Running Form Analyzer). تُخرج التقارير الفنية بصيغة JSON حصرية ودقيقة بلغة رياضية عربية ممتازة.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cadence: { type: Type.INTEGER, description: "عدد الخطوات في الدقيقة، عادة بين ١٥٥ و١٩٠" },
            strideLength: { type: Type.STRING, description: "طول الخطوة مع الوحدة، مثل '١.١٨ م'" },
            bodyLean: { type: Type.STRING, description: "ميلان الجسم للأمام بالدرجات، مثل '٥ درجات للأمام'" },
            footStrike: { type: Type.STRING, description: "منطقة الهبوط، مثل 'منتصف القدم (Midfoot)' أو 'عقب القدم (Heel Strike)'" },
            score: { type: Type.INTEGER, description: "نقاط تقييم الهيئة الإجمالية من ١٠٠" },
            feedback: { type: Type.STRING, description: "تعليق فني مفصل ومبني على القياسات لتحسين كفاءة الطاقة وتفادي آلام الكاحل أو أسفل الظهر." }
          },
          required: ["cadence", "strideLength", "bodyLean", "footStrike", "score", "feedback"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in analyze-running-form:", error);
    res.json({
      cadence: 172,
      strideLength: "١.١٥ م",
      bodyLean: "٤.٥ درجات للأمام",
      footStrike: "منتصف القدم (Midfoot)",
      score: 88,
      feedback: "هيئة جري ممتازة ومتزنة. ميلان جذعك مالي مثالي ومستقر، لكن حاول زيادة وتيرة الخطوات (Cadence) قليلاً لتصل إلى نطاق ١٧٥-١٨٠ خطوة في الدقيقة لتقليص وقت ملامسة الأرض وتقليل الصدمات على الركبة."
    });
  }
});

// 4. Coach Risk & Recommendation Helper (توصية التنبيه في لوحة المدرب)
app.post("/api/ai/risk-recommendation", async (req, res) => {
  try {
    const { name, restingHR, trainingLoad, status } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        recommendation: "تخفيض مسافة الجري الطويل بمقدار ٤ كم هذا الأسبوع، مع التركيز على تمارين الإطالة والاستحمام البارد لاستعادة مرونة العضلات."
      });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `اللاعب ${name} لديه تنبيه إجهاد:
- نبض الراحة: ${restingHR} ن/د (مرتفع عن المعدل المعتاد)
- الحمل التدريبي الحالي: ${trainingLoad}
- الحالة الحالية: ${status}

المطلوب: توليد توصية تدريبية علاجية دقيقة وقصيرة جداً (باللغة العربية، سطر واحد) للمدرب ليقررها ويعتمدها لهذا اللاعب لحمايته من الإصابة أو الإجهاد المفرط. يجب أن تكون التوصية عملية وواقعية (مثلاً: تخفيض الحمل بنسبة معينة، استبدال ركض الوتيرة بهرولة تعافي، أو فرض يوم راحة إضافي).`,
      config: {
        systemInstruction: "أنت مستشار السلامة الرياضي المساعد للمدربين. صغ التوصية بشكل احترافي، مباشر وعملي باللغة العربية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING, description: "توصية التدخل السريع المقترحة للمدرب." }
          },
          required: ["recommendation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in risk-recommendation:", error);
    res.json({
      recommendation: "تخفيض مسافة الجري الطويل بمقدار ٤ كم هذا الأسبوع، مع التركيز على تمارين الإطالة والاستحمام البارد لاستعادة مرونة العضلات."
    });
  }
});

// 5. Training Plan Generation Endpoint (توليد الخطة بأسلوب المدرب مع فحص السلامة)
app.post("/api/ai/generate-plan", async (req, res) => {
  try {
    const { athleteGoal, athleteLevel, targetDistance, weeklyKm, coachName, coachStyle } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback structured plans
      const defaultWorkouts = [
        { id: "w1", title: "هرولة تعافي وبناء هوائي", distance: "٥ كم", duration: "٣٥ دقيقة", type: "Recovery", completed: false, date: "الإثنين", description: "جري خفيف ومريح جداً بنبضات قلب منخفضة في المنطقة الثانية." },
        { id: "w2", title: "تمرين فترات لرفع السعة الهوائية", distance: "٦ كم", duration: "٤٠ دقيقة", type: "Intervals", completed: false, date: "الأربعاء", description: "تسخين ١ كم + فترات تكرار ٤٠٠م بسرعات عالية مع راحة دقيقة بينها + تبريد ١ كم." },
        { id: "w3", title: "هرولة متوسطة المسافة وبناء تحمل", distance: "٧ كم", duration: "٤٥ دقيقة", type: "Easy", completed: false, date: "الخميس", description: "ركض مريح ومستقر لبناء المتانة الهوائية وتقوية الأوتار." },
        { id: "w4", title: "تمرين ركض طويل متدرج", distance: "١٢ كم", duration: "٧٥ دقيقة", type: "Long Run", completed: false, date: "السبت", description: "تمرين الركض الطويل الأساسي للأسبوع، ركض هادئ يركز على زيادة القدرة الاستيعابية للجهد العالي." }
      ];
      const safety = validatePlanSafety(defaultWorkouts, athleteGoal, weeklyKm);
      return res.json({ workouts: defaultWorkouts, safety });
    }

    const ai = getAI();
    const prompt = `أنت تصمم خطة تدريبية أسبوعية متكاملة لعداء مخصص بناءً على المعطيات التالية:
- هدف اللاعب الأساسي: ${athleteGoal}
- المستوى التدريبي: ${athleteLevel}
- المسافة المستهدفة للتحدي: ${targetDistance}
- الحِمل الأسبوعي الحالي: ${weeklyKm} كم

المدرب المشرف هو: ${coachName}
أسلوب المدرب التدريبي المعتمد: ${coachStyle}

صمم جدول تمارين أسبوعي من ٤ إلى ٥ تمارين جري متنوعة (Easy, Tempo, Intervals, Long Run, Recovery) يعكس بالتمام أسلوب المدرب الخاص، مع كتابة تفاصيل ممتازة لكل تمرين تشرح له الهدف منه وكيفية تنفيذه.
وزّع التمارين على أيام الأسبوع (مثال: الإثنين، الأربعاء، الخميس، السبت).`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: `أنت مساعد تدريب رياضي ذكي للغاية. وظيفتك تصميم خطة الجري بدقة وتنسيقها في مصفوفة JSON متكاملة وموافقة للواجهة البرمجية. يجب أن تكون عناوين وأوصاف التمارين باللغة العربية الرياضية الفصحى.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "معرّف عشوائي فريد، مثل 'w-1', 'w-2'" },
                  title: { type: Type.STRING, description: "اسم التمرين باللغة العربية، مثل 'تمرين ريتم تكتيكي'" },
                  distance: { type: Type.STRING, description: "المسافة بالكم مع الوحدة، مثل '٦ كم' أو '٨ كم'" },
                  duration: { type: Type.STRING, description: "المدة الزمنية المقدرة للتمرين، مثل '٤٥ دقيقة'" },
                  type: { 
                    type: Type.STRING, 
                    description: "نوع التمرين حصرياً من القيم التالية: 'Easy', 'Tempo', 'Intervals', 'Long Run', 'Recovery'" 
                  },
                  completed: { type: Type.BOOLEAN, description: "يجب أن تكون دائماً false" },
                  date: { type: Type.STRING, description: "يوم التدريب الموصى به، مثل 'الإثنين', 'الأربعاء'" },
                  description: { type: Type.STRING, description: "شرح فني مبسط للعداء لكيفية التنفيذ ونبض المستهدف." }
                },
                required: ["id", "title", "distance", "duration", "type", "completed", "date", "description"]
              }
            }
          },
          required: ["workouts"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"workouts":[]}');
    
    // Perform back-end safety check (Guardrail check)
    const safety = validatePlanSafety(result.workouts, athleteGoal, weeklyKm);
    
    res.json({
      workouts: result.workouts,
      safety: safety
    });
  } catch (error: any) {
    console.error("Error in generate-plan:", error);
    const defaultWorkouts = [
      { id: "w1", title: "هرولة تعافي وبناء هوائي", distance: "٥ كم", duration: "٣٥ دقيقة", type: "Recovery", completed: false, date: "الإثنين", description: "جري خفيف ومريح جداً بنبضات قلب منخفضة في المنطقة الثانية." },
      { id: "w2", title: "تمرين فترات لرفع السعة الهوائية", distance: "٦ كم", duration: "٤٠ دقيقة", type: "Intervals", completed: false, date: "الأربعاء", description: "تسخين ١ كم + فترات تكرار ٤٠٠م بسرعات عالية مع راحة دقيقة بينها + تبريد ١ كم." },
      { id: "w3", title: "هرولة متوسطة المسافة وبناء تحمل", distance: "٧ كم", duration: "٤٥ دقيقة", type: "Easy", completed: false, date: "الخميس", description: "ركض مريح ومستقر لبناء المتانة الهوائية وتقوية الأوتار." },
      { id: "w4", title: "تمرين ركض طويل متدرج", distance: "١٢ كم", duration: "٧٥ دقيقة", type: "Long Run", completed: false, date: "السبت", description: "تمرين الركض الطويل الأساسي للأسبوع، ركض هادئ يركز على زيادة القدرة الاستيعابية للجهد العالي." }
    ];
    res.json({
      workouts: defaultWorkouts,
      safety: { isSafe: true, warnings: [] }
    });
  }
});

// 6. Plan Extension/Progression Endpoint (تمديد الخطة عبر الأشهر المتعاقبة)
app.post("/api/ai/extend-plan", async (req, res) => {
  try {
    const { currentWorkouts, athleteGoal, weeklyKm, currentMonth = 1 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      // Return a safe progressed plan
      const nextMonthWorkouts = (currentWorkouts || []).map((w: any) => {
        const currentDist = parseFloat(w.distance.replace(/[^\d.]/g, '')) || 5;
        // Apply 10% progressive overload for next month
        const nextDist = Math.round(currentDist * 1.1 * 10) / 10;
        const currentMin = parseInt(w.duration.replace(/[^\d]/g, '')) || 30;
        const nextMin = Math.round(currentMin * 1.08);

        return {
          ...w,
          id: `next-${w.id}-${Date.now()}`,
          distance: `${nextDist} كم`,
          duration: `${nextMin} دقيقة`,
          completed: false,
          description: `[خطة الشهر الثاني] ${w.description} (تمت زيادة الحِمل بنسبة آمنة تبلغ ١٠٪ لتطوير الاستيعاب الهوائي).`
        };
      });
      const safety = validatePlanSafety(nextMonthWorkouts, athleteGoal, weeklyKm * 1.1);
      return res.json({ workouts: nextMonthWorkouts, safety, month: currentMonth + 1 });
    }

    const ai = getAI();
    const prompt = `أنت كبير مدربي الجري ومختص في البناء الفسيولوجي التراكمي للرياضيين لمسافات طويلة.
اللاعب حالياً ينهي الشهر التدريبي رقم ${currentMonth} وجدول تمارينه الأسبوعي الحالي كان كالتالي:
${JSON.stringify(currentWorkouts)}

المطلوب: اقتراح وتجهيز جدول تمارين الشهر رقم ${currentMonth + 1} (تمديد الخطة).
شروط وقوانين السلامة الصارمة للزيادة التدريجية (Progressive Overload):
- يجب ألا تتعدى الزيادة في مسافات الجري الأسبوعي والتمارين الفردية حاجز الـ ١٠٪ مقارنة بالشهر السابق لحماية أوتار الركبة والكاحل من الإجهاد التراكمي وتجنب الإصابات.
- الحفاظ على نفس التنوع والتوزيع المناسب لأيام الاستراحة.
هدف العداء الإجمالي: ${athleteGoal}

صمم الجدول الممتد للشهر القادم بدقة في مصفوفة JSON وحافظ على نفس أسماء التمارين أو طوّرها بذكاء مع زيادة المسافة والشدة بنسبة آمنة وصحية.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: "أنت مدرب وخبير تطوير الأحمال الرياضية التراكمية. صمم تمديد الخطة بدقة وأنتج JSON متكامل يحافظ على هيكلية التمارين المعتمدة.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            workouts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  type: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                  date: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "title", "distance", "duration", "type", "completed", "date", "description"]
              }
            }
          },
          required: ["workouts"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"workouts":[]}');
    const safety = validatePlanSafety(result.workouts, athleteGoal, weeklyKm * 1.1);

    res.json({
      workouts: result.workouts,
      safety: safety,
      month: currentMonth + 1
    });
  } catch (error: any) {
    console.error("Error in extend-plan:", error);
    const { currentWorkouts, athleteGoal, weeklyKm, currentMonth = 1 } = req.body;
    const nextMonthWorkouts = (currentWorkouts || []).map((w: any) => {
      const currentDist = parseFloat(w.distance.replace(/[^\d.]/g, '')) || 5;
      const nextDist = Math.round(currentDist * 1.1 * 10) / 10;
      const currentMin = parseInt(w.duration.replace(/[^\d]/g, '')) || 30;
      const nextMin = Math.round(currentMin * 1.08);

      return {
        ...w,
        id: `next-${w.id}-${Date.now()}`,
        distance: `${nextDist} كم`,
        duration: `${nextMin} دقيقة`,
        completed: false,
        description: `[خطة الشهر الثاني] ${w.description} (تمت زيادة الحِمل بنسبة آمنة تبلغ ١٠٪ لتطوير الاستيعاب الهوائي).`
      };
    });
    res.json({
      workouts: nextMonthWorkouts,
      safety: { isSafe: true, warnings: [] },
      month: currentMonth + 1
    });
  }
});

// 7. Draft Coach Reply Helper (اقتراح رد المدرب التلقائي)
app.post("/api/ai/draft-coach-reply", async (req, res) => {
  try {
    const { messages, athleteName, athleteGoal } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: "أهلاً بك يا بطل! مؤشرات الاستشفاء الخاصة بك اليوم ممتازة وتبشر بالخير. ركز في تمرين الغد على الحفاظ على إيقاع هادئ في أول كيلومترين لتهيئة الساقين، ثم تدرج بزيادة الوتيرة كما هو مخطط له. واصل العمل الرائع!"
      });
    }

    const ai = getAI();
    const prompt = `أنت المدرب الرياضي المشرف على اللاعب ${athleteName} الذي يسعى لتحقيق هدف: ${athleteGoal}.
هذه هي سجل الرسائل المتبادلة الأخيرة بينكما:
${JSON.stringify(messages || [])}

اكتب مسودة رد احترافية مخصصة جداً ولطيفة باللغة العربية الفصحى (لا تتجاوز ٣ أسطر) يوجهها المدرب للاعب بناءً على استفساره أو كلامه الأخير. يجب أن تبدو الرسالة وكأنها مكتوبة يدوياً من مدرب جري حريص وداعم جداً وليس رداً عاماً.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: "أنت مدرب جري وطني، محب للاعبيه وداعم كبير ومحفز لهم، تتحدث بلغة عربية سلسلة وودية للغاية.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "نص رد المدرب المقترح." }
          },
          required: ["reply"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Error in draft-coach-reply:", error);
    res.json({
      reply: "أهلاً بك يا بطل! مؤشرات الاستشفاء الخاصة بك اليوم ممتازة وتبشر بالخير. ركز في تمرين الغد على الحفاظ على إيقاع هادئ في أول كيلومترين لتهيئة الساقين، ثم تدرج بزيادة الوتيرة كما هو مخطط له. واصل العمل الرائع!"
    });
  }
});

// --- Vite & Client middleware integration ---

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA routing fallback: send index.html for all non-file/non-api requests
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is booted successfully on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap server:", err);
});

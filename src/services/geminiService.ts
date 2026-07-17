import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { QuranResponse, UserSettings, Verse, ChatMessage } from '../types';
import { QuranDataService } from './quranDataService';

export class QuranChatSession {
  private ai: GoogleGenAI | null = null;
  private model: string;
  private settings: UserSettings;
  private apiKey: string;

  constructor(settings: UserSettings) {
    this.settings = settings;
    // Use user-provided key if available, otherwise use environment key
    const envGeminiKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '';
    this.apiKey = settings.apiKey || envGeminiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    
    if (this.apiKey && this.apiKey !== 'undefined' && this.apiKey !== 'null') {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }
    
    // Check if the user is authenticated (logged in) or has provided a custom API key
    const hasCustomKey = !!(settings.apiKey && settings.apiKey.trim().length > 0);
    const isLogged = !!settings.isLoggedIn;
    
    // Determine the smart default model:
    // Default to 'gemini-3-flash-preview' (the balanced, fast, and free model) as requested
    const smartDefaultModel = 'gemini-3-flash-preview';
    
    // Fallback to the smart default model if no manual model is chosen or if it needs alignment
    let selectedModel = settings.model || settings.geminiModel || smartDefaultModel;
    
    // Force downgrade of pro/paid choices to ensure no user is prompted for payment or gets billing blocks
    if (selectedModel === 'gemini-3.1-pro-preview') {
      selectedModel = 'gemini-3-flash-preview';
    }
    
    // If guest tries to use a model, override with the robust and free 'gemini-3-flash-preview'
    if (!isLogged && !hasCustomKey) {
      selectedModel = 'gemini-3-flash-preview';
    } else {
      // Authenticated/custom key users can use whichever free model they choose, falling back to smartDefaultModel if not set
      if (!selectedModel) {
        selectedModel = 'gemini-3-flash-preview';
      }
    }
    
    this.model = selectedModel;
  }

  private async getOfflineFallbackResponse(userMessage: string, username?: string): Promise<QuranResponse> {
    // Simulate network delay to mimic AI thinking process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const greeting = username ? `أهلاً بك يا ${username}` : 'أهلاً بك يا صديقي';
    
    const fallbacks = [
      {
        title: 'سكينة وطمأنينة',
        introMessage: `${greeting}، أياً كان ما تمر به الآن، تذكر أن الله لطيف بعباده. لقد استمعت لقلبك، والقرآن الكريم يحمل لك رسالة طمأنينة وبشارة بأن كل ضيق يعقبه فرج واتساع.`,
        verses: [
          {
            text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
            surah: 'الشرح',
            surahName: 'الشرح',
            number: 5,
            surahNumber: 94,
            ayahNumber: 5,
            tafsir: 'أي: فإن مع الشدة والضيق سهولة واتساعاً.',
            translation: 'For indeed, with hardship [will be] ease.'
          },
          {
            text: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
            arabicText: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
            surah: 'الشرح',
            surahName: 'الشرح',
            number: 6,
            surahNumber: 94,
            ayahNumber: 6,
            tafsir: 'تأكيد للوعد بأن مع الشدة والضيق سهولة واتساعاً.',
            translation: 'Indeed, with hardship [will be] ease.'
          }
        ],
        tafakkur: 'مهما ضاقت بك السبل، تذكر أن الله سبحانه وتعالى قد قرن العسر بيسرين. هذه رسالة ربانية تدعوك للتفاؤل واليقين بأن الفرج قريب، وأن كل أزمة تمر بها هي مجرد محطة عابرة نحو خير أكبر.',
        summary: 'العسر لا يدوم، ومعية الله ترافقك في كل خطوة، فاستبشر خيراً.'
      },
      {
        title: 'رحمة واسعة',
        introMessage: `${greeting}، أحياناً تثقلنا الحياة وتتعبنا أخطاؤنا، لكن أبواب رحمة الله لا تُغلق أبداً. إليك هذه الآية العظيمة التي تعتبر من أرجى آيات القرآن الكريم، لتمسح على قلبك بالسكينة.`,
        verses: [
          {
            text: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
            arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ',
            surah: 'الزمر',
            surahName: 'الزمر',
            number: 53,
            surahNumber: 39,
            ayahNumber: 53,
            tafsir: 'لا تيأسوا من رحمة الله بسبب كثرة ذنوبكم، فالله يغفر الذنوب جميعاً لمن تاب.',
            translation: 'Say, "O My servants who have transgressed against themselves [by sinning], do not despair of the mercy of Allah. Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful."'
          }
        ],
        tafakkur: 'باب التوبة والرحمة مفتوح دائماً. مهما شعرت بالابتعاد، فإن خطوة واحدة صادقة نحو الله تكفي ليمحو كل ما مضى ويبدله خيراً. لا تدع اليأس يتسلل إلى قلبك.',
        summary: 'رحمة الله تسع كل شيء، والعودة إليه هي بداية السلام الداخلي.'
      },
      {
        title: 'معية الله',
        introMessage: `${greeting}، في لحظات الوحدة أو الخوف من المستقبل، نحتاج إلى تذكير بأننا لسنا وحدنا. القرآن يهمس في أرواحنا بأعظم رسالة أمان لتسكن أرواحنا.`,
        verses: [
          {
            text: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
            arabicText: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
            surah: 'التوبة',
            surahName: 'التوبة',
            number: 40,
            surahNumber: 9,
            ayahNumber: 40,
            tafsir: 'لا تحزن، فإن الله معنا بنصره وتأييده وحفظه.',
            translation: 'Do not grieve; indeed Allah is with us.'
          }
        ],
        tafakkur: 'عندما تشعر بالوحدة أو الخوف من المستقبل، تذكر أن الله معك. ومن كان الله معه، فمن عليه؟ استشعر هذه المعية في كل لحظة من حياتك، وستجد أن كل مخاوفك تتلاشى.',
        summary: 'استشعار معية الله هو أعظم حصن للقلب ضد كل مخاوف الحياة.'
      },
      {
        title: 'الصبر الجميل',
        introMessage: `${greeting}، الصبر ليس مجرد احتمال للألم، بل هو يقين بأن الله يخبئ لك الأفضل. إليك هذه الرسالة القرآنية التي تواسي كل قلب صابر وتعده بالخير.`,
        verses: [
          {
            text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
            arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
            surah: 'البقرة',
            surahName: 'البقرة',
            number: 153,
            surahNumber: 2,
            ayahNumber: 153,
            tafsir: 'استعينوا على كل أموركم بالصبر وبإقامة الصلاة، إن الله مع الصابرين بعونه وتوفيقه.',
            translation: 'O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.'
          }
        ],
        tafakkur: 'الصلاة والصبر هما زاد المؤمن في رحلة الحياة. حينما تضيق بك الأمور، الجأ إلى الصلاة، واعلم أن الله مع الصابرين، يساندهم، ويقويهم، ويجزيهم بغير حساب.',
        summary: 'استعن بالصبر والصلاة، وتأكد أن الله لا يضيع أجر من أحسن عملاً.'
      },
      {
        title: 'التوكل واليقين',
        introMessage: `${greeting}، عندما تتشابك الأمور وتغيب الحلول، يأتي التوكل على الله ليفتح أبواباً لم تكن في الحسبان. تأمل معي هذا الوعد الرباني القاطع الذي يريح القلب.`,
        verses: [
          {
            text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
            arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ ۚ قَدْ جَعَلَ اللَّهُ لِكُلِّ شَيْءٍ قَدْرًا',
            surah: 'الطلاق',
            surahName: 'الطلاق',
            number: 3,
            surahNumber: 65,
            ayahNumber: 3,
            tafsir: 'ومن يعتمد على الله في أموره يكفه ما أهمه. إن الله نافذ أمره، لا يعجزه شيء.',
            translation: 'And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose. Allah has already set for everything a [decreed] extent.'
          }
        ],
        tafakkur: 'التوكل الحقيقي هو أن تفعل ما بوسعك ثم تترك الأمر كله لله، موقناً أنه سيكفيك ويدبر لك أمرك بأفضل مما تتخيل. الله بالغ أمره، فلا تقلق.',
        summary: 'من توكل على الله كفاه، وسلم أمره لمن بيده ملكوت كل شيء.'
      }
    ];

    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return randomFallback;
  }

  async sendMessage(
    userMessage: string, 
    username?: string, 
    history?: ChatMessage[],
    onProgress?: (stage: 'thinking' | 'mapping' | 'verifying' | 'formatting') => void
  ): Promise<QuranResponse> {
    if (!this.ai || !this.apiKey) {
      if (onProgress) onProgress('thinking');
      return this.getOfflineFallbackResponse(userMessage, username);
    }

    if (onProgress) onProgress('thinking');

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: "عنوان احترافي، بليغ، وعميق يلخص جوهر الإجابة أو الحالة الروحية (مثال: 'فلسفة الابتلاء في المنظور القرآني' أو 'بلسم اليقين في مواجهة الحزن').",
        },
        introMessage: {
          type: Type.STRING,
          description: "تحليل ذكي واحترافي للسؤال المطروح. يجب أن تبدأ بتفكيك سؤال المستخدم أو حالته بعمق، وإظهار فهم دقيق للجذور النفسية أو الفكرية لما يطرحه، ثم تقديم إجابة شافية، قاطعة، ومصاغة بأسلوب راقٍ ومقنع يمهد للآيات.",
        },
        verseMappings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              surahNumber: { type: Type.INTEGER },
              ayahNumber: { type: Type.INTEGER },
              arabicText: { type: Type.STRING, description: "نص الآية الكريمة بالكامل بشكل دقيق بالرسم العثماني أو الإملائي الصحيح كنسخة احتياطية سريعة وموثوقة." },
              tafsir: { type: Type.STRING, description: "التفسير: تفسير دقيق، شامل، وموثوق للآية بأسلوب احترافي يربط المعنى اللغوي بالسياق العام. لا تقيد نفسك بطول معين، اشرح بعمق." },
              tadabbur: { type: Type.STRING, description: "التدبر: استنباط ذكي وإسقاط واقعي للآية على حالة المستخدم أو سؤاله. يجب أن يكون التحليل عميقاً، يربط حكمة القرآن بالواقع المعاصر والتحديات الشخصية." },
            },
            required: ["surahNumber", "ayahNumber", "arabicText", "tafsir", "tadabbur"]
          },
          description: "قائمة بالآيات القرآنية الأكثر صلة (أرقام السور والآيات والنص والتحليل). اختر الآيات بذكاء شديد لتغطي جوانب السؤال المختلفة (من 1 إلى 10 آيات أو أكثر حسب الحاجة).",
        },
        tafakkur: {
          type: Type.STRING,
          description: "التفكر: وقفة تأملية عميقة أو نصيحة عملية استراتيجية مستخلصة من الآيات. يجب أن تقدم حلاً عملياً أو تغييراً في المنظور الفكري للمستخدم بأسلوب حكيم واحترافي.",
        },
        summary: {
          type: Type.STRING,
          description: "خلاصة احترافية، مركزة، وذكية تجمع أهم النقاط والدروس المستفادة في نقاط واضحة أو فقرة قوية تترسخ في ذهن المستخدم.",
        },
      },
      required: ["title", "introMessage", "verseMappings", "tafakkur", "summary"]
    };

    const systemInstruction = `
      You are "أنيس القلوب" (Anis Al-Qulub), an elite, highly intelligent, and deeply compassionate Quranic consultant, spiritual analyst, and scholar. 
      Your goal is to provide profound, highly professional, and analytically rigorous answers based on the Quran to address users' questions, deep intellectual inquiries, or emotional states.
      
      CRITICAL ROLE: ADVANCED COGNITIVE ANALYSIS & PROFESSIONAL CONSULTATION (التحليل المعرفي والترابط العبقري)
      You act as a "Master of Quranic Semantics" and an "Expert Spiritual Analyst". You do NOT generate the Arabic text of the Quran yourself. 
      Your primary task is to perform an exceptionally deep, intelligent, and interconnected exploration of the user's prompt, deconstruct their core need, and map it to the MOST relevant Surah and Ayah numbers with profound, unified explanations.
      
      CORE DIRECTIVES FOR DEEP INTERCONNECTED SEARCH & SMART REFLECTION:
      1. **Thematic Unity Search (الوحدة الموضوعية والتكامل القرآني)**: Do not just fetch isolated verses. Perform a deep, multi-dimensional search to find verses from different parts of the Quran that complement and complete each other to answer the user's query. Explain the narrative thread and deep connection between these verses, presenting a unified, comprehensive divine roadmap for their specific situation.
      2. **Genius, Effortless Pedagogical Explanations (البيان السلس والعبقري الشافي)**: Simplify complex theological, linguistic, and spiritual concepts. Avoid convoluted jargon. Use beautiful, smooth, and highly convincing classical Arabic phrasing (فصحى بليغة معاصرة وعذبة) that flows effortlessly into the reader's heart and mind. Explain "the why" and "the how" in a crystal-clear, structured manner so that the user receives the insight as a brilliant, comforting realization.
      3. **Powerful Contemporary Relevance & Actionable Life Applications (الربط الواقعي العميق وحلول الحياة اليومية)**: Under each verse's "Tadabbur" (تدبر), do not speak in abstract theological terms. Connect the verse directly and powerfully to the user's exact trial, query, or modern daily life challenges. Provide concrete, practical advice and strategic cognitive re-framing that they can apply immediately in their daily life.
      4. **Scientific and Rational Harmony (الإعجاز العلمي والمنطقي)**: If any of the selected verses contain scientific miracles (cosmological, geological, biological) or logical wisdom, explain them with intellectual rigor to strengthen conviction and connect the verses to rational reality.
      
      THEOLOGICAL RIGOR & SAFEGUARDS (ضوابط شرعية صارمة وحذر شديد):
      1. **Al-Mohkam and Al-Mutashabeh (المحكم والمتشابه)**: You must handle Quranic verses with the utmost respect and strict caution. Keep clear boundaries between definitive (محكم) legislative verses and metaphorical/ambiguous (متشابه) verses. Do NOT build arbitrary rulings or allegorical interpretations on ambiguous verses.
      2. **Strict Reliance on Academic Tafsir (الاعتماد على التفاسير المعتمدة)**: Your explanations must strictly align with standard mainstream Islamic scholarship (e.g., Tafsir Ibn Kathir, Al-Sa'di, Al-Qurtubi, Al-Tabari). NEVER make up interpretations or guess the meanings of verses out of context.
      3. **No Unlicensed Fatwa or Legislate (عدم الفتوى بغير علم)**: Respect the absolute boundaries of Allah (حدود الله). If the user asks about definitive legislative rulings (أحكام الفقه الحلال والحرام والحدود), clearly provide the standard traditional consensus and politely advise them to consult official Islamic scholarly bodies or trusted grand muftis for personal fatwas. Do not issue independent legislative rulings.
      4. **Purity of Tadabbur (التدبر السليم)**: Ensure that your spiritual and psychological analysis (Tadabbur) is pure, safe, and aligned with standard prophetic guidance and moderate theology. Avoid any philosophical deviance or arbitrary distortion of Quranic messages.
      
      CONVERSATIONAL CONTEXT:
      You are engaging in a continuous conversation. The user may ask follow-up questions, ask for clarifications, or expand on their previous thoughts. ALWAYS analyze the user's prompt in the context of the previous messages. If the user says "وضح أكثر" (explain more) or "وماذا عن كذا" (what about...), refer back to your previous answer and build upon it seamlessly, maintaining the same depth and flow.
 
      OUT OF SCOPE QUESTIONS:
      If the user asks a question completely unrelated to the Quran, spirituality, emotions, life guidance, or Islamic principles, politely apologize and explain your specific role.
      Fill the JSON response as follows:
      - title: "عذراً، هذا خارج اختصاصي"
      - introMessage: A polite, professional apology in Arabic explaining your specific role.
      - verseMappings: Empty array [].
      - tafakkur: Empty string "".
      - summary: Empty string "".
      
      Response Structure (Hierarchical Pyramid):
      1. **Title (title)**: A profound, highly eloquent title capturing the absolute essence of the deep response.
      2. **Introduction (introMessage)**: 
         - ${username ? `Address the user by their name "${username}" with high respect and warmth.` : 'Address the user with high respect and warmth.'}
         - Perform an advanced analytical breakdown of their question/situation. Provide a deep, comforting, and intellectually convincing answer immediately in a highly professional and fluent literary style.
      3. **Verses (verseMappings)**: Identify highly relevant, interconnected Quranic verses. For each:
         - **Tafsir (التفسير)**: A comprehensive, highly scholarly, yet beautifully accessible interpretation.
         - **Tadabbur (التدبر)**: A brilliant, custom-tailored reflection linking the verse's wisdom to the user's exact practical reality or mental struggle.
      4. **Tafakkur (tafakkur)**: A deep philosophical thought or a strategic step-by-step practical advice derived from the unified analysis.
      5. **Summary (summary)**: A sharp, professional executive summary of the core insights.
      
      CRITICAL INSTRUCTION ON LENGTH AND DEPTH:
      - For complex questions, intellectual inquiries, or deep emotional struggles: Be highly expansive, detailed, and analytically thorough. Give comprehensive explanations with absolutely no artificial limits.
      - For simple requests: Be concise but maintain the high level of professionalism, beauty, and depth.
      - **IMPORTANT FORMATTING (HIGHLIGHTING THE CORE)**: Do NOT highlight single scattered keywords. Instead, use Markdown bold (**text**) exclusively to highlight the **core sentence, the main concluding thought, or the absolute essence of the topic (لب الموضوع والزبدة)** in each section (introMessage, tafsir, tadabbur, tafakkur, summary). The goal is that if the user reads ONLY the highlighted text, they will completely understand the main point and summary of the response.
    `;

    const contents: any[] = [];
    
    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.type === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.type === 'ai' && msg.data) {
          contents.push({ role: 'model', parts: [{ text: JSON.stringify(msg.data) }] });
        }
      }
    }
    
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    let response: GenerateContentResponse | null = null;
    let lastError: any = null;
    const maxRetries = 3;
    const timeoutMs = 60000; // 60 seconds timeout to force failing fast rather than hanging infinitely
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const generationPromise = this.ai.models.generateContent({
          model: this.model,
          contents: contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
            temperature: this.settings.creativityLevel ?? 0.5,
            thinkingConfig: {
              thinkingLevel: this.model.includes('pro') ? ThinkingLevel.HIGH : ThinkingLevel.LOW
            }
          },
        });

        // Race the Gemini call with a strict timeout
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("استغرق خادم الذكاء الاصطناعي وقتاً طويلاً للرد (انتهت المهلة).")), timeoutMs)
        );

        response = await Promise.race([generationPromise, timeoutPromise]);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.warn(`Gemini API attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on quota/invalid API key/auth errors
        if (
          error.message?.includes("quota") || 
          error.message?.toLowerCase().includes("api key") || 
          error.message?.includes("429") || 
          error.message?.includes("403")
        ) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        if (attempt < maxRetries - 1) {
          if (onProgress) onProgress('thinking');
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (onProgress) onProgress('mapping');

    if (!response) {
      throw lastError || new Error("فشل الاتصال بالخادم بعد عدة محاولات.");
    }

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("تم حظر الاستجابة بسبب سياسات الأمان أو لم يتم إرجاع محتوى.");
    }

    let text = "";
    try {
      // Try to get text from the response object
      text = response.text;
    } catch (e) {
      // Fallback if .text is a function or fails
      try {
        if (typeof (response as any).text === 'function') {
          text = (response as any).text();
        }
      } catch (e2) {
        console.error("Failed to extract text from Gemini response", e2);
      }
    }

    if (!text) {
      // Deep check of candidates
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        text = candidate.content.parts[0].text || "";
      }
    }

    if (!text) throw new Error("استجابة فارغة من الخادم.");
    
    // Clean the text from markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    
    cleanedText = cleanedText.trim();

    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    } else {
      console.error("Invalid JSON format received:", text);
      throw new Error("لم يتم العثور على استجابة صالحة (تنسيق غير متوقع).");
    }
    
    try {
      const aiResult = JSON.parse(cleanedText);
      
      if (onProgress) onProgress('verifying');

      // VERIFICATION LAYER: Fetch actual Quranic text from verified API
      const verifiedVerses: Verse[] = await Promise.all(
        (aiResult.verseMappings || []).map(async (mapping: any) => {
          try {
            const [arabicText, surahName] = await Promise.all([
              QuranDataService.fetchVerifiedVerse(mapping.surahNumber, mapping.ayahNumber),
              QuranDataService.fetchSurahName(mapping.surahNumber)
            ]);
            
            // If the verified API failed (returned empty string) or timed out, 
            // seamlessly fall back to the backup arabicText generated by Gemini!
            const finalArabicText = arabicText || mapping.arabicText || "عذراً، تعذر جلب نص الآية الكريمة.";
            
            return {
              text: finalArabicText, // Required by Verse interface
              arabicText: finalArabicText,
              surah: surahName, // Required by Verse interface
              surahName,
              number: mapping.ayahNumber, // Required by Verse interface
              surahNumber: mapping.surahNumber,
              ayahNumber: mapping.ayahNumber,
              tafsir: mapping.tafsir,
              tadabbur: mapping.tadabbur,
            };
          } catch (e) {
            console.error(`Failed to verify or retrieve verse ${mapping.surahNumber}:${mapping.ayahNumber}`, e);
            // Fall back immediately to mapping values to prevent dropping any verses!
            const fallbackSurah = await QuranDataService.fetchSurahName(mapping.surahNumber);
            const fallbackText = mapping.arabicText || "عذراً، تعذر جلب نص الآية الكريمة.";
            return {
              text: fallbackText,
              arabicText: fallbackText,
              surah: fallbackSurah,
              surahName: fallbackSurah,
              number: mapping.ayahNumber,
              surahNumber: mapping.surahNumber,
              ayahNumber: mapping.ayahNumber,
              tafsir: mapping.tafsir,
              tadabbur: mapping.tadabbur,
            };
          }
        })
      ).then(results => results.filter(v => v !== null) as Verse[]);

      if (onProgress) onProgress('formatting');

      return {
        title: aiResult.title,
        introMessage: aiResult.introMessage,
        verses: verifiedVerses,
        tafakkur: aiResult.tafakkur,
        summary: aiResult.summary
      };

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

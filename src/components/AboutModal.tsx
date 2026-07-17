import React from 'react';
import { X, Sparkles, Brain, BookOpen, Heart, Compass, CheckCircle2, ShieldCheck, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenFeedback }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="about-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-backdrop flex items-center justify-center p-4 z-50 fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            id="about-modal-container"
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="bg-[#fdfbf7] w-full max-w-2xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col border border-white/20 max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div id="about-modal-header" className="flex justify-between items-center pb-5 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold-dark)] text-white flex items-center justify-center shadow-md">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-primary-dark)] leading-tight">لمحة عن البرنامج</h2>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">افهم كيف يعمل رفيقك القرآني الذكي</p>
                </div>
              </div>
              <button 
                id="about-close-btn"
                onClick={onClose} 
                className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border border-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div id="about-modal-content" className="flex-1 overflow-y-auto py-6 px-1 space-y-6 custom-scrollbar text-right">
              
              {/* Introduction Card */}
              <div id="about-intro-card" className="p-6 rounded-3xl bg-gradient-to-br from-[var(--color-gold)]/5 to-[var(--color-gold)]/10 border border-[var(--color-gold)]/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--color-gold)]/10 rounded-full blur-[40px] -translate-x-1/2 -translate-y-1/2"></div>
                <h3 className="text-base font-black text-[var(--color-gold-dark)] flex items-center gap-2 mb-3">
                  <Heart size={18} className="text-[var(--color-gold)]" />
                  رؤية وفكرة "أنيس القلوب"
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">
                  <strong>أنيس القلوب</strong> هو تطبيق ذكي ورفيق وجداني يهدف لربط قلوب المسلمين بوحي الله عز وجل بطريقة تفاعلية وعميقة. لا يعمل البرنامج كمجرد محرك بحث تقليدي، بل هو مستشار روحي يغوص في آيات الذكر الحكيم ليلتمس لك منها السكينة، واليقين، والأجوبة الشافية التي تلامس حالتك النفسية وسؤالك الفكري والواقعي بأسلوب بليغ وسلس.
                </p>
              </div>

              {/* Core Features & Workflow */}
              <div id="about-workflow-section" className="space-y-4">
                <h3 className="text-base font-black text-[var(--color-primary-dark)] border-r-4 border-[var(--color-gold)] pr-3">
                  منهجية العمل والتحليل الذكي (كيف يعمل النظام؟)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 */}
                  <div id="about-step-emotions" className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-[var(--color-gold)]/20 transition-all shadow-sm space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Brain size={20} />
                    </div>
                    <h4 className="font-black text-sm text-gray-900">١. تحليل المشاعر والوجدان</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      بمجرد إدخال حالتك أو سؤالك، يقوم محرك الذكاء الاصطناعي المتقدم بتحليل عميق للنص لتحديد <strong>الحالة النفسية والوجدانية</strong> (كالحزن، الحيرة، الفرح، القلق) أو الأبعاد الفكرية والفلسفية للسؤال، لفهم الاحتياج الحقيقي لروحك.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div id="about-step-thematic" className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-[var(--color-gold)]/20 transition-all shadow-sm space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Compass size={20} />
                    </div>
                    <h4 className="font-black text-sm text-gray-900">٢. الوحدة الموضوعية والتكامل</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      لا يبحث النظام عن آيات منفردة بشكل عشوائي، بل ينظر إلى القرآن كبنية موضوعية واحدة. يقوم بجمع <strong>شبكة مترابطة من الآيات</strong> تكمل وتفسر بعضها البعض من سور مختلفة لترسم لك خارطة طريق متكاملة.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div id="about-step-rigor" className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-[var(--color-gold)]/20 transition-all shadow-sm space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <h4 className="font-black text-sm text-gray-900">٣. الحذر والمنهجية الأكاديمية</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      يلتزم النظام بـ <strong>ضوابط شرعية صارمة</strong>؛ حيث يستند التفسير حصرياً إلى أمهات كتب التفسير (تفسير ابن كثير، السعدي، القرطبي) دون تأويل مغلوط، مع تجنب الفتاوى الفقهية المستقلة والتفريق الدقيق بين المحكم والمتشابه.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div id="about-step-relevance" className="p-5 rounded-2xl bg-white border border-gray-100 hover:border-[var(--color-gold)]/20 transition-all shadow-sm space-y-2.5">
                    <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                    <h4 className="font-black text-sm text-gray-900">٤. التدبر والربط بالواقع المعاصر</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      لكل آية مستخرجة، يقوم النظام بصياغة تدبر عميق وإسقاط واقعي يربط حكمة القرآن بـ <strong>تحديات حياتك اليومية</strong>، مقدماً لك حلولاً عملية واعية وإعادة توجيه فكري مستخلص من هدايات الوحي الشريف.
                    </p>
                  </div>
                </div>
              </div>

              {/* Anatomy of the response */}
              <div id="about-anatomy-section" className="p-6 rounded-3xl bg-gray-50 border border-gray-100 space-y-4">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--color-gold)]" />
                  هيكلية الإجابة النموذجية (كيف تُعرض النتائج؟)
                </h3>
                <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                  <p>تخضع كل إجابة يقدمها "أنيس القلوب" لترتيب هرمي دقيق ومحكم لراحة عينك وعقلك:</p>
                  <ul className="list-disc pr-5 space-y-2 font-medium">
                    <li><strong className="text-gray-950">العنوان الروحي البليغ:</strong> عنوان أدبي يجسد جوهر وجدانك أو تساؤلك.</li>
                    <li><strong className="text-gray-950">مقدمة التحليل الوجداني:</strong> تفكيك ذكي وعميق لحالتك وربطها بالمقاصد الكلية.</li>
                    <li><strong className="text-gray-950">الآيات الكريمة المفسرة والمُدبَّرة:</strong> عرض الآيات بالرسم العثماني متبوعة بتفسيرها الأكاديمي، وتدبرها الواقعي وحلولها العملية.</li>
                    <li><strong className="text-gray-950">التفكر الإستراتيجي:</strong> وقفة تأملية فلسفية عميقة وخطوات عملية ملموسة تتبناها في يومك.</li>
                    <li><strong className="text-gray-950">الخلاصة المركزة:</strong> زبدة الكلام التي تختصر الرحلة وترسخ في الذهن مباشرة.</li>
                  </ul>
                  <p className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-400 font-semibold flex items-center gap-1.5 justify-center">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    تم تصميم الخط بألوان متباينة وتظليل أهم الجمل (لب الموضوع والزبدة) ليسهل عليك القراءة السريعة والتركيز.
                  </p>
                </div>
              </div>

              {/* Feedback CTA */}
              <div id="about-feedback-cta" className="p-5 rounded-3xl bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-primary)]/10 border border-[var(--color-primary)]/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-right">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-[var(--color-primary-dark)]">هل لديك فكرة أو اقتراح لتطوير البرنامج؟</h4>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">يسعدنا جداً سماع رأيك الإبداعي لتحسين جودة التطبيق ودقة تفاعله.</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenFeedback();
                  }}
                  className="shrink-0 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-black rounded-xl hover:bg-[var(--color-primary-dark)] transition-all active:scale-[0.98] shadow-md cursor-pointer"
                >
                  أرسل اقتراحك الآن
                </button>
              </div>

              {/* Author & Dev Note */}
              <div id="about-credits-section" className="text-center py-4 border-t border-gray-100 space-y-1">
                <p className="text-xs text-[var(--color-primary)] font-black">أنيس القلوب - رفيقك القرآني للتدبر والسكينة</p>
                <p className="text-[10px] text-gray-400 font-bold">إعداد المهندس / عزام فهد</p>
                <p className="text-[9px] text-gray-400/80">الإصدار 1.1.0 • صُنع بكل حب وابتكار لخدمة كتاب الله</p>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

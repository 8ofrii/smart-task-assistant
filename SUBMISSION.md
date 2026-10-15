# ملف تسليم التقييم الفني — Technical Assessment Submission

**اسم المرشح (Candidate Name):** محمود عبد الغفار (Mahmoud Abd El-Ghaffar)  
**الوظيفة المتقدم لها (Position):** مهندس ذكاء اصطناعي (AI Engineer — Stage 02)  
**المهمة (Task):** مساعد المهام الذكي (Smart Task Assistant)  
**تاريخ التسليم (Submission Date):** 15 أكتوبر 2026  

---

## 🔗 الروابط الرسمية للمشروع (Project Links)

| العنصر | الرابط المباشر | الوصف |
| :--- | :--- | :--- |
| 🌐 **الرابط التجريبي الحي (Live App)** | [https://smart-task-assistant-5gu8.onrender.com/](https://smart-task-assistant-5gu8.onrender.com/) | النظام يعمل سحابياً مع واجهة تفاعلية كاملة تدعم تشغيل الاختبارات العشرة وسجل التدقيق والقرارات. |
| 💻 **مستودع الكود (GitHub Repo)** | [https://github.com/8ofrii/smart-task-assistant](https://github.com/8ofrii/smart-task-assistant) | الكود المصدري كاملاً بلغة TypeScript، موثق ويعمل فوراً بأمر أو أمرين (`npm install && npm start`). |
| 🎥 **فيديو العرض والشرح (Video Walkthrough)** | [Google Drive Folder Link](https://drive.google.com/drive/folders/19qF1QOs-TAP05WYc6ESrw5flSWnTgwel?usp=sharing) | فيديو يستعرض تشغيل الرسائل العشر (T01–T10)، ومطابقة النتائج، وشرح مواضع تطبيق الصلاحيات في الكود. |

---

## 📋 ملخص الوفاء بمتطلبات التسليم (Deliverables Checklist)

### 01. الكود كاملاً (Codebase)
- ✅ **معمارية نظيفة (Clean Architecture):** مبني بلغة TypeScript وقاعدة بيانات PostgreSQL السحابية، مع فصل تام بين المحلل الدلالي ومحرك الصلاحيات الحتمي.
- ✅ **حماية البيانات والمفاتيح:** لا توجد أي مفاتيح أو بيانات سرية داخل الكود، مع توفير `.env.example` لبيان المتغيرات المطلوبة.
- ✅ **تطبيق الصلاحيات في الكود (R3 - 25%):** عزل تام للـ LLM، وتطبيق الصلاحيات في `authorization.service.ts` و `task.service.ts` مع إحباط محاولة انتحال الدور في T08 برمجياً برفض 403.
- ✅ **معالجة التواريخ واللهجات والجمعة (R4 - 20%):** دعم اللهجات والتواريخ النسبية ("بكرة"، "بعد بكرة"، "كمان 3 ايام"، "عقب باكر")، مع ترحيل مواعيد الجمعة للسبت تلقائياً في توقيت `Asia/Riyadh`.
- ✅ **الإجابة من نص السياسة فقط دون تأليف (R5 - 15%):** التزام حرفي بنصوص السياسة الرسمية، والاعتراف بعدم توفر المعلومة في T07 (بدل السكن) دون اختلاق.
- ✅ **اختبارات آلية شاملة:** 26+ اختباراً آلياً ناجحاً يغطي الصلاحيات، التواريخ، تحليل الرسائل، والسياسات.

### 02. فيديو العرض (Video Guide)
- استعراض الحالات العشر بالتسلسل (T01 إلى T10).
- توضيح سجل التدقيق الفوري (`audit_logs`) لكل عملية مقبولة أو مرفوضة برمجياً.
- استعراض الأسطر البرمجية التي تطبق الأمان وعزل الصلاحيات في `authorization.service.ts` و `chat.route.ts`.

### 03. صفحة القرارات وحساب التكلفة (Decisions & Cost Breakdown)
- مستند كامل متوفر في مستودع المشروع عبر [`DECISIONS.md`](https://github.com/8ofrii/smart-task-assistant/blob/main/DECISIONS.md) وصفحة تفاعلية داخل التطبيق الحي.
- دراسة واقعية للتكلفة الشهرية لـ 100 موظف بمعدل 20 رسالة يومياً (60,000 استدعاء شهرياً) بالريال والدولار.
- خطة تطويرية مفصلة للأسبوع الإضافي (RAG متقدم، ربط مع WhatsApp/Slack Webhooks، و Redis Caching).

---

## ✉️ نماذج جاهزة للإرسال للشركة (Ready-to-Send Messages)

### الصيغة العربية (Arabic Message Template)

```text
السلام عليكم ورحمة الله وبركاته،

الأفاضل في لجنة التقييم الفني / فريق التوظيف،

يسعدني أن أقدم لكم ملف تسليم المرحلة الثانية لتقييم مهندس الذكاء الاصطناعي (مساعد المهام الذكي — Smart Task Assistant)، متضمناً كافة المتطلبات وفقاً لملف التقييم الفني:

1. 🌐 رابط النسخة الحية للتطبيق السحابي (Live Demo):
https://smart-task-assistant-5gu8.onrender.com/

2. 💻 رابط مستودع الكود المصدري (GitHub Repository):
https://github.com/8ofrii/smart-task-assistant

3. 🎥 رابط فيديو العرض والشرح الفني (Video Walkthrough):
https://drive.google.com/drive/folders/19qF1QOs-TAP05WYc6ESrw5flSWnTgwel?usp=sharing

أبرز نقاط التنفيذ:
• عزل تام للذكاء الاصطناعي عن اتخاذ القرارات الأمنية وتطبيق الصلاحيات برمجياً بنسبة 100% في الباك إند (تصمد أمام هجمات انتحال الأدوار).
• معالجة ذكية للغة العربية واللهجات والتواريخ النسبية، وترحيل مهام يوم الجمعة للسبت تلقائياً وفق توقيت Asia/Riyadh.
• الالتزام الصارم بالإجابة من نصوص السياسة المعتمدة دون أي هلوسة (Zero Hallucination).
• توفير دراسة دقيقة للتكاليف والخيارات المعمارية داخل ملف DECISIONS.md وداخل واجهة المستخدم.

شاكر ومقدّر لوقتكم، وأتطلع لمناقشة التفاصيل خلال المقابلة القادمة بإذن الله.

مع خالص التحية والتقدير،
محمود عبد الغفار (Mahmoud Abd El-Ghaffar)
```

---

### الصيغة الإنجليزية (English Message Template)

```text
Dear Hiring Team / Technical Evaluation Committee,

I am pleased to submit my completed technical assessment for the AI Engineer position (Smart Task Assistant — Stage 02).

Below are the official deliverable links:

1. 🌐 Live Application Demo:
https://smart-task-assistant-5gu8.onrender.com/

2. 💻 Source Code Repository (GitHub):
https://github.com/8ofrii/smart-task-assistant

3. 🎥 Video Walkthrough (Code & Test Cases Demo):
https://drive.google.com/drive/folders/19qF1QOs-TAP05WYc6ESrw5flSWnTgwel?usp=sharing

Key Implementation Highlights:
• Strict Backend-Enforced RBAC: LLM is completely isolated from execution/security decisions; role claims (such as T08 injection attacks) are rejected deterministically with 403 Forbidden and logged in audit_logs.
• Arabic Dialect & Relative Date Handling: Full support for dialects and relative dates (tomorrow, in 3 days, next Sunday) with automatic Friday-to-Saturday rollover under Asia/Riyadh timezone (R4).
• Zero Hallucination: Grounded answers strictly derived from authorized company policies with explicit admission of missing info (R5).
• Architectural Decisions & Cost Realism: Comprehensive analysis and 60k requests/month cost breakdown documented in DECISIONS.md and accessible directly in the Web UI.

Thank you for your time and consideration. Looking forward to discussing the project in the upcoming interview.

Best regards,
Mahmoud Abd El-Ghaffar
```

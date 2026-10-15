# مساعد المهام الذكي — Smart Task Assistant

**المطور (Developer):** محمود عبد الغفار (Mahmoud Abd El-Ghaffar)  
**المسمى (Role):** مهندس ذكاء اصطناعي (AI Engineer)  
**تاريخ التسليم (Date):** 15 أكتوبر 2026  

---

## 📌 نبذة موجزة عن المشروع

نظام مساعد ذكي لإدارة المهام وفق الصلاحيات وسياسات الشركة، مبني بلغة **TypeScript** وقاعدة بيانات **PostgreSQL** السحابية. يستقبل الرسائل النصية باللغة العربية واللهجات ويستخرج المهام بدقة، مع **تطبيق حتمي صارم للصلاحيات في الباك إند** لعزل الذكاء الاصطناعي تماماً عن اتخاذ قرارات الأمان، وضمان الإجابة عن سياسات الشركة من النصوص المعتمدة فقط دون هلوسة.

---

## 🔗 الروابط الرئيسية للمشروع (Project Links)

| العنصر | الرابط المباشر | الوصف |
| :--- | :--- | :--- |
| 🌐 **الرابط الحي للتطبيق (Live App)** | [https://smart-task-assistant-5gu8.onrender.com/](https://smart-task-assistant-5gu8.onrender.com/) | الواجهة التفاعلية تعمل سحابياً ومتاحة للتجربة الفورية مع استعراض المهام وسجل التدقيق. |
| 💻 **مستودع الكود (GitHub Repo)** | [https://github.com/8ofrii/smart-task-assistant](https://github.com/8ofrii/smart-task-assistant) | الكود المصدري كاملاً بلغة TypeScript، موثق ويعمل فوراً بأمر: `npm install && npm start`. |
| 🎥 **فيديو الشرح العملي (Video Walkthrough)** | [Google Drive Link](https://drive.google.com/drive/folders/19qF1QOs-TAP05WYc6ESrw5flSWnTgwel?usp=sharing) | استعراض عملي لأمثلة وسيناريوهات المهام، التحقق من الصلاحيات، وترحيل المواعيد برمجياً. |

---

## 📂 أهم ملفات الكود في المشروع (Key Implementation Files)

* [**`src/services/authorization.service.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/services/authorization.service.ts):  
  **محرك الصلاحيات (RBAC):** فحص حتمي في الكود (الموظف يسجل لنفسه فقط، المشرف لقسمه فقط، والمدير للجميع، مع حماية خصوصية المهام).
* [**`src/services/task.service.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/services/task.service.ts):  
  **إدارة المهام والتدقيق:** تنفيذ إنشاء المهام، حظر العمليات غير المصرحة برمز `403` فوراً، وتسجيل كل عملية في جدول `audit_logs`.
* [**`src/services/date.service.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/services/date.service.ts):  
  **معالج التواريخ والجمعة:** دعم اللهجات والتواريخ النسبية ("بكرة"، "كمان 3 أيام"، "عقب باكر")، وترحيل مواعيد الجمعة للسبت تلقائياً في توقيت `Asia/Riyadh`.
* [**`src/services/policy.service.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/services/policy.service.ts):  
  **سياسات الشركة (Zero Hallucination):** الإجابة الحصرية من نصوص السياسة (الدوام، الإجازات، المصروفات) والاعتراف بعدم توفر المعلومة دون أي تأليف.
* [**`src/services/llm.service.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/services/llm.service.ts):  
  **المحلل الدلالي الذكي:** استخراج النية والوصف والوقت عبر LLM (أو معالج بديل) مع تدقيق صارم بـ Zod ومطابقة الأسماء المتشابهة (نورا = نورة، عبدالرحمان = عبدالرحمن).
* [**`src/routes/chat.route.ts`**](https://github.com/8ofrii/smart-task-assistant/blob/main/src/routes/chat.route.ts):  
  **نقطة الـ API الرئيسية:** مسار `POST /chat`، واعتماد هوية ودور المرسل حصرياً من قاعدة البيانات برقم `user_id` لمنع أي انتحال للأدوار.

---

## ✉️ نص الرسالة المرفقة مع ملف الـ PDF (Message Template)

```text
السلام عليكم ورحمة الله وبركاته،

الأفاضل في الفريق الفني،

أرفق لكم ملف تسليم مشروع (مساعد المهام الذكي — Smart Task Assistant) بصيغة PDF، مع الروابط الرئيسية للمشروع:

1. 🌐 الرابط الحي للتطبيق (Live App):
https://smart-task-assistant-5gu8.onrender.com/

2. 💻 مستودع الكود المصدري كاملاً (GitHub):
https://github.com/8ofrii/smart-task-assistant

3. 🎥 فيديو الشرح والاستعراض العملي (Video Walkthrough):
https://drive.google.com/drive/folders/19qF1QOs-TAP05WYc6ESrw5flSWnTgwel?usp=sharing

أبرز الملفات التي تحتوي على كود النظام:
• src/services/authorization.service.ts: تطبيق الصلاحيات برمجياً بنسبة 100% في الباك إند وعزل الذكاء الاصطناعي عن قرارات الأمان.
• src/services/task.service.ts: إدارة المهام وحظر العمليات غير المصرحة برمز 403 وتوثيقها في audit_logs.
• src/services/date.service.ts: معالجة التواريخ واللهجات وترحيل مواعيد الجمعة للسبت تلقائياً وفق توقيت Asia/Riyadh.
• src/services/policy.service.ts: الإجابة الحصرية من نصوص سياسات الشركة دون أي تأليف.

الملف المرفق (Submission.pdf) يوضح تفاصيل الروابط وهيكلية الكود.

شاكر ومقدّر لوقتكم،
محمود عبد الغفار (Mahmoud Abd El-Ghaffar)
```

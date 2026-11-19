import type { Locale } from "@/lib/locale";

/**
 * English sentences that appear on more than one page.
 * One Arabic string here is what every page shows.
 * Brand names stay in Latin.
 */
const SHARED_AR: Record<string, string> = {
  Support: "الدعم",
  Cart: "السلة",
  Login: "تسجيل الدخول",
  Loading: "جاري التحميل",
  "Loading…": "جاري التحميل…",
  "Loading your account…": "جاري تحميل حسابك…",

  Company: "الشركة",
  "Quick Links": "روابط سريعة",
  "Reach Us": "تواصل معنا",
  "Follow Us": "تابعنا",
  "All rights reserved.": "جميع الحقوق محفوظة.",
  "1st Floor, Office No 11, Building: 19 Way No: 5205, Near AlNadha Tower, Diagonally Opposite to 77 Fresh Shopping Center, Ghala Muscat Oman":
    "الطابق الأول، مكتب رقم 11، مبنى 19، طريق رقم 5205، بالقرب من برج النهضة، مقابل مركز التسوق 77 فريش، غلا، مسقط، عمان",
  "Office location map": "خريطة موقع المكتب",
  "Aptus Infotech office location": "موقع مكتب Aptus Infotech",
  "Chat on WhatsApp": "الدردشة عبر واتساب",
  WhatsApp: "واتساب",

  "About Us": "من نحن",
  "Our Story": "قصتنا",
  "Our Team": "فريقنا",
  "Our Policies": "سياساتنا",
  "ISO Certifications": "شهادات الأيزو",
  "Contact Us": "اتصل بنا",
  "Products and Solutions": "المنتجات والحلول",
  Software: "البرمجيات",
  "ELV Solutions": "حلول الأنظمة منخفضة الجهد",
  "Aptus Solar": "أبتوس سولار",
  "Knowledge Hub": "مركز المعرفة",
  "Knowledge Base": "قاعدة المعرفة",
  Blog: "المدونة",
  "Solutions in Action": "حلول في الميدان",
  FAQ: "الأسئلة الشائعة",
  FAQs: "الأسئلة الشائعة",
  Careers: "الوظائف",
  CCTV: "كاميرات المراقبة",
  "Access Control System": "نظام التحكم بالدخول",
  "Gate Automation": "أتمتة البوابات",
  "Audio/Video Solutions": "حلول الصوت والصورة",
  "Smart Homes": "المنازل الذكية",
  "Telephone Systems": "أنظمة الهاتف",
  "Network and Structured Cabling Solutions": "الشبكات والكابلات المنظمة",
  "Thermal Scanners": "أجهزة الفحص الحراري",
  UPS: "أنظمة UPS",
  "Guest Room Management": "إدارة غرف النزلاء",
  "Nurse Calling System": "نظام استدعاء الممرضات",
  "Conference Room Solution": "حلول غرف الاجتماعات",
  "SMATV/IPTV": "SMATV/IPTV",
  "Switching and Routing": "التبديل والتوجيه",
  "Data Center Solutions": "حلول مراكز البيانات",
  "Queue Management": "إدارة الطوابير",

  "Request a Quote": "طلب عرض سعر",
  "Request Quote": "طلب عرض سعر",
  "Get Your Quote Now": "احصل على عرض السعر الآن",
  "Talk to an Expert": "تحدث مع خبير",
  "What Our Clients Say": "ماذا يقول عملاؤنا",
  "What our clients say": "ماذا يقول عملاؤنا",
  "Winning together with": "ننجح معاً مع",
  "Strategic Alliances": "التحالفات الاستراتيجية",
  "Client Testimonials": "آراء العملاء",
  "Client testimonials": "آراء العملاء",
  "Scroll to read more →": "مرر لقراءة المزيد ←",
  "5 out of 5 stars": "5 من 5 نجوم",
  "Tell us what you need and our sales team will get back to you shortly.":
    "أخبرنا بما تحتاجه وسيتواصل معك فريق المبيعات قريباً.",

  "The Autodesk solutions provided by Aptus Infotech have transformed our design process. The support and training we received were exceptional, and our team is now more productive than ever.":
    "حلول Autodesk التي قدمتها Aptus Infotech غيّرت عملية التصميم لدينا. كان الدعم والتدريب استثنائيين، وأصبح فريقنا أكثر إنتاجية.",
  "Design Director, Architecture Plus": "مدير التصميم، Architecture Plus",
  "The Oracle database implementation by Aptus Infotech has significantly improved our data management capabilities. The system is robust, secure, and perfectly integrated with our existing processes.":
    "تنفيذ قاعدة بيانات Oracle بواسطة Aptus Infotech حسّن قدرتنا على إدارة البيانات بشكل كبير. النظام متين وآمن ومتكامل مع إجراءاتنا الحالية.",
  "IT Manager, Financial Services Group": "مدير تقنية المعلومات، مجموعة الخدمات المالية",
  "The educational software solutions provided by Aptus Infotech have revolutionized how our institution manages academic records and delivers online learning. It's been a game-changer for both teachers and students.":
    "حلول البرمجيات التعليمية من Aptus Infotech غيّرت طريقة إدارة السجلات الأكاديمية وتقديم التعلم عبر الإنترنت. كان لذلك أثر كبير على المعلمين والطلاب.",
  "Principal, Global Education Institute": "مدير، Global Education Institute",
  "Hear from businesses that have transformed with our software solutions":
    "آراء شركات تطورت مع حلولنا البرمجية",
  "We appreciate the commitment & dedication shown by Aptus Infotech for their implementation and services.":
    "نقدّر الالتزام والتفاني الذي أظهرته Aptus Infotech في التنفيذ والخدمات.",
  "IT Manager": "مدير تقنية المعلومات",
  "The AutoCAD toolsets from Aptus have revolutionized our workflow.":
    "حزم أدوات AutoCAD من Aptus غيّرت سير عملنا.",
  "Lead Architect": "مهندس معماري أول",
  "Aptus recommended AutoCAD LT, which perfectly meets our needs without breaking the budget.":
    "أوصت Aptus بـ AutoCAD LT، وهو يلبي احتياجاتنا دون تجاوز الميزانية.",
  Owner: "المالك",
  "Working with Aptus Infotech helped us reduce project completion time by 30%.":
    "العمل مع Aptus Infotech ساعدنا على تقليل وقت إنجاز المشاريع بنسبة 30%.",
  "Design Manager": "مدير التصميم",

  "First Name": "الاسم الأول",
  "Last Name": "اسم العائلة",
  City: "المدينة",
  Country: "الدولة",
  Email: "البريد الإلكتروني",
  Phone: "الهاتف",
  "Email Address": "البريد الإلكتروني",
  "Phone Number": "رقم الهاتف",
  "How can we help you?": "كيف يمكننا مساعدتك؟",
  "How did you hear about us?": "كيف سمعت عنا؟",
  "First Name *": "الاسم الأول *",
  "Last Name *": "اسم العائلة *",
  "City *": "المدينة *",
  "State/Province *": "الولاية / المقاطعة *",
  "Email *": "البريد الإلكتروني *",
  "Phone *": "الهاتف *",
  "How can we help you? *": "كيف يمكننا مساعدتك؟ *",
  "How did you hear about us? *": "كيف سمعت عنا؟ *",
  "QTY *": "الكمية *",
  "Company *": "الشركة *",
  Message: "الرسالة",
  "STATE/PROVINCE": "الولاية / المقاطعة",
  "EMAIL ADDRESS": "البريد الإلكتروني",
  "Your Query": "استفسارك",
  "Company Name": "اسم الشركة",
  "Select an option": "اختر خياراً",
  "Search Engine": "محرك البحث",
  "Social Media": "وسائل التواصل الاجتماعي",
  Referrals: "إحالات",
  Referals: "إحالات",
  Events: "فعاليات",
  LinkedIn: "LinkedIn",
  Media: "الإعلام",
  Other: "أخرى",
  "Submit Request": "إرسال الطلب",
  "Submit Now": "إرسال الآن",
  "Submitting…": "جاري الإرسال…",

  "Please fill highlighted fields.": "يرجى تعبئة الحقول المظللة.",
  "Thank you! Your quote request has been submitted. Our team will contact you shortly.":
    "شكراً لك! تم إرسال طلب عرض السعر. سيتواصل معك فريقنا قريباً.",
  "Thank you for contacting Aptus Infotech. Your enquiry has been submitted successfully. Our team will get back to you shortly.":
    "شكراً لتواصلك مع Aptus Infotech. تم إرسال استفسارك بنجاح. سيتواصل معك فريقنا قريباً.",
  "Thank you! Your message has been sent.": "شكراً لك! تم إرسال رسالتك.",
  "Something went wrong. Please try again.": "حدث خطأ. يرجى المحاولة مرة أخرى.",
  "Network error. Please check your connection and try again.":
    "خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
  "First name is required.": "الاسم الأول مطلوب.",
  "Last name is required.": "اسم العائلة مطلوب.",
  "City is required.": "المدينة مطلوبة.",
  "Country is required.": "الدولة مطلوبة.",
  "Email is required.": "البريد الإلكتروني مطلوب.",
  "Phone is required.": "الهاتف مطلوب.",
  "Message is required.": "الرسالة مطلوبة.",
  "Enter a valid email address.": "أدخل بريداً إلكترونياً صالحاً.",
  "Enter a valid phone number.": "أدخل رقم هاتف صالحاً.",
  "Please enter a valid email address.": "يرجى إدخال بريد إلكتروني صالح.",
  "Please enter a valid phone number.": "يرجى إدخال رقم هاتف صالح.",
  "Please select how you heard about us.": "يرجى اختيار كيف سمعت عنا.",
  "At least 2 characters.": "حرفان على الأقل.",
  "First name can only include letters, spaces, hyphens, and apostrophes.":
    "يمكن أن يتضمن الاسم الأول حروفاً ومسافات وشرطات وعلامات اقتباس فقط.",
  "Last name can only include letters, spaces, hyphens, and apostrophes.":
    "يمكن أن يتضمن اسم العائلة حروفاً ومسافات وشرطات وعلامات اقتباس فقط.",
  "City must include letters or numbers.": "يجب أن تتضمن المدينة حروفاً أو أرقاماً.",
  "Country must include letters or numbers.": "يجب أن تتضمن الدولة حروفاً أو أرقاماً.",
  "How did you hear about us is not an allowed value.": "قيمة «كيف سمعت عنا» غير مسموحة.",
  "Validation failed.": "فشل التحقق.",
  "Request Submitted Successfully. Thank you for your request. Our sales team will review your requirements and contact you shortly.":
    "تم إرسال الطلب بنجاح. شكراً لطلبك. سيراجع فريق المبيعات متطلباتك ويتواصل معك قريباً.",
  "Your Request Quote has been submitted successfully.": "تم إرسال طلب عرض السعر بنجاح.",
  "Reference Number:": "الرقم المرجعي:",
  "We couldn't submit your request right now. Please try again or contact our sales team.":
    "تعذر إرسال طلبك الآن. يرجى المحاولة مرة أخرى أو التواصل مع فريق المبيعات.",
  "Please enter your name.": "يرجى إدخال اسمك.",
  "Please select a country code.": "يرجى اختيار رمز الدولة.",
  "Please select at least one product.": "يرجى اختيار منتج واحد على الأقل.",
  "Please enter a valid quantity.": "يرجى إدخال كمية صالحة.",
  "Please enter your company name.": "يرجى إدخال اسم الشركة.",
  "Please select your profession.": "يرجى اختيار مهنتك.",
  "Please enter a valid CR Number.": "يرجى إدخال رقم سجل تجاري صالح.",
  "Close chat": "إغلاق المحادثة",

  "Aptus Infotech | Trusted IT & Engineering Software Partner":
    "Aptus Infotech | شريك موثوق لبرمجيات تقنية المعلومات والهندسة",
  "Aptus Infotech delivers trusted software, engineering tools, and IT solutions—from Ansys to Autodesk. Start your digital journey with us.":
    "تقدم Aptus Infotech برمجيات وأدوات هندسية وحلول تقنية معلومات موثوقة، من Ansys إلى Autodesk. ابدأ رحلتك الرقمية معنا.",
  Home: "الرئيسية",
  "Our Story | Aptus Infotech": "قصتنا | Aptus Infotech",
  "Our Policies & Terms | Aptus Infotech": "سياساتنا والشروط | Aptus Infotech",
  "Aptus Infotech ISO Certifications | Aptus Infotech": "شهادات الأيزو | Aptus Infotech",
  "Our Team | Aptus Infotech": "فريقنا | Aptus Infotech",
  "FAQs | Aptus Infotech": "الأسئلة الشائعة | Aptus Infotech",
  "Software Solutions": "حلول البرمجيات",
  "Premium software solutions from Autodesk, Adobe, Microsoft, Oracle, and more — with licensing, implementation, and support from Aptus Infotech.":
    "حلول برمجية من Autodesk وAdobe وMicrosoft وOracle وغيرها، مع الترخيص والتنفيذ والدعم من Aptus Infotech.",
  "Browse Software Products": "تصفح منتجات البرمجيات",
  "Explore premium software from Autodesk, Adobe, Microsoft, Oracle, and more. Purchase online or request a quote from Aptus Infotech.":
    "استكشف برمجيات من Autodesk وAdobe وMicrosoft وOracle وغيرها. اشترِ عبر الإنترنت أو اطلب عرض سعر من Aptus Infotech.",
  "Explore Software Brands": "استكشف علامات البرمجيات",
  "Browse Aptus Infotech software brands — Autodesk, Adobe, Microsoft, Oracle, and more — then open the catalogue with your filters applied.":
    "تصفح علامات البرمجيات لدى Aptus Infotech — Autodesk وAdobe وMicrosoft وOracle وغيرها — ثم افتح الكتالوج مع عوامل التصفية.",
  "Loading products…": "جاري تحميل المنتجات…",
  "Product not found": "المنتج غير موجود",
  "Careers at Aptus Infotech": "الوظائف في Aptus Infotech",
  "Explore open roles at Aptus Infotech and join a team that values creativity, collaboration and continuous growth.":
    "اطلع على الوظائف المتاحة في Aptus Infotech وانضم إلى فريق يقدّر الإبداع والتعاون والنمو المستمر.",
  "Job not found": "الوظيفة غير موجودة",
  Apply: "تقديم",
  "Customer Login | Aptus Infotech": "تسجيل دخول العملاء | Aptus Infotech",
  "Industry insights from Aptus Infotech on software, design, communications, security, and infrastructure.":
    "رؤى من Aptus Infotech حول البرمجيات والتصميم والاتصالات والأمن والبنية التحتية.",
  "Adobe creative, marketing, and document solutions — Creative Cloud, Acrobat, Firefly, and more. Aptus Infotech is your trusted Adobe partner.":
    "حلول Adobe للإبداع والتسويق والمستندات — Creative Cloud وAcrobat وFirefly وغيرها. Aptus Infotech شريكك الموثوق لـ Adobe.",
  "Explore Autodesk design and make software — AutoCAD, Revit, Fusion, Maya, and more. Aptus Infotech is your trusted Autodesk partner.":
    "استكشف برمجيات التصميم والتصنيع من Autodesk — AutoCAD وRevit وFusion وMaya وغيرها. Aptus Infotech شريكك الموثوق لـ Autodesk.",
  "Complete solar solutions from Aptus Solar Tech — design, supply, and installation support for businesses in Oman.":
    "حلول طاقة شمسية متكاملة من Aptus Solar Tech — التصميم والتوريد ودعم التركيب للشركات في عمان.",
  "Adobe Brand Visibility | AI Search Optimization":
    "ظهور علامة Adobe | تحسين الظهور في بحث الذكاء الاصطناعي",
  "Help videos | Aptus Customer Portal": "فيديوهات المساعدة | بوابة عملاء Aptus",
  "Support Tickets | Aptus Customer Portal": "تذاكر الدعم | بوابة عملاء Aptus",
  "Subscriptions | Aptus Customer Portal": "الاشتراكات | بوابة عملاء Aptus",
  "Renewals | Aptus Customer Portal": "التجديدات | بوابة عملاء Aptus",
  "Products | Aptus Customer Portal": "المنتجات | بوابة عملاء Aptus",
  "Profile | Aptus Customer Portal": "الملف الشخصي | بوابة عملاء Aptus",
  "Orders | Aptus Customer Portal": "الطلبات | بوابة عملاء Aptus",
  "Notifications | Aptus Customer Portal": "الإشعارات | بوابة عملاء Aptus",
  "Licenses | Aptus Customer Portal": "التراخيص | بوابة عملاء Aptus",
  "Invoices | Aptus Customer Portal": "الفواتير | بوابة عملاء Aptus",
  "Shopping Cart | Aptus Customer Portal": "سلة التسوق | بوابة عملاء Aptus",
  "Dashboard Overview | Aptus Customer Portal": "نظرة عامة على لوحة التحكم | بوابة عملاء Aptus",

  CostX: "CostX",
  CSI: "CSI",
  Bentley: "Bentley",
  Mathwork: "Mathwork",
  Symantec: "Symantec",
  "Palo Alto": "Palo Alto",
  RedHAT: "RedHAT",
  Lumion: "Lumion",
  Solidworks: "Solidworks",
  SPSS: "SPSS",
  Corona: "Corona",
  "D5 Render": "D5 Render",
  Quorum: "Quorum",
};

/**
 * Reviewed Arabic for English sentences on the pages in the corrected
 * document (هه.docx). English copy stays as written.
 * Pages not covered by the document are not listed.
 */
const AR_CORRECTIONS: Record<string, string> = {
  "25+ years in Oman, delivering smarter technology and integrated solutions that help businesses work better, operate securely and build for the future.": "+25 عامًا في عمان، حيث نقدم تكنولوجيا أكثر ذكاءً وحلولًا متكاملة تساعد الشركات على العمل بشكل أفضل والعمل بشكل آمن والبناء للمستقبل.",
  "Access, core, distribution, PoE, Layer 3, and managed switches — selected for the role each layer plays in your network.": "الوصول والمركز والتوزيع وPoE والطبقة 3 والمحولات المُدارة - تم تحديدها للدور الذي تلعبه كل طبقة في شبكتك.",
  "Advanced integrated catchment modeling software for water and wastewater infrastructure planning and management": "برنامج متقدم لنمذجة مستجمعات المياه لتخطيط وإدارة البنية التحتية للمياه والصرف الصحي",
  "Aptus Infotech is dedicated to upholding top-tier international standards in quality (ISO 9001:2015), environmental management (ISO 14001:2015), and occupational health & safety (ISO 45001:2018), with processes rigorously certified and globally recognized. This ensures enhanced customer satisfaction, improved efficiency, reduced environmental impact, regulatory compliance, better workplace safety, and a stronger reputation for businesses partnering with us.": "Aptus Infotech مكرسة لدعم أعلى المعايير الدولية في الجودة ISO (9001:2015)، والإدارة البيئية ISO (14001:2015)، والصحة والسلامة المهنية ISO (45001:2018)، من خلال عمليات معتمدة بدقة ومعترف بها عالميًا. وهذا يضمن تعزيز رضا العملاء، وتحسين الكفاءة، وتقليل التأثير البيئي، والامتثال التنظيمي، وتحسين السلامة في مكان العمل، وسمعة أقوى للشركات الشريكة معنا.",
  "Aptus Infotech traces its origins to the year 2000, with the establishment of Oriental Oryx Intl LLC in the Central Business District of Muscat. What began as a bold vision, inspired by the entrepreneurial spirit of Mr. Dhirubhai Ambani, grew into a trusted IT solutions partner for Oman's evolving technology sector.": "Aptus Infotech تعود أصولها إلى العام 2000، مع تأسيس شركة Oriental Oryx Intl LLC في منطقة الأعمال المركزية في مسقط. ما بدأ كرؤية جريئة، مستوحاة من روح المبادرة للسيد ديروبهاي أمباني، تطور ليصبح شريكًا موثوقًا لحلول تكنولوجيا المعلومات لقطاع التكنولوجيا المتطور في سلطنة عمان.",
  "Aptus retains personal data only for as long as reasonably necessary for the purpose for which it was collected, or for the period required by applicable law, contractual obligations, accounting requirements, dispute resolution or legitimate business purposes.": "تحتفظ Aptus بالبيانات الشخصية فقط طالما كانت ضرورية بشكل معقول للغرض الذي تم جمعها من أجله، أو للفترة التي يتطلبها القانون المعمول به، أو الالتزامات التعاقدية، أو المتطلبات المحاسبية، أو حل النزاعات، أو الأغراض التجارية المشروعة.",
  "As a landscape architect, Twinmotion’s vegetation and environmental tools are unparalleled. The ability to show clients how a space will look and feel throughout the seasons is invaluable.": "مهندسًا للمناظر الطبيعية، فإن النباتات والأدوات البيئية التي تمتلكها Twinmotion لا مثيل لها. إن القدرة على إظهار العملاء كيف ستبدو المساحة ومظهرها طوال الفصول أمر لا يقدر بثمن.",
  "AutoCAD is a leading commercial computer-aided design (CAD) and drafting software application. Developed by Autodesk, it enables architects, engineers, and construction professionals to create precise 2D and 3D drawings.": "AutoCAD هو أحد البرامج التجارية الرائدة في مجال التصميم بمساعدة الكمبيوتر (CAD) وصياغة التطبيقات. تم تطويره بواسطة Autodesk، وهو يمكّن المهندسين المعماريين والمهندسين ومحترفي البناء من إنشاء رسومات دقيقة تبلغ 2D و",
  "Challenge: Indian School Wadi Kabir International needed a dependable campus-wide IT foundation that could support teaching, administration, and day-to-day operations — without disrupting classes or risking downtime during term time.": "التحدي: احتاجت المدرسة الهندية بالوادي الكبير الدولية إلى مؤسسة تكنولوجيا معلومات يمكن الاعتماد عليها على مستوى الحرم الجامعي يمكنها دعم التدريس والإدارة والعمليات اليومية - دون تعطيل الفصول الدراسية أو المخاطرة بالتوقف عن العمل أثناء الفصل الدراسي.",
  "Combine voice, video, messaging, and collaboration tools in one platform for streamlined workflows.": "الجمع بين أدوات الصوت والفيديو والمراسلة والتعاون في نظام أساسي واحد لتسهيل سير العمل.",
  "Connect servers, storage, applications, and users through high-speed network infrastructure designed for demanding data center environments.": "قم بتوصيل الخوادم ووحدات التخزين والتطبيقات والمستخدمين من خلال بنية أساسية للشبكة عالية السرعة مصممة لبيئات مراكز البيانات كثيرة المتطلبات.",
  "Cost Savings": "وفورات في التكاليف",
  "Create and execute quality control checklists, track deficiencies, and ensure work meets specifications with comprehensive quality management tools.": "قم بإنشاء وتنفيذ قوائم فحص مراقبة الجودة، وتتبع أوجه القصور، والتأكد من أن العمل يلبي المواصفات باستخدام أدوات إدارة الجودة الشاملة.",
  "Create logos, branding materials, and marketing assets with precision and scalability.": "قم بإنشاء الشعارات ومواد العلامات التجارية وأصول التسويق بدقة وقابلية للتوسع.",
  "Create realistic materials with Corona’s advanced material system. Achieve photorealistic results with intuitive controls and a vast library of presets.": "بإنشاء مواد واقعية باستخدام نظام المواد المتقدم الخاص بـ .Corona احصل على نتائج واقعية باستخدام عناصر تحكم بديهية ومكتبة واسعة من الإعدادات المسبقة.",
  "Deliver robust business-class email and calendaring with Exchange Online, secure cloud file storage and sharing with OneDrive for Business, and a unified communication and collaboration hub with Microsoft Teams (for chat, video conferencing, and integrated apps).": "قم بتوفير بريد إلكتروني وتقويم قوي على مستوى الأعمال من خلال Online Exchange، وتخزين الملفات السحابية بشكل آمن ومشاركتها باستخدام Business for OneDrive، ومركز اتصالات وتعاون موحد مع Microsoft Teams )للدردشة ومؤتمرات الفيديو والتطبيقات المتكاملة",
  "Deploy standalone or linked thermal scanners across one lobby or many facility entrances.": "نشر الماسحات الضوئية الحرارية المستقلة أو المرتبطة عبر ردهة واحدة أو العديد من مداخل المنشأة.",
  "Express your creativity with digital painting tools that simulate traditional media and enable new techniques.": "عبر عن إبداعك باستخدام أدوات الرسم الرقمي التي تحاكي الوسائط التقليدية وتتيح تقنيات جديدة.",
  "Give guests convenient access to essential room functions through elegant, easy-to-use bedside control interfaces.": "امنح النزلاء إمكانية الوصول بسهولة إلى وظائف الغرفة الأساسية من خلال واجهات التحكم بجانب السرير الأنيقة وسهلة الاستخدام.",
  "HD cameras, codecs, and room systems for clear, reliable meetings across boardrooms and hybrid workplaces.": "كاميرات عالية الدقة وبرامج ترميز وأنظمة قاعات لعقد اجتماعات واضحة وموثوقة عبر قاعات مجالس الإدارة وأماكن العمل المختلطة.",
  "High-capacity backbone switches that move traffic between distribution layers, data centres, and critical systems at the heart of the network.": "محولات أساسية عالية السعة تعمل على نقل حركة المرور بين طبقات التوزيع ومراكز البيانات والأنظمة الحيوية في قلب الشبكة.",
  "Identify and resolve clashes early in the design phase, avoiding expensive rework costs during construction.": "تحديد وحل الصدامات في وقت مبكر من مرحلة التصميم، وتجنب تكاليف إعادة العمل الباهظة أثناء البناء.",
  "Improved Stakeholder Alignment": "تحسين توافق أصحاب المصلحة",
  "In 2005, this vision became Aptus Infotech — a dedicated team of pre-sales engineers and sales professionals, committed to delivering globally recognized software solutions (ISVs) and ELV systems with professionalism and competitive value.": "في 2005، أصبحت هذه الرؤية Aptus Infotech — فريقًا متخصصًا من مهندسي ما قبل البيع ومتخصصي المبيعات، الملتزمين بتقديم حلول برمجية معترف بها عالميًا (ISVs) وأنظمة ELV باحترافية وقيمة تنافسية.",
  "In the Architecture, Engineering, and Construction (AEC) world, the ability to communicate design intent quickly and realistically is paramount. Twinmotion, powered by Unreal Engine, is a leading real-time 3D visualization software that transforms your CAD and BIM models into photorealistic images, compelling videos, and immersive virtual reality (VR) experiences in minutes, not hours.": "في عالم الهندسة المعمارية والهندسة والبناء (AEC)، تعد القدرة على توصيل نية التصميم بسرعة وواقعية أمرًا بالغ الأهمية. Twinmotion، المدعوم بواسطة Engine Unreal، هو برنامج تصوري رائد في الوقت الفعلي 3D يحول نماذج CAD وBIM إلى صور واقعية ومقاطع فيديو جذابة وتجارب واقع افتراضي غامرة (VR) في دقائق وليس ساعات.",
  "In the modern Architecture, Engineering, and Construction (AEC) industry, data-rich and highly coordinated design is no longer optional—it’s essential. Autodesk Revit is the world’s leading Building Information Modeling (BIM) software, enabling design professionals to create intelligent 3D models and produce accurate documentation from a single, unified platform.": "في مجال الهندسة المعمارية والهندسة والإنشاءات (AEC) الحديث، لم يعد التصميم الغني بالبيانات والمنسق للغاية أمرًا اختياريًا، بل أصبح ضروريًا. Revit Autodesk هو البرنامج الرائد عالميًا لنمذجة معلومات البناء (BIM)، مما يمكّن محترفي التصميم من إنشاء نماذج ذكية 3D وإنتاج وثائق دقيقة من منصة واحدة موحدة.",
  "Intelligent room control for guest comfort, energy savings, and hotel operations.": "التحكم الذكي في الغرفة لراحة النزلاء وتوفير الطاقة وعمليات الفندق.",
  "Intuitive bedside call stations allow patients to request assistance quickly and conveniently, with clear indication of call status.": "محطات الاتصال البديهية بجانب السرير للمرضى طلب المساعدة بسرعة وسهولة، مع إشارة واضحة لحالة الاتصال.",
  "IT Manager": "مدير تقنية المعلومات",
  "Make more accurate predictions of system behavior with advanced hydraulic engines and comprehensive modeling capabilities.": "يمكنك إجراء تنبؤات أكثر دقة لسلوك النظام باستخدام المحركات الهيدروليكية المتقدمة وإمكانيات النمذجة الشاملة.",
  "Meet Firefly Graph: Reusable Creative Workflows with Generative AI": "تعرف على الرسم البياني :Firefly سير العمل الإبداعي القابل لإعادة الاستخدام باستخدام الذكاء الاصطناعي التوليدي",
  "Nama — Video Diagnosis, Video Intelligent Analysis, Access Control Technology": "نماء - تشخيص الفيديو، التحليل الذكي للفيديو، تكنولوجيا التحكم في الوصول",
  "New Oracle Aconex Capabilities Improve Project Transparency and Control": "إمكانيات Oracle Aconex الجديدة على تحسين شفافية المشروع والتحكم فيه",
  "Our experts can help you to implement the right security system for your business.": "يمكن لخبرائنا مساعدتك في تطبيق نظام الأمان المناسب لشركتك.",
  "Perform advanced hydraulic analysis of drainage networks including steady-state, dynamic, and flood modeling to understand system behavior under various conditions.": "قم بإجراء تحليل هيدروليكي متقدم لشبكات الصرف الصحي بما في ذلك نمذجة الحالة المستقرة والديناميكية والفيضانات لفهم سلوك النظام في ظل الظروف",
  "Perform calculations and generate estimates directly within the application with customizable formulas.": "بإجراء الحسابات وإنشاء التقديرات مباشرة داخل التطبيق باستخدام صيغ قابلة للتخصيص.",
  "Prices displayed on the website are subject to change without prior notice, except where otherwise required by applicable law or where an order has already been formally accepted.": "الأسعار المعروضة على الموقع الإلكتروني قابلة للتغيير دون إشعار مسبق، ما لم ينص القانون المعمول به على خلاف ذلك أو حيث تم بالفعل قبول الطلب رسميًا.",
  "Protect your digital world with Kaspersky's cutting-edge security technologies that defend against the most sophisticated cyber threats": "قم بحماية عالمك الرقمي باستخدام تقنيات الأمان المتطورة التي تقدمها Kaspersky والتي تحميك من التهديدات السيبرانية الأكثر تطورًا",
  "Quality Assurance & Punch Lists": "ضمان الجودة وقوائم المراجعة",
  "Reliable and organizedcabling system minimizes network disruptions and costly downtime.": "نظام الكابلات الموثوق والمنظم على تقليل انقطاع الشبكة ووقت التوقف عن العمل المكلف.",
  "Seamless integration between security products enables sharing of threat intelligence and coordinated response.": "يتيح التكامل السلس بين المنتجات الأمنية مشاركة المعلومات المتعلقة بالتهديدات والاستجابة المنسقة.",
  "Secure your cloud infrastructure and applications with comprehensive cloud security solutions.": "قم بتأمين البنية الأساسية السحابية والتطبيقات الخاصة بك باستخدام حلول الأمان السحابية الشاملة.",
  "Share from laptops, tablets, and phones instantly so presenters start the meeting without cables or adapter hunting.": "يمكنك المشاركة من أجهزة الكمبيوتر المحمولة والأجهزة اللوحية والهواتف على الفور حتى يبدأ مقدمو العروض الاجتماع دون الحاجة إلى استخدام الكابلات أو المحولات.",
  "Simple touch panels to start the meeting, switch sources, and control the conference display — without a separate building-automation project.": "لوحات لمس بسيطة لبدء الاجتماع، وتبديل المصادر، والتحكم في شاشة عرض المؤتمر - دون الحاجة إلى مشروع منفصل لأتمتة المبنى.",
  "Smart locks, cameras, sensors, and alerts that protect your home and let you control entry remotely.": "أقفال ذكية وكاميرات وأجهزة استشعار وتنبيهات تحمي منزلك وتتيح لك التحكم في الدخول عن بعد.",
  "Support demanding applications, cloud services, video collaboration, and large volumes of network traffic with high-performance switching and routing infrastructure.": "دعم التطبيقات كثيرة المتطلبات والخدمات السحابية والتعاون عبر الفيديو والكميات الكبيرة من حركة مرور الشبكة من خلال البنية الأساسية للتبديل والتوجيه عالية الأداء.",
  "Support urgent communication with dedicated emergency buttons, pull cords, and specialized call points designed for patient safety.": "دعم الاتصالات العاجلة باستخدام أزرار الطوارئ المخصصة وأسلاك السحب ونقاط الاتصال المتخصصة المصممة لسلامة المرضى.",
  "The Sultan's School — IP CCTV Systems for Safety, Security & Control of Sultan School": "مدرسة السلطان — CCTV IP أنظمة السلامة والأمن والتحكم في مدرسة السلطان",
  "The thermal diagnostic tool helped us locate hidden moisture damage in our building envelope before it became a major issue. This proactive approach saved us significant repair costs.": "ساعدتنا أداة التشخيص الحراري في تحديد أضرار الرطوبة المخفية في غلاف المبنى قبل أن تصبح مشكلة كبيرة. لقد وفر علينا هذا النهج الاستباقي تكاليف إصلاح كبيرة.",
  "Thermal cameras calibrated for reliable skin-temperature screening in high-traffic lobbies and checkpoints.": "تم معايرة الكاميرات الحرارية لإجراء فحص موثوق لدرجة حرارة الجلد في الردهات ونقاط التفتيش ذات الحركة المرورية العالية.",
  "Use realistic rendering and walkthroughs to communicate design intent clearly to all stakeholders.": "استخدم العرض الواقعي والإرشادات التفصيلية لإيصال هدف التصميم بوضوح إلى جميع أصحاب المصلحة.",
  "We offered the most comprehensive product portfolio of ELV and security solutions. Our team experts provided design, integration and implementation services to the Camel and horse racing building in Adam and Sports complex in Mawellah.": "لقد قدمنا مجموعة المنتجات الأكثر شمولاً من ELV والحلول الأمنية. قدم خبراء فريقنا خدمات التصميم والتكامل والتنفيذ لمبنى سباق الهجن والخيول في أدم والمجمع الرياضي بالموالح",
  "With over 500,000 customers worldwide, Fortinet provides comprehensive protection across the entire digital attack surface, from network to endpoint, cloud, and IoT environments.": "عن 500،000 من العملاء حول العالم، يوفر Fortinet حماية شاملة عبر سطح الهجوم الرقمي بالكامل، بدءًا من الشبكة وحتى نقطة النهاية والسحابة وبيئات إنترنت الأشياء.",
  "World-class vendors, backed by a team in Oman with 25+ years of local experience.": "بائعون عالميون، مدعومون بفريق في عمان يتمتع بخبرة محلية تزيد عن 25 عامًا.",
};

export function arabicCorrection(text: string): string | undefined {
  const key = text.trim();
  if (Object.prototype.hasOwnProperty.call(AR_CORRECTIONS, key)) return AR_CORRECTIONS[key];
  return undefined;
}

export function sharedArabic(text: string): string | undefined {
  const key = text.trim();
  const reviewed = arabicCorrection(key);
  if (reviewed !== undefined) return reviewed;
  if (Object.prototype.hasOwnProperty.call(SHARED_AR, key)) return SHARED_AR[key];
  return undefined;
}

const COPYRIGHT =
  /^© (\d{4}) Aptus Infotech\. All rights reserved\.$/;
const QUOTE_REF =
  /^Your Request Quote has been submitted successfully\.\nReference Number: (.+)$/;

/** Shared Arabic when the visitor's language is Arabic. Anything else stays as written. */
export function copyForLocale(locale: Locale, text: string): string {
  if (locale !== "ar") return text;
  const hit = sharedArabic(text);
  if (hit !== undefined) return hit;
  const copy = text.match(COPYRIGHT);
  if (copy) return `© ${copy[1]} Aptus Infotech. جميع الحقوق محفوظة.`;
  const ref = text.match(QUOTE_REF);
  if (ref) return `تم إرسال طلب عرض السعر بنجاح.\nالرقم المرجعي: ${ref[1]}`;
  return text;
}

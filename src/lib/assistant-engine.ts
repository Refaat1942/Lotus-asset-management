import { Locale } from './i18n';

interface KnowledgeEntry {
  keywords: string[];
  en: string;
  ar: string;
}

const KNOWLEDGE: KnowledgeEntry[] = [
  {
    keywords: ['import', 'excel', 'upload', 'template', 'bulk', 'استيراد', 'اكسل', 'إكسل', 'رفع', 'ملف', 'قالب'],
    en: 'To import assets: open **Import** from the sidebar → download the **Lotus template** → fill your data → upload the file. The system auto-maps columns like Code, Department, Serial-Number, Device Price, and Site Name. Use **Upsert** mode to update existing assets by Code.',
    ar: 'لاستيراد الأصول: افتح **استيراد Excel** من القائمة → حمّل **قالب Lotus** → املأ البيانات → ارفع الملف. النظام يربط الأعمدة تلقائياً مثل Code و Department و Serial-Number و Device Price و Site Name. استخدم وضع **Upsert** لتحديث الأصول الموجودة حسب الكود.',
  },
  {
    keywords: ['qr', 'qrcode', 'scan', 'barcode', 'print', 'رمز', 'مسح', 'طباعة'],
    en: 'QR codes are **secured**: scanning shows only the asset code, not passwords or employee data. Open an asset → print the QR label. Only logged-in users can see full details inside the system.',
    ar: 'رموز QR **محمية**: عند المسح يظهر كود الأصل فقط بدون كلمات مرور أو بيانات موظفين. افتح الأصل → اطبع ملصق QR. التفاصيل الكاملة متاحة فقط للمستخدمين المسجّلين.',
  },
  {
    keywords: ['report', 'export', 'تقرير', 'تقارير', 'تصدير'],
    en: 'Open **Reports** for 17+ report types: assets by department, branch, status, category, manufacturer, assignee, unassigned assets, assignments, transfers, history, depreciation, and import logs. Generate on screen or export to Excel.',
    ar: 'افتح **التقارير** لأكثر من 17 نوعاً: الأصول حسب القسم والفرع والحالة والفئة والشركة المصنعة والمسؤول، الأصول غير المعينة، التعيينات، النقل، السجل، الإهلاك، وسجل الاستيراد. يمكنك التصدير إلى Excel.',
  },
  {
    keywords: ['dashboard', 'stats', 'statistics', 'لوحة', 'إحصائيات', 'تحكم'],
    en: 'The **Dashboard** shows total assets, assigned/unassigned counts, total value in **EGP**, depreciation, and breakdowns by department, branch, and status. Click **Refresh** after importing data.',
    ar: '**لوحة التحكم** تعرض إجمالي الأصول والمعينة/غير المعينة والقيمة بالجنيه المصري والإهلاك وتوزيع الأقسام والفروع والحالات. اضغط **تحديث** بعد الاستيراد.',
  },
  {
    keywords: ['asset', 'create', 'add', 'edit', 'delete', 'أصل', 'أصول', 'إضافة', 'تعديل', 'حذف'],
    en: 'Manage assets under **Assets**: search, filter, add, edit, delete, assign, transfer, and view history. Each asset has a timeline of all changes.',
    ar: 'إدارة الأصول من **الأصول**: بحث، تصفية، إضافة، تعديل، حذف، تعيين، نقل، وعرض السجل. كل أصل له خط زمني لجميع التغييرات.',
  },
  {
    keywords: ['department', 'قسم', 'أقسام', 'إدارة'],
    en: '**Departments** organizes assets by team (IT, HR, etc.). Import can auto-create departments from the Excel Department column.',
    ar: '**الأقسام** تنظم الأصول حسب الفريق. الاستيراد ينشئ الأقسام تلقائياً من عمود Department في Excel.',
  },
  {
    keywords: ['branch', 'site', 'location', 'فرع', 'فروع', 'موقع'],
    en: '**Branches / Sites** track where assets are located. The import maps **Site Name** to branch automatically.',
    ar: '**الفروع / المواقع** تتبع موقع الأصول. الاستيراد يربط **Site Name** بالفرع تلقائياً.',
  },
  {
    keywords: ['person', 'employee', 'assignee', 'holder', 'موظف', 'شخص', 'مسؤول', 'تعيين'],
    en: '**Persons** lists employees who hold assets. Import uses **Assigned Employee Name** and **Assigned Employee Code** columns.',
    ar: '**الأشخاص** يعرض الموظفين الحاملين للأصول. الاستيراد يستخدم أعمدة **Assigned Employee Name** و **Assigned Employee Code**.',
  },
  {
    keywords: ['user', 'login', 'password', 'auth', 'permission', 'مستخدم', 'دخول', 'كلمة', 'صلاحية'],
    en: '**Users & Authorization** control who can view, edit, import, and manage settings. Default admin login is set during installation. Change password in **Settings**.',
    ar: '**المستخدمين والصلاحيات** يتحكمون في من يعرض أو يعدّل أو يستورد أو يدير الإعدادات. غيّر كلمة المرور من **الإعدادات**.',
  },
  {
    keywords: ['setting', 'logo', 'backup', 'إعدادات', 'شعار', 'نسخ'],
    en: '**Settings**: upload company logo, set company name, run database backup. Logo appears in sidebar and login page.',
    ar: '**الإعدادات**: رفع شعار الشركة، اسم الشركة، نسخ احتياطي لقاعدة البيانات. الشعار يظهر في القائمة وصفحة الدخول.',
  },
  {
    keywords: ['password', 'anydesk', 'admin', 'ip', 'vendor', 'secure', 'حساس', 'أي ديسك'],
    en: 'Sensitive fields (AnyDesk passwords, admin passwords, IP) are stored in **internal notes** only — visible to logged-in users, **never** exposed via QR scan or public pages.',
    ar: 'الحقول الحساسة (كلمات مرور AnyDesk و admin و IP) تُخزّن في **ملاحظات داخلية** فقط — مرئية للمستخدمين المسجّلين و**لا تظهر** عند مسح QR أو الصفحات العامة.',
  },
  {
    keywords: ['hello', 'hi', 'help', 'مرحبا', 'أهلا', 'مساعدة', 'ساعدني'],
    en: 'Hello! I am the Lotus Asset Assistant. Ask me about imports, assets, reports, QR codes, departments, branches, users, or settings — in English or Arabic.',
    ar: 'مرحباً! أنا مساعد نظام لوتس لإدارة الأصول. اسألني عن الاستيراد، الأصول، التقارير، رموز QR، الأقسام، الفروع، المستخدمين، أو الإعدادات — بالعربية أو الإنجليزية.',
  },
  {
    keywords: ['column', 'code', 'serial', 'device price', 'عمود', 'كود', 'تسلسل'],
    en: 'Template columns: Code, Assigned Employee Code/Name, Employee Position, Department, Serial-Number, Device, OS, Part No, Description, Manufacturer, Model-Name, Device Price, Purchase Date, Start-up date, Device-Type, Site, Site Name, AnyDesk fields, Admin fields, IP, Vendor Name.',
    ar: 'أعمدة القالب: Code، Assigned Employee Code/Name، Employee Position، Department، Serial-Number، Device، OS، Part No، Description، Manufacturer، Model-Name، Device Price، Purchase Date، Start-up date، Device-Type، Site، Site Name، حقول AnyDesk و Admin و IP و Vendor Name.',
  },
];

const FALLBACK = {
  en: 'I can help with: Excel import, assets, dashboard, reports, QR security, departments, branches, persons, users, and settings. Try asking in English or Arabic, e.g. "How do I import Excel?" or "كيف أستورد ملف اكسل؟"',
  ar: 'يمكنني المساعدة في: استيراد Excel، الأصول، لوحة التحكم، التقارير، حماية QR، الأقسام، الفروع، الأشخاص، المستخدمين، والإعدادات. جرّب السؤال بالعربية أو الإنجليزية.',
};

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

export function getAssistantReply(message: string, locale: Locale): string {
  const text = normalize(message);
  if (!text) return locale === 'ar' ? FALLBACK.ar : FALLBACK.en;

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (text.includes(normalize(keyword))) {
        score += keyword.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore > 0) {
    return locale === 'ar' ? best.ar : best.en;
  }

  return locale === 'ar' ? FALLBACK.ar : FALLBACK.en;
}

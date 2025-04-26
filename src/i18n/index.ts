
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      // Navigation & Common UI
      "features": "Why Choose شغلني?",
      "howItWorks": "How It Works",
      "login": "Login",
      "register": "Register",
      "dashboard": "Dashboard",
      "getStarted": "Get Started",
      "browseJobs": "Browse Jobs",
      "allJobs": "All Jobs",
      "findJobsNearYou": "Find Jobs Near You",
      "connectTalent": "Connect Talent with Opportunity",
      "platformDescription": "The platform that brings together skilled contractors and job posters in a seamless marketplace designed for success.",
      "quickLinks": "Quick Links",
      "contactSupport": "Contact Support",
      "home": "Home",
      "signUp": "Sign Up",
      "allRightsReserved": "All rights reserved.",
      "joinToday": "Join شغلني Today",
      "myAccount": "My Account",
      "logout": "Log out",
      
      // Job-related
      "jobs": "Jobs",
      "postJob": "Post a Job",
      "postNewJob": "Post a New Job",
      "myJobs": "My Jobs",
      "activeJobs": "Active Jobs",
      "completedJobs": "Completed Jobs",
      "recentJobs": "Recent Jobs",
      "viewAllJobs": "View All Jobs",
      "postYourFirstJob": "Post Your First Job",
      "noJobsPosted": "You haven't posted any jobs yet.",
      "viewDetails": "View Details",
      "open": "Open",
      "inProgress": "In Progress",
      "completed": "Completed",
      "location": "Location",
      "posted": "Posted",
      "budget": "Budget",
      "viewOffers": "View Offers",
      
      // Offers
      "myOffers": "My Offers",
      "pendingOffers": "Pending Offers",
      "acceptedOffers": "Accepted Offers",
      "viewAllOffers": "View All My Offers",
      "noOffersYet": "You haven't made any offers yet.",
      "offered": "Offered",
      "submitted": "Submitted",
      "pending": "Pending",
      "accepted": "Accepted",
      "rejected": "Rejected",
      
      // Dashboard
      "jobPosterDashboard": "Job Poster Dashboard",
      "contractorDashboard": "Contractor Dashboard",
      "availableJobs": "Available Jobs",
      "jobPoster": "Job Poster",
      "contractor": "Contractor",
      "loadingJobs": "Loading jobs...",
      "loadingOffers": "Loading offers...",
      "loadingUserData": "Loading user data...",
      "noOpenJobs": "No open jobs available at the moment.",
      "myRecentOffers": "My Recent Offers"
    }
  },
  ar: {
    translation: {
      // Navigation & Common UI
      "features": "لماذا تختار شغلني؟",
      "howItWorks": "كيف يعمل",
      "login": "تسجيل الدخول",
      "register": "التسجيل",
      "dashboard": "لوحة التحكم",
      "getStarted": "ابدأ الآن",
      "browseJobs": "تصفح الوظائف",
      "allJobs": "جميع الوظائف",
      "findJobsNearYou": "ابحث عن وظائف بالقرب منك",
      "connectTalent": "نربط المواهب بالفرص",
      "platformDescription": "المنصة التي تجمع المقاولين المهرة مع أصحاب العمل في سوق سلس مصمم للنجاح",
      "quickLinks": "روابط سريعة",
      "contactSupport": "اتصل بالدعم",
      "home": "الرئيسية",
      "signUp": "سجل الآن",
      "allRightsReserved": "جميع الحقوق محفوظة",
      "joinToday": "انضم إلى شغلني اليوم",
      "myAccount": "حسابي",
      "logout": "تسجيل الخروج",
      
      // Job-related
      "jobs": "الوظائف",
      "postJob": "نشر وظيفة",
      "postNewJob": "نشر وظيفة جديدة",
      "myJobs": "وظائفي",
      "activeJobs": "الوظائف النشطة",
      "completedJobs": "الوظائف المكتملة",
      "recentJobs": "الوظائف الأخيرة",
      "viewAllJobs": "عرض كل الوظائف",
      "postYourFirstJob": "انشر وظيفتك الأولى",
      "noJobsPosted": "لم تقم بنشر أي وظائف حتى الآن.",
      "viewDetails": "عرض التفاصيل",
      "open": "مفتوح",
      "inProgress": "قيد التنفيذ",
      "completed": "مكتمل",
      "location": "الموقع",
      "posted": "تم النشر",
      "budget": "الميزانية",
      "viewOffers": "عرض العروض",
      
      // Offers
      "myOffers": "عروضي",
      "pendingOffers": "العروض المعلقة",
      "acceptedOffers": "العروض المقبولة",
      "viewAllOffers": "عرض جميع عروضي",
      "noOffersYet": "لم تقدم أي عروض حتى الآن.",
      "offered": "تم تقديم",
      "submitted": "تم الإرسال",
      "pending": "معلق",
      "accepted": "مقبول",
      "rejected": "مرفوض",
      
      // Dashboard
      "jobPosterDashboard": "لوحة تحكم صاحب العمل",
      "contractorDashboard": "لوحة تحكم المقاول",
      "availableJobs": "الوظائف المتاحة",
      "jobPoster": "صاحب العمل",
      "contractor": "مقاول",
      "loadingJobs": "جاري تحميل الوظائف...",
      "loadingOffers": "جاري تحميل العروض...",
      "loadingUserData": "جاري تحميل بيانات المستخدم...",
      "noOpenJobs": "لا توجد وظائف مفتوحة متاحة حالياً.",
      "myRecentOffers": "عروضي الأخيرة"
    }
  },
  he: {
    translation: {
      // Navigation & Common UI
      "features": "למה לבחור شغلني?",
      "howItWorks": "איך זה עובד",
      "login": "התחברות",
      "register": "הרשמה",
      "dashboard": "לוח בקרה",
      "getStarted": "התחל עכשיו",
      "browseJobs": "עיון במשרות",
      "allJobs": "כל המשרות",
      "findJobsNearYou": "חפש משרות בקרבתך",
      "connectTalent": "מחבר בין כישרונות להזדמנויות",
      "platformDescription": "הפלטפורמה המחברת בין קבלנים מיומנים למפרסמי משרות בשוק חלק המתוכנן להצלחה",
      "quickLinks": "קישורים מהירים",
      "contactSupport": "צור קשר עם התמיכה",
      "home": "דף הבית",
      "signUp": "הירשם",
      "allRightsReserved": "כל הזכויות שמורות",
      "joinToday": "הצטרף ל-شغلني היום",
      "myAccount": "החשבון שלי",
      "logout": "התנתק",
      
      // Job-related
      "jobs": "משרות",
      "postJob": "פרסם משרה",
      "postNewJob": "פרסם משרה חדשה",
      "myJobs": "המשרות שלי",
      "activeJobs": "משרות פעילות",
      "completedJobs": "משרות שהושלמו",
      "recentJobs": "משרות אחרונות",
      "viewAllJobs": "צפה בכל המשרות",
      "postYourFirstJob": "פרסם את המשרה הראשונה שלך",
      "noJobsPosted": "עדיין לא פרסמת משרות.",
      "viewDetails": "צפה בפרטים",
      "open": "פתוח",
      "inProgress": "בתהליך",
      "completed": "הושלם",
      "location": "מיקום",
      "posted": "פורסם",
      "budget": "תקציב",
      "viewOffers": "צפה בהצעות",
      
      // Offers
      "myOffers": "ההצעות שלי",
      "pendingOffers": "הצעות ממתינות",
      "acceptedOffers": "הצעות שהתקבלו",
      "viewAllOffers": "צפה בכל ההצעות שלי",
      "noOffersYet": "טרם הגשת הצעות.",
      "offered": "הוצע",
      "submitted": "הוגש",
      "pending": "ממתין",
      "accepted": "התקבל",
      "rejected": "נדחה",
      
      // Dashboard
      "jobPosterDashboard": "לוח בקרה למפרסם משרות",
      "contractorDashboard": "לוח בקרה לקבלן",
      "availableJobs": "משרות זמינות",
      "jobPoster": "מפרסם משרות",
      "contractor": "קבלן",
      "loadingJobs": "טוען משרות...",
      "loadingOffers": "טוען הצעות...",
      "loadingUserData": "טוען נתוני משתמש...",
      "noOpenJobs": "אין כרגע משרות פתוחות זמינות.",
      "myRecentOffers": "ההצעות האחרונות שלי"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

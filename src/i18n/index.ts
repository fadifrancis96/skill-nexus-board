
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "features": "Why Choose شغلني?",
      "howItWorks": "How It Works",
      "login": "Login",
      "register": "Register",
      "dashboard": "Dashboard",
      "getStarted": "Get Started",
      "browseJobs": "Browse Jobs",
      "findJobsNearYou": "Find Jobs Near You",
      "connectTalent": "Connect Talent with Opportunity",
      "platformDescription": "The platform that brings together skilled contractors and job posters in a seamless marketplace designed for success.",
      "quickLinks": "Quick Links",
      "contactSupport": "Contact Support",
      "home": "Home",
      "signUp": "Sign Up",
      "allRightsReserved": "All rights reserved.",
      "joinToday": "Join شغلني Today"
    }
  },
  ar: {
    translation: {
      "features": "لماذا تختار شغلني؟",
      "howItWorks": "كيف يعمل",
      "login": "تسجيل الدخول",
      "register": "التسجيل",
      "dashboard": "لوحة التحكم",
      "getStarted": "ابدأ الآن",
      "browseJobs": "تصفح الوظائف",
      "findJobsNearYou": "ابحث عن وظائف بالقرب منك",
      "connectTalent": "نربط المواهب بالفرص",
      "platformDescription": "المنصة التي تجمع المقاولين المهرة مع أصحاب العمل في سوق سلس مصمم للنجاح",
      "quickLinks": "روابط سريعة",
      "contactSupport": "اتصل بالدعم",
      "home": "الرئيسية",
      "signUp": "سجل الآن",
      "allRightsReserved": "جميع الحقوق محفوظة",
      "joinToday": "انضم إلى شغلني اليوم"
    }
  },
  he: {
    translation: {
      "features": "למה לבחור شغلني?",
      "howItWorks": "איך זה עובד",
      "login": "התחברות",
      "register": "הרשמה",
      "dashboard": "לוח בקרה",
      "getStarted": "התחל עכשיו",
      "browseJobs": "עיון במשרות",
      "findJobsNearYou": "חפש משרות בקרבתך",
      "connectTalent": "מחבר בין כישרונות להזדמנויות",
      "platformDescription": "הפלטפורמה המחברת בין קבלנים מיומנים למפרסמי משרות בשוק חלק המתוכנן להצלחה",
      "quickLinks": "קישורים מהירים",
      "contactSupport": "צור קשר עם התמיכה",
      "home": "דף הבית",
      "signUp": "הירשם",
      "allRightsReserved": "כל הזכויות שמורות",
      "joinToday": "הצטרף ל-شغلني היום"
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

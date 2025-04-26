
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  // Apply saved language on component mount
  useEffect(() => {
    const savedLang = localStorage.getItem("preferredLanguage");
    if (savedLang && savedLang !== i18n.language) {
      applyLanguage(savedLang);
    }
  }, []);

  const applyLanguage = (lng: string) => {
    // Set html dir and lang attributes first
    document.documentElement.dir = lng === "ar" || lng === "he" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
    
    // Save language preference to localStorage
    localStorage.setItem("preferredLanguage", lng);
    
    // Change language after setting the direction
    i18n.changeLanguage(lng);
  };
  
  const changeLanguage = (lng: string) => {
    applyLanguage(lng);
    // Force a reload to properly apply RTL/LTR changes throughout the app
    window.location.reload();
  };

  const getCurrentLanguage = () => {
    switch(i18n.language) {
      case 'ar':
        return 'العربية';
      case 'he':
        return 'עברית';
      default:
        return 'English';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span>{getCurrentLanguage()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage("en")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("ar")}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage("he")}>
          עברית
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

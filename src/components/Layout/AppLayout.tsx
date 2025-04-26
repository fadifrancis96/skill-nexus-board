
import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu, List, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { currentUserData, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isJobPoster = currentUserData?.role === "job_poster";
  
  const navLinks = [
    {
      name: t('dashboard'),
      path: "/dashboard",
      show: true,
    },
    {
      name: t('jobs'),
      path: "/jobs",
      show: true,
    },
    {
      name: t('allJobs'),
      path: "/jobs-map",
      show: !isJobPoster, // Only show to contractors
    },
    {
      name: t('postJob'),
      path: "/jobs/new",
      show: isJobPoster,
    },
    {
      name: t('myJobs'),
      path: "/my-jobs",
      show: isJobPoster,
    },
    {
      name: t('myOffers'),
      path: "/my-offers",
      show: !isJobPoster,
    },
  ];

  const filteredNavLinks = navLinks.filter((link) => link.show);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary flex items-center">
                <Sparkles className="h-6 w-6 mr-2" />
                <span className="arabic">شغلني</span>
              </Link>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4">
              {filteredNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  {link.path === "/jobs-map" && <List className="mr-1 h-4 w-4" />}
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>
                        {currentUserData?.displayName || currentUserData?.email}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span className="capitalize">
                        {currentUserData?.role === "job_poster"
                          ? t('jobPoster')
                          : t('contractor')}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "md:hidden",
              isMobileMenuOpen ? "block" : "hidden"
            )}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.path === "/jobs-map" && <List className="mr-1 h-4 w-4" />}
                  {link.name}
                </Link>
              ))}
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-500">
                  {currentUserData?.displayName || currentUserData?.email}
                </div>
                <Button 
                  variant="ghost"
                  className="mt-2 w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-0"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} <span className="arabic">شغلني</span>. {t('allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}

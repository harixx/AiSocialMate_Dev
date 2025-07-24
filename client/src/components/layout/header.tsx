import { Menu, ChartLine, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Section } from "@/pages/home";

interface HeaderProps {
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  sections: Array<{ id: Section; title: string; icon: string }>;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Header({ 
  currentSection, 
  setCurrentSection, 
  sections, 
  setIsMobileMenuOpen 
}: HeaderProps) {
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartLine className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">SocialMonitor AI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={currentSection === section.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentSection(section.id)}
                className="font-medium"
              >
                {section.title}
              </Button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

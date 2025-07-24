import { X, ChartLine, Search, MessageCircle, Bot, Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Section } from "@/pages/home";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: Section;
  setCurrentSection: (section: Section) => void;
  sections: Array<{ id: Section; title: string; icon: string }>;
}

const iconMap = {
  search: Search,
  comments: MessageCircle,
  robot: Bot,
  bell: Bell,
  download: Download,
};

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  currentSection, 
  setCurrentSection, 
  sections 
}: MobileMenuProps) {
  
  const handleSectionChange = (sectionId: Section) => {
    setCurrentSection(sectionId);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ChartLine className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold">SocialMonitor AI</span>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-8 space-y-2">
          {sections.map((section) => {
            const Icon = iconMap[section.icon as keyof typeof iconMap];
            const isActive = currentSection === section.id;
            
            return (
              <Button
                key={section.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start space-x-3"
                onClick={() => handleSectionChange(section.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{section.title}</span>
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

import { useState } from "react";
import Header from "@/components/layout/header";
import MobileMenu from "@/components/layout/mobile-menu";
import BrandOpportunities from "@/components/sections/brand-opportunities";
import ThreadDiscovery from "@/components/sections/thread-discovery";
import AIReplyGenerator from "@/components/sections/ai-reply-generator";
import RescanAlerts from "@/components/sections/rescan-alerts";
import ExportReports from "@/components/sections/export-reports";

export type Section = 'brand-opportunities' | 'thread-discovery' | 'ai-reply-generator' | 'rescan-alerts' | 'export-reports';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('brand-opportunities');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'brand-opportunities' as const, title: 'Brand Opportunities', icon: 'search' },
    { id: 'thread-discovery' as const, title: 'Thread Discovery', icon: 'comments' },
    { id: 'ai-reply-generator' as const, title: 'AI Reply Generator', icon: 'robot' },
    { id: 'rescan-alerts' as const, title: 'Rescan Alerts', icon: 'bell' },
    { id: 'export-reports' as const, title: 'Export Reports', icon: 'download' },
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'brand-opportunities':
        return <BrandOpportunities />;
      case 'thread-discovery':
        return <ThreadDiscovery />;
      case 'ai-reply-generator':
        return <AIReplyGenerator />;
      case 'rescan-alerts':
        return <RescanAlerts />;
      case 'export-reports':
        return <ExportReports />;
      default:
        return <BrandOpportunities />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        sections={sections}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        sections={sections}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSection()}
      </main>
    </div>
  );
}

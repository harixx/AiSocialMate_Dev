import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FAQGeneratorForm from "@/components/forms/faq-generator-form";

export default function FAQGenerator() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ Generator</h1>
        <p className="text-gray-600">Generate comprehensive FAQ sections based on real social media discussions and questions.</p>
      </div>

      <FAQGeneratorForm />
    </div>
  );
}
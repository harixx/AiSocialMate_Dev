import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExportReports() {
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState("");
  const [format, setFormat] = useState("pdf");
  const { toast } = useToast();

  const handleExport = async () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Success",
        description: "Report exported successfully!"
      });
    }, 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Reports</h1>
        <p className="text-gray-600">Export your monitoring data and insights to various formats.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand-opportunities">Brand Opportunities Report</SelectItem>
                <SelectItem value="thread-discovery">Thread Discovery Report</SelectItem>
                <SelectItem value="generated-replies">Generated Replies Report</SelectItem>
                <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input type="date" id="fromDate" />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input type="date" id="toDate" />
            </div>
          </div>

          <div>
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat} className="mt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="font-medium cursor-pointer">PDF</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="excel" id="excel" />
                  <Label htmlFor="excel" className="font-medium cursor-pointer">Excel</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="font-medium cursor-pointer">CSV</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="font-medium cursor-pointer">JSON</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

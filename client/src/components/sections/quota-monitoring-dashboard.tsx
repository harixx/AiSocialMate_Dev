
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";

interface QuotaUsage {
  id: number;
  month: string;
  totalApiCalls: number;
  remainingCalls: number;
  lastUpdated: string;
}

export default function QuotaMonitoringDashboard() {
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotaUsage();
    
    // Refresh quota data every 30 seconds
    const interval = setInterval(fetchQuotaUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotaUsage = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const response = await fetch(`/api/quota-usage?month=${currentMonth}`);
      if (response.ok) {
        const data = await response.json();
        setQuotaUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch quota usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!quotaUsage) return 0;
    const totalLimit = quotaUsage.totalApiCalls + quotaUsage.remainingCalls;
    return totalLimit > 0 ? (quotaUsage.totalApiCalls / totalLimit) * 100 : 0;
  };

  const getUsageStatus = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return { status: 'critical', color: 'text-red-500', icon: AlertTriangle };
    if (percentage >= 70) return { status: 'warning', color: 'text-yellow-500', icon: Clock };
    return { status: 'healthy', color: 'text-green-500', icon: CheckCircle };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-gray-400 mr-2" />
            <span>Loading quota information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageStatus = getUsageStatus();
  const StatusIcon = usageStatus.icon;
  const usagePercentage = getUsagePercentage();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${usageStatus.color}`} />
              Usage Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge 
                variant={usageStatus.status === 'critical' ? 'destructive' : 
                        usageStatus.status === 'warning' ? 'secondary' : 'default'}
                className="capitalize"
              >
                {usageStatus.status}
              </Badge>
              <Progress value={usagePercentage} className="h-3" />
              <div className="text-sm text-gray-600">
                {usagePercentage.toFixed(1)}% of monthly quota used
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              API Calls Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {quotaUsage?.totalApiCalls || 0}
              </div>
              <div className="text-sm text-gray-600">
                This month
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
              Remaining Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                {quotaUsage?.remainingCalls || 1000}
              </div>
              <div className="text-sm text-gray-600">
                Available this month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quota Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Month</h4>
                <p className="text-2xl font-bold">{quotaUsage?.month || new Date().toISOString().slice(0, 7)}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <p className="text-sm text-gray-600">
                  {quotaUsage?.lastUpdated ? formatDate(quotaUsage.lastUpdated) : 'Never'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Daily Average</h4>
                <p className="text-lg">
                  {quotaUsage ? Math.round(quotaUsage.totalApiCalls / new Date().getDate()) : 0} calls/day
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Estimated Monthly Usage</h4>
                <p className="text-lg">
                  {quotaUsage ? Math.round((quotaUsage.totalApiCalls / new Date().getDate()) * 30) : 0} calls
                </p>
              </div>
            </div>
          </div>

          {usageStatus.status === 'critical' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="font-medium">Quota Alert</h4>
              </div>
              <p className="text-red-600 mt-2">
                You've used {usagePercentage.toFixed(1)}% of your monthly API quota. 
                Consider upgrading your plan or reducing alert frequency to avoid service interruption.
              </p>
            </div>
          )}

          {usageStatus.status === 'warning' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                <h4 className="font-medium">Usage Warning</h4>
              </div>
              <p className="text-yellow-600 mt-2">
                You've used {usagePercentage.toFixed(1)}% of your monthly API quota. 
                Monitor your usage to avoid reaching the limit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

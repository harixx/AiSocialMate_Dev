
import { useState } from "react";
import { Plus, Bell, Play, Eye, Clock, Users, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AlertForm from "@/components/forms/alert-form";
import { useAlerts } from "../../hooks/use-alerts";
import AlertRunsDashboard from "./alert-runs-dashboard";
import QuotaMonitoringDashboard from "./quota-monitoring-dashboard";

export default function RescanAlerts() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const { alerts, deleteAlert } = useAlerts();

  const triggerAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/trigger`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // You might want to show a success message here
        console.log('Alert triggered successfully');
      }
    } catch (error) {
      console.error('Failed to trigger alert:', error);
    }
  };

  const formatNextRun = (nextRunTime: string | Date | null) => {
    if (!nextRunTime) return 'Not scheduled';
    
    const nextRun = new Date(nextRunTime);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Due now';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Within 1 hour';
  };

  const getCompetitorCount = (alert: any) => {
    if (!alert.competitors || !Array.isArray(alert.competitors)) return 0;
    return alert.competitors.length;
  };

  const getCompetitorNames = (alert: any) => {
    if (!alert.competitors || !Array.isArray(alert.competitors)) return [];
    return alert.competitors.map((c: any) => c.canonicalName || c.name).filter(Boolean);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Competitor Presence Alerts</h1>
        <p className="text-gray-600">
          Advanced competitor monitoring with deduplication, fuzzy matching, and automated presence detection across social platforms.
        </p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Alert Management</TabsTrigger>
          <TabsTrigger value="dashboard">Presence Dashboard</TabsTrigger>
          <TabsTrigger value="quota">Quota & Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Competitor Alert Management</h2>
                  <p className="text-gray-600">Monitor competitor mentions across social platforms with advanced detection</p>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Competitor Alert
                </Button>
              </div>
            </CardContent>
          </Card>

          {showCreateForm && (
            <AlertForm onClose={() => setShowCreateForm(false)} />
          )}

          {!alerts || !Array.isArray(alerts) || alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No competitor alerts configured</h3>
                <p className="text-gray-600 mb-6">
                  Set up your first competitor monitoring alert to automatically track competitor presence and opportunities
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Alert
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Array.isArray(alerts) && alerts.map((alert: any) => (
                <Card key={alert.id} className={`${alert.isActive ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-400'}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-medium text-gray-900">{alert.name}</h3>
                          <Badge variant={alert.isActive ? "default" : "secondary"}>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {getCompetitorCount(alert)} competitor{getCompetitorCount(alert) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span>
                              {Array.isArray(alert.platforms) ? alert.platforms.length : 0} platform{Array.isArray(alert.platforms) && alert.platforms.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {alert.frequency} • {formatNextRun(alert.nextRunTime)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {alert.dedupeWindow || 30} day dedupe window
                            </span>
                          </div>
                        </div>

                        {getCompetitorNames(alert).length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Monitoring:</p>
                            <div className="flex flex-wrap gap-2">
                              {getCompetitorNames(alert).map((name: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <p className="text-sm text-gray-500">
                            Platforms: {Array.isArray(alert.platforms) ? alert.platforms.join(', ') : alert.platforms}
                          </p>
                          {alert.enableFuzzyMatching && (
                            <p className="text-xs text-blue-600 mt-1">✓ Fuzzy matching enabled</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAlert(alert.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => triggerAlert(alert.id)}
                          disabled={!alert.isActive}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Run Now
                        </Button>
                        
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {selectedAlert ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Presence Dashboard - {alerts.find(a => a.id === selectedAlert)?.name}</CardTitle>
                    <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                      Back to Alerts
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AlertRunsDashboard alertId={selectedAlert} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Presence Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Alert to View Dashboard</h3>
                  <p className="text-gray-600">
                    Click "View" on any alert to see its presence history, run details, and analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quota" className="space-y-6">
          <QuotaMonitoringDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Plus, Bell, Play, Eye, Clock, Users, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AlertForm from "@/components/forms/alert-form";
import { useAlerts } from "../../hooks/use-alerts";
import AlertRunsDashboard from "./alert-runs-dashboard";
import QuotaMonitoringDashboard from "./quota-monitoring-dashboard";
import { useToast } from "@/hooks/use-toast";

export default function RescanAlerts() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [editingAlert, setEditingAlert] = useState<any | null>(null);
  const [runningAlerts, setRunningAlerts] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("alerts");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { alerts, deleteAlert } = useAlerts();
  const { toast } = useToast();

  // Update current time every minute for real-time "Next Run" display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const triggerAlert = async (alertId: number) => {
    try {
      setRunningAlerts(prev => new Set(Array.from(prev).concat(alertId)));

      const response = await fetch(`/api/alerts/${alertId}/trigger`, {
        method: 'POST'
      });

      // Helper function to safely parse JSON response
      const parseResponseSafely = async (response: Response) => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            return await response.json();
          } catch (e) {
            console.warn('Failed to parse JSON response:', e);
            return null;
          }
        } else {
          // Response is not JSON, get text for debugging
          const text = await response.text();
          console.warn('Received non-JSON response:', text.substring(0, 200));
          return null;
        }
      };

      if (response.ok) {
        const result = await parseResponseSafely(response);
        console.log('Alert triggered successfully:', result);
        toast({
          title: "Alert Triggered Successfully!",
          description: "The alert is now running. Check the Presence Dashboard for results.",
        });
      } else {
        const error = await parseResponseSafely(response);
        console.error('Alert trigger failed:', error);
        toast({
          title: "Failed to Trigger Alert",
          description: error?.message || `Server error (${response.status})`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to trigger alert:', error);
      toast({
        title: "Failed to Trigger Alert",
        description: error instanceof Error ? error.message : 'Network error occurred',
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setRunningAlerts(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(alertId);
          return newSet;
        });
      }, 30000); // 30 seconds to allow alert processing to complete
    }
  };

  const formatNextRun = (nextRunTime: string | Date | null) => {
    if (!nextRunTime) return 'Not scheduled';
    
    const nextRun = new Date(nextRunTime);
    const now = new Date();
    
    // Check if the date is valid
    if (isNaN(nextRun.getTime())) return 'Invalid date';
    
    const diffMs = nextRun.getTime() - now.getTime();
    
    // If overdue
    if (diffMs < 0) {
      const overdueMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
      if (overdueMins < 60) return `Overdue by ${overdueMins}m`;
      const overdueHours = Math.floor(overdueMins / 60);
      return `Overdue by ${overdueHours}h`;
    }
    
    // Calculate precise time remaining
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      const remainingHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `In ${diffDays}d ${remainingHours}h`;
    }
    
    if (diffHours > 0) {
      const remainingMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `In ${diffHours}h ${remainingMins}m`;
    }
    
    if (diffMinutes > 0) {
      return `In ${diffMinutes}m`;
    }
    
    return 'Due now';
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Modern Hero Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-8 border border-blue-200">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Competitor Intelligence Hub
          </h1>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            Monitor your competitors across social platforms with AI-powered detection, advanced deduplication, and real-time notifications.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Real-time monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>AI-powered detection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Smart deduplication</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-lg p-1 m-4">
            <TabsTrigger value="alerts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Bell className="h-4 w-4" />
              Alert Management
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" />
              Presence Dashboard
            </TabsTrigger>
            <TabsTrigger value="quota" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" />
              Quota & Usage
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="alerts" className="space-y-8">
          {/* Modern Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Management</h2>
                  <p className="text-gray-600">Create and manage competitor monitoring alerts with precision targeting</p>
                </div>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Alert
                </Button>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          {showCreateForm && (
            <AlertForm onClose={() => setShowCreateForm(false)} />
          )}

          {editingAlert && (
            <AlertForm 
              alert={editingAlert}
              onClose={() => setEditingAlert(null)} 
            />
          )}

          {/* Empty State */}
          {!alerts || !Array.isArray(alerts) || alerts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="py-16 text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <Bell className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Monitoring?</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  Create your first competitor alert to automatically track mentions and opportunities across social platforms with AI-powered precision.
                </p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Alert
                </Button>
              </div>
            </div>
          ) : (
            /* Alert Cards */
            <div className="grid gap-6">
              {Array.isArray(alerts) && alerts
                .filter((alert: any) => alert && alert.id && alert.name && typeof alert.id === 'number')
                .map((alert: any, index: number) => (
                <div key={`alert-${alert.id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{alert.name}</h3>
                          <Badge variant={alert.isActive ? "default" : "secondary"} className={alert.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${alert.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            {alert.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        {/* Modern Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{getCompetitorCount(alert)}</div>
                              <div className="text-sm text-gray-600">Competitor{getCompetitorCount(alert) !== 1 ? 's' : ''}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{Array.isArray(alert.platforms) ? alert.platforms.length : 0}</div>
                              <div className="text-sm text-gray-600">Platform{Array.isArray(alert.platforms) && alert.platforms.length !== 1 ? 's' : ''}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 capitalize">{alert.frequency || 'daily'}</div>
                              <div className="text-sm text-gray-600">Frequency</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Clock className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{formatNextRun(alert.nextRunTime)}</div>
                              <div className="text-sm text-gray-600">
                                {alert.nextRunTime ? (
                                  <>
                                    Next Run: {new Date(alert.nextRunTime).toLocaleString()}
                                  </>
                                ) : (
                                  'Next Run: Not scheduled'
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Competitor Names */}
                        {getCompetitorNames(alert).length > 0 && (
                          <div className="mb-4">
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
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 ml-6">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('🔍 View Dashboard clicked for alert:', alert.id);
                            setSelectedAlert(alert.id);
                            setActiveTab("dashboard");
                          }}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                          data-testid={`button-view-dashboard-${alert.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingAlert(alert)}
                          className="border-gray-300 hover:bg-gray-50"
                        >
                          Edit
                        </Button>

                        <Button 
                          variant={runningAlerts.has(alert.id) ? "secondary" : "default"}
                          size="sm" 
                          onClick={() => triggerAlert(alert.id)}
                          disabled={!alert.isActive || runningAlerts.has(alert.id)}
                          className={runningAlerts.has(alert.id) ? "" : "bg-green-600 hover:bg-green-700"}
                        >
                          {runningAlerts.has(alert.id) ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </>
                          )}
                        </Button>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('🗑️ Deleting alert with ID:', alert.id);
                            if (alert.id && typeof alert.id === 'number') {
                              deleteAlert(alert.id);
                            } else {
                              console.error('Invalid alert ID:', alert.id);
                            }
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-8">
          {selectedAlert ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {Array.isArray(alerts) ? alerts.find((a: any) => a.id === selectedAlert)?.name || `Alert #${selectedAlert}` : `Alert #${selectedAlert}`}
                    </h2>
                    <p className="text-gray-600 mt-1">Real-time monitoring dashboard and presence detection results</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedAlert(null);
                      setActiveTab("alerts");
                    }}
                    className="bg-gray-50 border-gray-300 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Alerts
                  </Button>
                </div>
              </div>
              <AlertRunsDashboard alertId={selectedAlert} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="py-16 text-center">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <TrendingUp className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Select Alert to View Dashboard</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Choose an alert from the management tab to view detailed analytics, processing history, and detected competitor mentions.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Quota Tab */}
        <TabsContent value="quota" className="space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Usage & Quota Monitoring</h2>
            <p className="text-gray-600 mb-6">Track your API usage, monitor quotas, and optimize resource consumption</p>
            <QuotaMonitoringDashboard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
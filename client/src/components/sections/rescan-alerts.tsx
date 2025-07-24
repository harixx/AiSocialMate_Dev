import { useState } from "react";
import { Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AlertForm from "@/components/forms/alert-form";
import { useAlerts } from "../../hooks/use-alerts";

export default function RescanAlerts() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { alerts, deleteAlert } = useAlerts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rescan Alerts</h1>
        <p className="text-gray-600">Set up automated monitoring alerts to track mentions and opportunities across social platforms.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Alert Management</h2>
              <p className="text-gray-600">Set up automated monitoring alerts for brand opportunities</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">No alerts configured</h3>
            <p className="text-gray-600 mb-6">
              Set up your first monitoring alert to automatically discover brand opportunities
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
            <Card key={alert.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{alert.name}</h3>
                    <p className="text-gray-600">Keywords: {alert.keywords}</p>
                    <p className="text-sm text-gray-500">
                      Platforms: {Array.isArray(alert.platforms) ? alert.platforms.join(', ') : alert.platforms}
                    </p>
                    <p className="text-sm text-gray-500">Frequency: {alert.frequency}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      alert.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
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
    </div>
  );
}

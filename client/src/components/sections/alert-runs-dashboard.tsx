
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, ExternalLink } from "lucide-react";

interface AlertRun {
  id: number;
  alertId: number;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'completed' | 'failed';
  apiCallsUsed: number;
  newPresencesFound: number;
  errorMessage: string | null;
}

interface PresenceRecord {
  id: number;
  competitorName: string;
  platform: string;
  title: string;
  url: string;
  snippet: string;
  detectionMethod: string;
  createdAt: string;
}

export default function AlertRunsDashboard({ alertId }: { alertId: number }) {
  const [runs, setRuns] = useState<AlertRun[]>([]);
  const [presences, setPresences] = useState<PresenceRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertRuns();
  }, [alertId]);

  useEffect(() => {
    if (selectedRunId) {
      fetchPresenceRecords();
    }
  }, [selectedRunId]);

  const fetchAlertRuns = async () => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/runs`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data);
        if (data.length > 0) {
          setSelectedRunId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch alert runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresenceRecords = async () => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/presences`);
      if (response.ok) {
        const data = await response.json();
        setPresences(data);
      }
    } catch (error) {
      console.error('Failed to fetch presence records:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'Running...';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  };

  const getDetectionMethodBadge = (method: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      exact: 'default',
      alias: 'secondary',
      domain: 'outline',
      fuzzy: 'destructive'
    };
    return <Badge variant={variants[method] || 'outline'}>{method}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Clock className="h-6 w-6 animate-spin text-gray-400 mr-2" />
            <span>Loading alert history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No alert runs yet. The alert will run based on its configured frequency.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>API Calls</TableHead>
                  <TableHead>New Presences</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className={selectedRunId === run.id ? 'bg-muted' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <span className="capitalize">{run.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(run.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {formatDuration(run.startTime, run.endTime)}
                    </TableCell>
                    <TableCell>{run.apiCallsUsed}</TableCell>
                    <TableCell>
                      <Badge variant={run.newPresencesFound > 0 ? 'default' : 'secondary'}>
                        {run.newPresencesFound}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRunId(run.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedRunId && presences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Presences</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Detection</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presences.map((presence) => (
                  <TableRow key={presence.id}>
                    <TableCell className="font-medium">
                      {presence.competitorName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{presence.platform}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      <div>
                        <div className="font-medium truncate">{presence.title}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {presence.snippet}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDetectionMethodBadge(presence.detectionMethod)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(presence.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

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
  const [alertRuns, setAlertRuns] = useState<AlertRun[]>([]);
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);

        console.log(`🚀 Starting optimized fetch for alertId: ${alertId}, runId: ${selectedRunId}`);
        const startTime = Date.now();

        // Fetch alert runs first (they're usually fewer)
        const runsResponse = await fetch(`/api/alerts/${alertId}/runs`);
        if (!runsResponse.ok) {
          throw new Error(`Failed to fetch runs: ${runsResponse.status}`);
        }
        const runs = await runsResponse.json();
        
        if (!isMounted) return;
        
        console.log(`📊 Alert runs fetched: ${runs.length} in ${Date.now() - startTime}ms`);
        setAlertRuns(runs);

        // Only fetch presence records if we have runs or a specific runId
        if (runs.length > 0 || selectedRunId !== null) {
          const presenceUrl = `/api/alerts/${alertId}/presences${selectedRunId !== null ? `?runId=${selectedRunId}` : ''}`;
          console.log(`📡 Fetching presence records from: ${presenceUrl}`);
          
          const presenceResponse = await fetch(presenceUrl);
          if (!presenceResponse.ok) {
            throw new Error(`Failed to fetch presences: ${presenceResponse.status}`);
          }
          const presences = await presenceResponse.json();
          
          if (!isMounted) return;
          
          console.log(`📝 Presence records fetched: ${presences.length} in ${Date.now() - startTime}ms total`);
          setPresenceRecords(presences);
        } else {
          console.log('📭 No runs found, skipping presence records fetch');
          setPresenceRecords([]);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error('❌ Failed to fetch alert dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to batch rapid successive calls
    const timeoutId = setTimeout(fetchData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [alertId, selectedRunId]);

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
    return <div className="text-center py-8">Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {alertRuns.length === 0 ? (
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
                {alertRuns.map((run) => (
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

      {selectedRunId !== null && presenceRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Presences for Run {selectedRunId}</CardTitle>
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
                {presenceRecords.map((presence) => (
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

      {selectedRunId !== null && presenceRecords.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No presence records found for run ID: {selectedRunId}.
        </div>
      )}
    </div>
  );
}
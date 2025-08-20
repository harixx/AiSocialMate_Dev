
import { storage } from "./storage";
import { config } from "./config";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    serperApi: 'up' | 'down';
    scheduler: 'up' | 'down';
  };
  metrics: {
    totalAlerts: number;
    activeAlerts: number;
    lastRunTime: string | null;
    quotaUsage: {
      currentMonth: string;
      totalCalls: number;
      remainingCalls: number;
    };
  };
}

export class HealthChecker {
  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    try {
      // Test database connectivity
      const alerts = await storage.getAlerts();
      const activeAlerts = alerts.filter(a => a.isActive);
      
      // Test Serper API connectivity
      let serperStatus: 'up' | 'down' = 'down';
      try {
        const testResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': config.serper.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: 'test',
            num: 1,
          }),
        });
        serperStatus = testResponse.ok ? 'up' : 'down';
      } catch (error) {
        console.error('Serper API health check failed:', error);
      }
      
      // Get quota usage
      const quotaUsage = await storage.getQuotaUsage(currentMonth);
      
      // Find last successful run
      const allRuns = await storage.getAlertRuns();
      const lastSuccessfulRun = allRuns
        .filter(run => run.status === 'completed')
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
      
      const services = {
        database: 'up' as const,
        serperApi: serperStatus,
        scheduler: 'up' as const, // Assume scheduler is up if we can run this check
      };
      
      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (services.serperApi === 'down') {
        status = 'unhealthy';
      } else if (quotaUsage && quotaUsage.remainingCalls < 100) {
        status = 'degraded';
      }
      
      return {
        status,
        timestamp,
        version: '1.0.0',
        services,
        metrics: {
          totalAlerts: alerts.length,
          activeAlerts: activeAlerts.length,
          lastRunTime: lastSuccessfulRun?.startTime || null,
          quotaUsage: {
            currentMonth,
            totalCalls: quotaUsage?.totalApiCalls || 0,
            remainingCalls: quotaUsage?.remainingCalls || 1000,
          },
        },
      };
      
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp,
        version: '1.0.0',
        services: {
          database: 'down',
          serperApi: 'down',
          scheduler: 'down',
        },
        metrics: {
          totalAlerts: 0,
          activeAlerts: 0,
          lastRunTime: null,
          quotaUsage: {
            currentMonth,
            totalCalls: 0,
            remainingCalls: 0,
          },
        },
      };
    }
  }
}

export const healthChecker = new HealthChecker();

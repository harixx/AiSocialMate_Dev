import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { config, logConfigStatus } from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", async () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // Import log function only when needed
      const { log } = process.env.NODE_ENV === "development" 
        ? await import("./vite")
        : await import("./production");
      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server error:', err);
    });

  // Environment-specific server setup with proper dependency isolation
  if (process.env.NODE_ENV === "development") {
    // Dynamic import ensures development dependencies are never bundled
    const { setupDevelopmentServer } = await import("./development");
    await setupDevelopmentServer(app, server);
  } else {
    // Production-only imports - no development dependencies
    const { serveStatic, log } = await import("./production");
    serveStatic(app);
  }

  // Server configuration from validated environment
  server.listen(config.port, config.host, async () => {
    const { log } = process.env.NODE_ENV === "development" 
      ? await import("./vite")
      : await import("./production");
    
    log(`🚀 SocialMonitor AI serving on ${config.host}:${config.port}`);
    
    // Log configuration status in development
    if (config.nodeEnv === 'development') {
      await logConfigStatus();
    }
  });
  
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

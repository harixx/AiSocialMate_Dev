/**
 * Development-only server utilities
 * This file should NEVER be imported in production builds
 */
import type { Express } from "express";
import type { Server } from "http";

export async function setupDevelopmentServer(app: Express, server: Server) {
  // Dynamic import ensures vite is only loaded in development
  const { setupVite } = await import("./vite");
  await setupVite(app, server);
}
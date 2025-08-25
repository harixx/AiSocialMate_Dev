import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, Key, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface RedditAuthProps {
  onAuthChange?: (authenticated: boolean) => void;
}

export default function RedditAuth({ onAuthChange }: RedditAuthProps) {
  const [runtimeCredentials, setRuntimeCredentials] = useState({
    clientId: '',
    clientSecret: '',
    username: '',
    password: ''
  });
  const [isRuntimeAuth, setIsRuntimeAuth] = useState(false);
  const { toast } = useToast();

  // Check for existing persistent credentials on mount and update state
  useEffect(() => {
    const storedAuth = localStorage.getItem('reddit_persistent_auth'); // Using localStorage for persistence
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      // Optionally, you could check the timestamp here to expire old credentials
      setRuntimeCredentials({
        clientId: parsedAuth.clientId || '',
        clientSecret: parsedAuth.clientSecret || '',
        username: parsedAuth.username || '',
        password: parsedAuth.password || ''
      });
      setIsRuntimeAuth(true);
      if (onAuthChange) {
        onAuthChange(true);
      }
    }
  }, [onAuthChange]);


  const handleRuntimeAuth = () => {
    // Store runtime credentials in session for current browsing session
    if (!runtimeCredentials.clientId || !runtimeCredentials.clientSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both Client ID and Client Secret",
        variant: "destructive"
      });
      return;
    }

    // Store in localStorage for persistent use across browser refreshes
    localStorage.setItem('reddit_persistent_auth', JSON.stringify({
      clientId: runtimeCredentials.clientId,
      clientSecret: runtimeCredentials.clientSecret,
      username: runtimeCredentials.username,
      password: runtimeCredentials.password,
      timestamp: Date.now()
    }));

    setIsRuntimeAuth(true);

    toast({
      title: "Persistent Authentication Set",
      description: "Your Reddit API credentials are now active and will persist across browser refreshes.",
      variant: "default"
    });
    if (onAuthChange) {
      onAuthChange(true);
    }
  };

  const clearRuntimeAuth = () => {
    localStorage.removeItem('reddit_persistent_auth'); // Clear from persistent storage
    setIsRuntimeAuth(false);
    setRuntimeCredentials({
      clientId: '',
      clientSecret: '',
      username: '',
      password: ''
    });

    toast({
      title: "Persistent Authentication Cleared",
      description: "Your Reddit API credentials have been removed.",
      variant: "default"
    });
    if (onAuthChange) {
      onAuthChange(false);
    }
  };

  // Check if runtime auth is already set
  const hasRuntimeAuth = localStorage.getItem('reddit_persistent_auth') !== null || isRuntimeAuth;

  // Notify parent component of auth changes
  // This is now handled within useEffect and handleRuntimeAuth/clearRuntimeAuth to ensure it's called on initial load and after changes.

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Reddit API Authentication</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {hasRuntimeAuth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Persistent Auth Active</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Persistent
                    </Badge>
                  </div>
                  <Button variant="outline" onClick={clearRuntimeAuth}>
                    Clear Credentials
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>✅ Your Reddit API credentials are active and saved.</p>
                  <p className="text-xs mt-1">
                    <strong>Note:</strong> Credentials are stored persistently in your browser's local storage.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="clientId">Reddit App Client ID *</Label>
                    <Input
                      id="clientId"
                      type="text"
                      placeholder="14-character client ID"
                      value={runtimeCredentials.clientId}
                      onChange={(e) => setRuntimeCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientSecret">Reddit App Client Secret *</Label>
                    <Input
                      id="clientSecret"
                      type="password"
                      placeholder="Client secret from Reddit app"
                      value={runtimeCredentials.clientSecret}
                      onChange={(e) => setRuntimeCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Reddit Username (Optional)</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Your Reddit username"
                      value={runtimeCredentials.username}
                      onChange={(e) => setRuntimeCredentials(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Reddit Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your Reddit password"
                      value={runtimeCredentials.password}
                      onChange={(e) => setRuntimeCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <Button onClick={handleRuntimeAuth} className="w-full flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Set Persistent Authentication</span>
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>How to get Reddit API credentials:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">reddit.com/prefs/apps</a></li>
                    <li>Click "Create App" or "Create Another App"</li>
                    <li>Choose "script" as the app type</li>
                    <li>Set redirect URI to: <code className="bg-gray-100 px-1 rounded">http://localhost:8080</code></li>
                    <li>Copy the Client ID and Client Secret</li>
                  </ol>
                  <p className="mt-2"><strong>Security:</strong> Credentials are stored persistently in your browser's local storage and never sent to our servers permanently.</p>
                  <p className="mt-1 text-green-600"><strong>✅ No Environment Variables Required:</strong> This app doesn't need Reddit credentials in server environment variables - everything is handled through this UI.</p>
                </div>
              </div>
            )}
          </div>

        <div className="text-sm text-gray-500 mt-4">
          <p className="font-medium mb-1">What this enables:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Full comment threads with nested replies</li>
            <li>Real-time comment scores and voting data</li>
            <li>Complete post metadata and statistics</li>
            <li>Access to all public Reddit content</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
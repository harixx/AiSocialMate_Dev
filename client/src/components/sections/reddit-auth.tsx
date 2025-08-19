import { useState } from "react";

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

    // Store in sessionStorage for runtime use
    sessionStorage.setItem('reddit_runtime_auth', JSON.stringify({
      clientId: runtimeCredentials.clientId,
      clientSecret: runtimeCredentials.clientSecret,
      username: runtimeCredentials.username,
      password: runtimeCredentials.password,
      timestamp: Date.now()
    }));

    setIsRuntimeAuth(true);

    toast({
      title: "Runtime Authentication Set",
      description: "Your Reddit API credentials are now active for this session",
      variant: "default"
    });
  };

  const clearRuntimeAuth = () => {
    sessionStorage.removeItem('reddit_runtime_auth');
    setIsRuntimeAuth(false);
    setRuntimeCredentials({
      clientId: '',
      clientSecret: '',
      username: '',
      password: ''
    });

    toast({
      title: "Runtime Authentication Cleared",
      description: "Your credentials have been removed from this session",
      variant: "default"
    });
  };

  // Check if runtime auth is already set
  const hasRuntimeAuth = sessionStorage.getItem('reddit_runtime_auth') !== null || isRuntimeAuth;

  // Notify parent component of auth changes
  if (onAuthChange) {
    onAuthChange(hasRuntimeAuth);
  }

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
                    <span className="font-medium">Runtime Auth Active</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Session-Based
                    </Badge>
                  </div>
                  <Button variant="outline" onClick={clearRuntimeAuth}>
                    Clear Credentials
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p>✅ Your Reddit API credentials are active for this browsing session.</p>
                  <p className="text-xs mt-1">
                    <strong>Note:</strong> Credentials are stored only in your browser session and will be cleared when you close the browser.
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
                  <span>Set Runtime Authentication</span>
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
                  <p className="mt-2"><strong>Security:</strong> Credentials are stored only in your browser session and never sent to our servers permanently.</p>
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
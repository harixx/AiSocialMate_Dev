import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { ExternalLink, Shield, CheckCircle, AlertCircle, Settings } from "lucide-react";

interface RedditAuthProps {
  onAuthChange?: (authenticated: boolean) => void;
}

export default function RedditAuth({ onAuthChange }: RedditAuthProps) {
  const queryClient = useQueryClient();
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  
  // Check authentication status
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['/api/reddit/auth-status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Configure Reddit OAuth credentials
  const configureCredentials = useMutation({
    mutationFn: async (creds: typeof credentials) => {
      const response = await fetch('/api/reddit/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      if (!response.ok) throw new Error('Failed to configure credentials');
      return response.json();
    },
    onSuccess: () => {
      setCredentialsConfigured(true);
      setShowCredentials(false);
      queryClient.invalidateQueries({ queryKey: ['/api/reddit/auth-status'] });
    },
  });

  // Initiate Reddit authentication
  const initiateAuth = useMutation({
    mutationFn: async () => {
      const response = await fetch('/auth/reddit');
      if (!response.ok) throw new Error('Failed to initiate authentication');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Open Reddit OAuth in new window
        window.open(data.authUrl, 'reddit-auth', 'width=500,height=600');
        
        // Listen for authentication completion
        const checkAuth = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/reddit/auth-status'] });
        }, 2000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(checkAuth), 300000);
      }
    },
  });

  const isAuthenticated = authStatus?.authenticated;

  // Notify parent component of auth changes
  if (onAuthChange && !isLoading) {
    onAuthChange(isAuthenticated || false);
  }

  const handleCredentialsSubmit = () => {
    if (credentials.clientId && credentials.clientSecret && credentials.redirectUri) {
      configureCredentials.mutate(credentials);
    }
  };

  return (
    <>
      {/* Reddit OAuth Credentials Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Reddit OAuth Configuration</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              {showCredentials ? 'Hide' : 'Configure'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCredentials && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 font-medium text-sm mb-2">📋 Setup Instructions:</p>
                <ol className="text-blue-700 text-xs list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" className="underline">Reddit Apps</a></li>
                  <li>Create a "web app" with redirect URI: <code className="bg-blue-100 px-1 rounded">https://your-domain.com/auth/reddit/callback</code></li>
                  <li>Copy your Client ID (14 chars) and Secret</li>
                  <li>Enter them below and click "Save Configuration"</li>
                </ol>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="clientId">Reddit Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="14-character client ID"
                    value={credentials.clientId}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientSecret">Reddit Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Client secret key"
                    value={credentials.clientSecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="redirectUri">Redirect URI</Label>
                  <Input
                    id="redirectUri"
                    placeholder="https://your-domain.com/auth/reddit/callback"
                    value={credentials.redirectUri}
                    onChange={(e) => setCredentials(prev => ({ ...prev, redirectUri: e.target.value }))}
                  />
                </div>

                <Button
                  onClick={handleCredentialsSubmit}
                  disabled={configureCredentials.isPending || !credentials.clientId || !credentials.clientSecret || !credentials.redirectUri}
                  className="w-full"
                >
                  {configureCredentials.isPending ? 'Saving...' : 'Save Configuration'}
                </Button>

                {configureCredentials.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      Failed to save credentials. Please check your inputs and try again.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {credentialsConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium text-sm">✅ Reddit OAuth credentials configured successfully!</p>
              <p className="text-green-700 text-xs mt-1">You can now proceed with Reddit authentication.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reddit API Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Reddit API Authentication</span>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            {isLoading ? (
              <Badge variant="outline">Checking...</Badge>
            ) : isAuthenticated ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Authenticated
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Not Authenticated
              </Badge>
            )}
          </div>
          
          {!isAuthenticated && (
            <Button
              onClick={() => initiateAuth.mutate()}
              disabled={initiateAuth.isPending || (!credentialsConfigured && !authStatus?.credentialsConfigured)}
              size="sm"
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Authenticate Reddit</span>
            </Button>
          )}
          
          {!isAuthenticated && !credentialsConfigured && !authStatus?.credentialsConfigured && (
            <p className="text-xs text-gray-500">
              Configure your Reddit OAuth credentials first
            </p>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          {isAuthenticated ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">✅ Reddit API Access Enabled</p>
              <p className="text-green-700 text-xs mt-1">
                You can now fetch full Reddit comments with real-time data, including comment scores, 
                nested replies, and complete threading information.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 font-medium">🔐 Authentication Required</p>
              <p className="text-blue-700 text-xs mt-1">
                Reddit requires OAuth authentication for full API access. Click "Authenticate Reddit" 
                to login and enable complete comment fetching with threading and real-time scores.
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">What this enables:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Full comment threads with nested replies</li>
            <li>Real-time comment scores and voting data</li>
            <li>Complete post metadata and statistics</li>
            <li>Access to all public Reddit content</li>
          </ul>
        </div>

        {initiateAuth.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              Authentication failed. Please try again or contact support if the issue persists.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
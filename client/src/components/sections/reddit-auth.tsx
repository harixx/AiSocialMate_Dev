import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, AlertCircle, ExternalLink, Key, Settings } from "lucide-react";
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
  const queryClient = useQueryClient();

  // Check authentication status
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['/api/reddit/auth-status'],
    refetchInterval: 5000, // Check every 5 seconds when component is active
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    queryFn: async () => {
      const response = await fetch('/api/reddit/auth-status');
      if (!response.ok) throw new Error('Failed to fetch auth status');
      return response.json();
    },
  });

  // Initiate Reddit OAuth authentication
  const initiateAuth = useMutation({
    mutationFn: async () => {
      const response = await fetch('/auth/reddit');
      if (!response.ok) throw new Error('Failed to initiate authentication');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Open Reddit OAuth in new window
        const authWindow = window.open(data.authUrl, 'reddit-auth', 'width=500,height=600');

        // Listen for when the auth window closes (user completes or cancels auth)
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            // Immediately check auth status when window closes
            queryClient.invalidateQueries({ queryKey: ['/api/reddit/auth-status'] });
          }
        }, 1000); // Check if window closed every second

        // Also check auth status periodically while window is open
        const checkAuth = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/reddit/auth-status'] });
        }, 3000); // Check every 3 seconds

        // Stop checking after 3 minutes to reduce load
        setTimeout(() => {
          clearInterval(checkAuth);
          clearInterval(checkClosed);
        }, 180000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    }
  });

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

  const isAuthenticated = (authStatus as any)?.authenticated as boolean;

  // Notify parent component of auth changes
  if (onAuthChange && !isLoading) {
    onAuthChange(isAuthenticated || hasRuntimeAuth || false);
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
        <Tabs defaultValue="oauth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="oauth" className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>OAuth Login</span>
            </TabsTrigger>
            <TabsTrigger value="runtime" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Runtime Auth</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="oauth" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <Badge variant="outline">Checking...</Badge>
                ) : isAuthenticated ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">OAuth Authenticated</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Not Authenticated</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Limited Access
                    </Badge>
                  </>
                )}
              </div>

              {!isAuthenticated && !initiateAuth.isPending && (
                <Button onClick={() => initiateAuth.mutate()} className="flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Authenticate Reddit</span>
                </Button>
              )}
              {initiateAuth.isPending && (
                <Button disabled size="sm">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              {isAuthenticated ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-green-800 dark:text-green-200 font-medium">✅ Reddit API Access Enabled via OAuth</p>
                  <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                    You can now fetch full Reddit comments with real-time data, including comment scores,
                    nested replies, and complete threading information.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">🔐 OAuth Authentication Required</p>
                  <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                    Reddit requires OAuth authentication for full API access. Click "Authenticate Reddit"
                    to login and enable complete comment fetching with threading and real-time scores.
                  </p>
                </div>
              )}
            </div>
            {initiateAuth.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  Authentication failed. Please try again or contact support if the issue persists.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="runtime" className="space-y-4">
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
          </TabsContent>
        </Tabs>

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
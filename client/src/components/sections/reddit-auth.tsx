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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load Reddit credentials from server on mount
  useEffect(() => {
    loadRedditCredentials();
  }, [onAuthChange]);

  const loadRedditCredentials = async () => {
    try {
      const response = await fetch('/api/settings/reddit-credentials');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credentials) {
          const { clientId, clientSecret, username, password } = data.credentials;
          setRuntimeCredentials({
            clientId: clientId || '',
            clientSecret: clientSecret || '',
            username: username || '',
            password: password || ''
          });
          setIsRuntimeAuth(!!(clientId && clientSecret));
          if (onAuthChange) {
            onAuthChange(!!(clientId && clientSecret));
          }
        }
      }
    } catch (error) {
      console.log('Failed to load Reddit credentials:', error);
    }
  };

  const loadSavedCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/reddit-credentials');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credentials && (data.credentials.clientId || data.credentials.clientSecret || data.credentials.username || data.credentials.password)) {
          const { clientId, clientSecret, username, password } = data.credentials;
          
          // Load the actual saved values (not masked)
          const actualResponse = await fetch('/api/settings/reddit-credentials-raw');
          if (actualResponse.ok) {
            const actualData = await actualResponse.json();
            if (actualData.success && actualData.credentials) {
              setRuntimeCredentials({
                clientId: actualData.credentials.clientId || '',
                clientSecret: actualData.credentials.clientSecret || '',
                username: actualData.credentials.username || '',
                password: actualData.credentials.password || ''
              });
              
              toast({
                title: "Credentials Loaded",
                description: "Saved Reddit credentials have been loaded into the form fields.",
                variant: "default"
              });
            }
          } else {
            // Fallback to loading what we can (clientId and username)
            setRuntimeCredentials(prev => ({
              ...prev,
              clientId: clientId || '',
              username: username || ''
            }));
            
            toast({
              title: "Partial Load",
              description: "Client ID and username loaded. You'll need to re-enter the client secret and password.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "No Values Saved",
            description: "No values have been saved on the server.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "No Values Saved",
          description: "No values have been saved on the server.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load saved credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleRuntimeAuth = async () => {
    if (!runtimeCredentials.clientId || !runtimeCredentials.clientSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please provide both Client ID and Client Secret",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/settings/reddit-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: runtimeCredentials.clientId,
          clientSecret: runtimeCredentials.clientSecret,
          username: runtimeCredentials.username || undefined,
          password: runtimeCredentials.password || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsRuntimeAuth(true);
        toast({
          title: "Persistent Authentication Set",
          description: "Your Reddit API credentials are now saved and will persist across app restarts.",
          variant: "default"
        });
        if (onAuthChange) {
          onAuthChange(true);
        }
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save Reddit credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearRuntimeAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/reddit-credentials', {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsRuntimeAuth(false);
        setRuntimeCredentials({
          clientId: '',
          clientSecret: '',
          username: '',
          password: ''
        });
        toast({
          title: "Persistent Authentication Cleared",
          description: "Your Reddit API credentials have been removed from server storage.",
          variant: "default"
        });
        if (onAuthChange) {
          onAuthChange(false);
        }
      } else {
        throw new Error('Failed to clear credentials');
      }
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear Reddit credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllCredentials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings/reddit-credentials', {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsRuntimeAuth(false);
        // Clear both server and frontend form values
        setRuntimeCredentials({
          clientId: '',
          clientSecret: '',
          username: '',
          password: ''
        });
        toast({
          title: "Settings Cleared", 
          description: "All Reddit credentials have been cleared from both server and frontend.",
          variant: "default"
        });
        if (onAuthChange) {
          onAuthChange(false);
        }
      } else {
        throw new Error('Failed to clear credentials');
      }
    } catch (error) {
      // Still clear frontend form as fallback
      setIsRuntimeAuth(false);
      setRuntimeCredentials({
        clientId: '',
        clientSecret: '',
        username: '',
        password: ''
      });
      toast({
        title: "Warning",
        description: "Reddit credentials cleared locally, but server update failed.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasRuntimeAuth = isRuntimeAuth;

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
                  <Button 
                    variant="outline" 
                    onClick={clearRuntimeAuth}
                    disabled={loading}
                  >
                    {loading ? 'Clearing...' : 'Clear Credentials'}
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

                <div className="flex gap-2">
                  <Button 
                    onClick={handleRuntimeAuth} 
                    disabled={loading}
                    className="flex-1 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                  </Button>
                  <Button 
                    onClick={loadSavedCredentials} 
                    disabled={loading}
                    variant="outline"
                  >
                    Load Saved
                  </Button>
                  <Button 
                    onClick={clearAllCredentials} 
                    disabled={loading}
                    variant="destructive"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>How to get Reddit API credentials:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">reddit.com/prefs/apps</a></li>
                    <li>Click "Create App" or "Create Another App"</li>
                    <li>Choose "script" as the app type</li>
                    <li>Set redirect URI to: <code className="bg-gray-100 px-1 rounded">http://localhost:8080</code></li>
                    <li>Copy the Client ID and Client Secret</li>
                  </ol>
                  <p className="mt-2"><strong>Security:</strong> Credentials are encrypted and stored securely in the server's persistent database using Replit's secure storage.</p>
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
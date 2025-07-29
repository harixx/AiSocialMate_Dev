
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface RedditAuthProps {
  onAuthChange?: (authenticated: boolean) => void;
}

export default function RedditAuth({ onAuthChange }: RedditAuthProps) {
  const queryClient = useQueryClient();
  
  // Check authentication status
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ['/api/reddit/auth-status'],
    refetchInterval: 5000, // Check every 5 seconds when component is active
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
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
  });

  const isAuthenticated = (authStatus as any)?.authenticated as boolean;

  // Notify parent component of auth changes
  if (onAuthChange && !isLoading) {
    onAuthChange(isAuthenticated || false);
  }

  return (
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
              disabled={initiateAuth.isPending}
              size="sm"
              className="flex items-center space-x-1"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Authenticate Reddit</span>
            </Button>
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
  );
}
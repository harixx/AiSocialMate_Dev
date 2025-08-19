import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, MessageCircle, User, Clock } from "lucide-react";
import { useState } from "react";

interface Comment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  depth: number;
  replies: Comment[];
}

interface RedditCommentsProps {
  url: string;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentThread({ comment, maxDepth = 5 }: { comment: Comment; maxDepth?: number }) {
  const [showReplies, setShowReplies] = useState(true);

  const getIndentColor = (depth: number) => {
    const colors = [
      'border-blue-300',
      'border-green-300',
      'border-yellow-300',
      'border-purple-300',
      'border-pink-300'
    ];
    return colors[depth % colors.length];
  };

  return (
    <div className={`${comment.depth > 0 ? `ml-3 border-l-2 ${getIndentColor(comment.depth)} pl-3` : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <User className="h-3 w-3" />
            <span className="font-medium text-gray-900 dark:text-gray-100">{comment.author}</span>
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(comment.created_utc)}</span>
            <div className="flex items-center space-x-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="font-medium">{comment.score}</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {comment.body}
        </div>

        {comment.replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-3 p-1 rounded transition-colors"
          >
            <MessageCircle className="h-3 w-3" />
            <span>
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          </button>
        )}
      </div>

      {showReplies && comment.depth < maxDepth && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} maxDepth={maxDepth} />
          ))}
        </div>
      )}

      {comment.depth >= maxDepth && comment.replies.length > 0 && (
        <div className="ml-4 text-xs text-gray-500 italic">
          + {comment.replies.length} more replies (view on Reddit)
        </div>
      )}
    </div>
  );
}

export default function RedditComments({ url }: RedditCommentsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/reddit/comments', url],
    queryFn: async () => {
      const fetchComments = async () => {
        if (!url) return;

        // Check for runtime authentication credentials
        const runtimeAuth = sessionStorage.getItem('reddit_runtime_auth');
        let runtimeParams = '';

        if (runtimeAuth) {
          try {
            const authData = JSON.parse(runtimeAuth);
            const params = new URLSearchParams({
              runtimeClientId: authData.clientId,
              runtimeClientSecret: authData.clientSecret,
            });

            if (authData.username) params.append('runtimeUsername', authData.username);
            if (authData.password) params.append('runtimePassword', authData.password);

            runtimeParams = '&' + params.toString();
          } catch (parseError) {
            console.error('Failed to parse runtime auth:', parseError);
          }
        }

        const response = await fetch(`/api/reddit/comments?url=${encodeURIComponent(url)}${runtimeParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        return response.json();
      };
      return fetchComments();
    },
    enabled: !!url
  });

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-3">
                  <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="text-red-600 text-sm">
            Failed to load comments. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.success || !data.comments?.length) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="text-gray-500 text-sm">
            No comments found for this thread.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show special styling for blocked content
  const isBlocked = data.blocked;
  const isAuthenticated = data.authenticated;
  const upgradeAvailable = data.upgrade_available;

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Comments ({data.total_comments})
          </h4>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <Badge variant="default" className="bg-green-500 text-xs">
                OAuth API
              </Badge>
            )}
            {upgradeAvailable && (
              <Badge variant="secondary" className="text-xs">
                Upgrade Available
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="destructive" className="text-xs">
                Access Limited
              </Badge>
            )}
            <Badge variant="outline">Reddit</Badge>
          </div>
        </div>

        {data.comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments available for this thread</p>
            <p className="text-xs mt-1">Try authenticating with Reddit for full access</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.comments.map((comment: Comment) => (
              <CommentThread key={comment.id} comment={comment} maxDepth={5} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
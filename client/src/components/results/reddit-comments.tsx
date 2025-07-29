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

function CommentThread({ comment, maxDepth = 3 }: { comment: Comment; maxDepth?: number }) {
  const [showReplies, setShowReplies] = useState(true);
  
  return (
    <div className={`${comment.depth > 0 ? 'ml-4 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-3 w-3" />
            <span className="font-medium">{comment.author}</span>
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(comment.created_utc)}</span>
            <div className="flex items-center space-x-1">
              <ArrowUp className="h-3 w-3" />
              <span>{comment.score}</span>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-800 whitespace-pre-wrap">
          {comment.body}
        </div>
        
        {comment.replies.length > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
          >
            <MessageCircle className="h-3 w-3" />
            <span>
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
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
      const response = await fetch(`/api/reddit/comments?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return response.json();
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

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">
            Comments ({data.total_comments})
          </h4>
          <Badge variant="outline">Reddit</Badge>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.comments.map((comment: Comment) => (
            <CommentThread key={comment.id} comment={comment} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
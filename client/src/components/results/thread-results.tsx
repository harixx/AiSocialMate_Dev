import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, ArrowUp, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RedditComments from "./reddit-comments";
import { useReplyGenerator } from "@/hooks/use-reply-generator";
import { useToast } from "@/hooks/use-toast";

interface ThreadResultsProps {
  results: any[];
  totalResults: number;
  query: string;
}

export default function ThreadResults({ results, totalResults, query }: ThreadResultsProps) {
  const [, setLocation] = useLocation();
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
  const { generateReply, isLoading } = useReplyGenerator();
  const { toast } = useToast();

  const handleGenerateReply = async (url: string, title: string) => {
    try {
      await generateReply({
        threadUrl: url,
        replyType: 'supportive',
        tone: 'professional',
        brandName: 'Your Brand',
        brandContext: `Responding to: ${title}`,
        creativity: 0.7
      });

      toast({
        title: "Reply Generated",
        description: "Your AI reply has been generated! Check the AI Reply Generator tab to view it.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate reply. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedThreads(newExpanded);
  };

  const isRedditUrl = (url: string) => {
    return url.includes('reddit.com');
  };

  const isRedditPostWithComments = (url: string) => {
    // Only show comments button for actual Reddit posts (not subreddit pages)
    return url.includes('reddit.com') && url.includes('/comments/');
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Discovered Threads</CardTitle>
          <p className="text-sm text-gray-600">
            Found {totalResults} threads for "{query}"
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((thread, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1 pr-4">
                    {thread.title}
                  </h4>
                  <Badge variant="secondary">
                    {thread.platform}
                  </Badge>
                </div>

                {thread.snippet && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {thread.snippet}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center flex-wrap gap-4">
                    {thread.author && <span>by {thread.author}</span>}
                    {thread.real_stats && thread.comments !== undefined && (
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{thread.comments}</span>
                        <span className="text-xs text-green-600 ml-1" title="Real Reddit data">✓</span>
                      </span>
                    )}
                    {thread.real_stats && thread.upvotes !== undefined && (
                      <span className="flex items-center space-x-1">
                        <ArrowUp className="h-3 w-3" />
                        <span>{thread.upvotes}</span>
                        <span className="text-xs text-green-600 ml-1" title="Real Reddit data">✓</span>
                      </span>
                    )}
                    {!thread.real_stats && thread.platform === 'Reddit' && (
                      <span className="text-xs text-gray-400 italic">
                        {sessionStorage.getItem('reddit_runtime_auth') 
                          ? 'Real Reddit statistics temporarily unavailable' 
                          : 'Enable Reddit authentication to see real statistics'
                        }
                      </span>
                    )}
                  </div>
                  {thread.timestamp && <span>{thread.timestamp}</span>}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={thread.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <span>View Thread</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>

                    {isRedditPostWithComments(thread.url) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleExpanded(index)}
                        className="flex items-center space-x-1"
                      >
                        {expandedThreads.has(index) ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            <span>Hide Comments</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            <span>Show Comments</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <Button 
                    size="sm"
                    onClick={() => handleGenerateReply(thread.url, thread.title)}
                    className="flex items-center space-x-1"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Generate Reply</span>
                  </Button>
                </div>

                {expandedThreads.has(index) && isRedditPostWithComments(thread.url) && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <RedditComments url={thread.url} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
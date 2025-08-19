import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, Heart, Eye, Share2, ArrowUp, MessageSquare, ThumbsUp, Repeat2, Wand2 } from "lucide-react";
import { useLocation } from "wouter";

interface SearchResultsProps {
  results: any[];
  type: string;
  totalResults: number;
  query: string;
}

export default function SearchResults({ results, type, totalResults, query }: SearchResultsProps) {
  const [, setLocation] = useLocation();
  
  if (!results || results.length === 0) {
    return null;
  }

  // Issue #2 & #3 fix - Handle Generate Reply navigation with auto-fill
  const handleGenerateReply = (threadUrl: string, threadTitle: string) => {
    setLocation(`/ai-reply-generator?threadUrl=${encodeURIComponent(threadUrl)}&title=${encodeURIComponent(threadTitle)}`);
  };

  // Only show real statistics when available
  const hasRealStats = (result: any) => {
    return result.real_stats === true;
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <p className="text-sm text-gray-600">
            Found {totalResults} results for "{query}"
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 flex-1 pr-4">
                    {result.title}
                  </h4>
                  <Badge variant="secondary">
                    {result.platform}
                  </Badge>
                </div>
                
                {result.snippet && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {result.snippet}
                  </p>
                )}
                
                {/* Only show real platform statistics */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {result.platform === 'Reddit' && hasRealStats(result) && (
                      <>
                        {result.upvotes !== undefined && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded">
                                <ArrowUp className="h-3 w-3 text-orange-600" />
                                <span className="font-medium text-orange-700">{result.upvotes}</span>
                                <span className="text-xs text-green-600 ml-1">✓</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Real Reddit Upvotes</TooltipContent>
                          </Tooltip>
                        )}
                        {result.comments !== undefined && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded">
                                <MessageSquare className="h-3 w-3 text-blue-600" />
                                <span className="font-medium text-blue-700">{result.comments}</span>
                                <span className="text-xs text-green-600 ml-1">✓</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Real Reddit Comments</TooltipContent>
                          </Tooltip>
                        )}
                      </>
                    )}
                    {result.platform === 'Reddit' && !hasRealStats(result) && (
                      <span className="text-xs text-gray-400 italic">
                        Enable Reddit authentication to see real statistics
                      </span>
                    )}
                    
                    {result.sentiment && (
                      <Badge variant="outline" className="text-xs">
                        {result.sentiment}
                      </Badge>
                    )}
                    {result.position && (
                      <span className="text-xs">Position #{result.position}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Issue #3 fix - Add Generate Reply button for Brand Opportunities */}
                    {type === 'brand-opportunities' && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => handleGenerateReply(result.url, result.title)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        Generate Reply
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={result.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <span>View Thread</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Heart, Eye, Share2, ArrowUp, MessageSquare, ThumbsUp, Repeat2, Wand2, Search } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

interface SearchResultsProps {
  results: any[];
  type: string;
  totalResults: number;
  query: string;
}

export default function SearchResults({ results, type, totalResults, query }: SearchResultsProps) {
  const [, setLocation] = useLocation();
  const [checkedSources, setCheckedSources] = useState<{[key: number]: any}>({});
  const [loadingSource, setLoadingSource] = useState<{[key: number]: boolean}>({});
  
  if (!results || results.length === 0) {
    return null;
  }

  // Issue #2 & #3 fix - Handle Generate Reply navigation with auto-fill
  const handleGenerateReply = (threadUrl: string, threadTitle: string) => {
    setLocation(`/ai-reply-generator?threadUrl=${encodeURIComponent(threadUrl)}&title=${encodeURIComponent(threadTitle)}`);
  };

  // Handle Checked Source functionality
  const handleCheckedSource = async (index: number, title: string) => {
    setLoadingSource(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await fetch('/api/checked-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCheckedSources(prev => ({
          ...prev,
          [index]: {
            answer: data.answer,
            sources: data.sources,
            redditSource: data.redditSource
          }
        }));
      }
    } catch (error) {
      console.error('Error checking source:', error);
    } finally {
      setLoadingSource(prev => ({ ...prev, [index]: false }));
    }
  };

  // Only show real statistics when available
  const hasRealStats = (result: any) => {
    return result.real_stats === true;
  };

  // Check if Reddit auth is available in session
  const hasRedditAuth = () => {
    return sessionStorage.getItem('reddit_runtime_auth') !== null;
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
                        {hasRedditAuth() 
                          ? 'Real Reddit statistics temporarily unavailable' 
                          : 'Enable Reddit authentication to see real statistics'
                        }
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
                    
                    {/* Checked Source button for Brand Opportunities */}
                    {type === 'brand-opportunities' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => !checkedSources[index] && handleCheckedSource(index, result.title)}
                            disabled={loadingSource[index]}
                            className="bg-green-50 hover:bg-green-100 border-green-200"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            {loadingSource[index] ? 'Checking...' : 'Checked Source'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Source Check: {result.title}</DialogTitle>
                          </DialogHeader>
                          {checkedSources[index] ? (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">ChatGPT Response:</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded">{checkedSources[index].answer}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Sources:</h4>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded">{checkedSources[index].sources}</p>
                              </div>
                              {checkedSources[index].redditSource && (
                                <div>
                                  <h4 className="font-semibold mb-2">Reddit Source Thread:</h4>
                                  <a 
                                    href={checkedSources[index].redditSource} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    {checkedSources[index].redditSource}
                                  </a>
                                </div>
                              )}
                              {!checkedSources[index].redditSource && (
                                <div>
                                  <h4 className="font-semibold mb-2">Reddit Source:</h4>
                                  <p className="text-gray-500 italic">No Reddit Source Available</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">Click "Checked Source" to analyze this post</p>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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

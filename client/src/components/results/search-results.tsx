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
  const handleCheckedSource = async (index: number, title: string, platform: string) => {
    setLoadingSource(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await fetch('/api/checked-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, platform }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCheckedSources(prev => ({
          ...prev,
          [index]: {
            platformUrl: data.platformUrl,
            platform: data.platform
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
                    
                    {/* Professional Checked Source for Brand Opportunities */}
                    {type === 'brand-opportunities' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => !checkedSources[index] && handleCheckedSource(index, result.title, result.platform)}
                            disabled={loadingSource[index]}
                            className="bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200"
                          >
                            {loadingSource[index] ? (
                              <>
                                <div className="animate-spin h-3 w-3 mr-2 border border-emerald-600 border-t-transparent rounded-full" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <Search className="h-3 w-3 mr-2" />
                                Source Verification
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50">
                          <DialogHeader className="border-b border-gray-200 pb-4">
                            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center">
                              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                                <Search className="h-5 w-5 text-emerald-600" />
                              </div>
                              Source Verification Report
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              AI-powered verification of discussion authenticity and context
                            </p>
                          </DialogHeader>
                          
                          <div className="pt-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                              <h3 className="font-medium text-gray-900 mb-2">Target Discussion</h3>
                              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                "{result.title}"
                              </p>
                            </div>

                            {checkedSources[index] ? (
                              <div className="space-y-4">
                                {checkedSources[index].platformUrl ? (
                                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center mb-4">
                                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mr-3">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-green-800">Verification Successful</h4>
                                        <p className="text-sm text-green-600">Found authentic {checkedSources[index].platform} discussion</p>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-green-800">Verified Source Thread</span>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                          {checkedSources[index].platform}
                                        </Badge>
                                      </div>
                                      <a 
                                        href={checkedSources[index].platformUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-sm text-green-700 hover:text-green-900 bg-white px-3 py-2 rounded border border-green-200 hover:border-green-300 transition-colors duration-200 break-all"
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span className="truncate">{checkedSources[index].platformUrl}</span>
                                      </a>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="flex items-center text-xs text-gray-500">
                                        <div className="flex items-center mr-4">
                                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                                          Authenticity Verified
                                        </div>
                                        <div className="flex items-center">
                                          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                                          Context Validated
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                                    <div className="flex items-center mb-4">
                                      <div className="flex items-center justify-center w-8 h-8 bg-amber-100 rounded-full mr-3">
                                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-amber-800">Source Not Found</h4>
                                        <p className="text-sm text-amber-600">No corresponding {checkedSources[index].platform} discussion located</p>
                                      </div>
                                    </div>
                                    
                                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                      <p className="text-sm text-amber-800 mb-2">
                                        <strong>Analysis Result:</strong> Our AI verification system could not locate an authentic {checkedSources[index].platform} discussion matching this topic.
                                      </p>
                                      <div className="text-xs text-amber-700 space-y-1">
                                        <p>• This may indicate the discussion is from a different platform</p>
                                        <p>• The original thread may have been removed or made private</p>
                                        <p>• The content might be from a closed community or group</p>
                                      </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                      <div className="flex items-center text-xs text-gray-500">
                                        <div className="flex items-center mr-4">
                                          <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                                          Verification Attempted
                                        </div>
                                        <div className="flex items-center">
                                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                                          Source Unavailable
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                                  <Search className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Verify</h3>
                                <p className="text-gray-500 mb-4">
                                  Click "Source Verification" to analyze the authenticity and context of this discussion using our AI-powered verification system.
                                </p>
                                <div className="text-xs text-gray-400">
                                  <p>This process typically takes 5-10 seconds</p>
                                </div>
                              </div>
                            )}
                          </div>
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

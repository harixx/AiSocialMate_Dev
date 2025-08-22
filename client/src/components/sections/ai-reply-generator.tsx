import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReplyGeneratorForm from "@/components/forms/reply-generator-form";
import GeneratedReply from "../results/generated-reply";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

export default function AIReplyGenerator() {
  const { data: replyHistory } = useQuery({
    queryKey: ['/api/replies'],
    select: (data) => data || [],
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0 // Always fetch fresh data
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Reply Generator</h1>
        <p className="text-gray-600">Generate contextual AI-powered replies for social media threads and conversations.</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Reply</TabsTrigger>
          <TabsTrigger value="history">Reply History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <ReplyGeneratorForm />
          <GeneratedReply />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reply History</CardTitle>
            </CardHeader>
            <CardContent>
              {!replyHistory || !Array.isArray(replyHistory) || replyHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="mx-auto h-12 w-12 mb-4" />
                  <p>No reply history yet. Generate your first reply to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {replyHistory.length} generated replies across {new Set(replyHistory.map((r: any) => r.threadUrl)).size} threads
                  </div>
                  
                  {/* Group replies by thread URL */}
                  {Object.entries(
                    replyHistory
                      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .reduce((groups: any, reply: any) => {
                        const url = reply.threadUrl;
                        if (!groups[url]) groups[url] = [];
                        groups[url].push(reply);
                        return groups;
                      }, {})
                  ).map(([threadUrl, replies]: [string, any]) => {
                    const threadReplies = replies as any[];
                    const extractThreadTitle = (url: string) => {
                      try {
                        const parts = url.split('/');
                        const titlePart = parts.find(part => part.length > 10 && !part.startsWith('comments'));
                        return titlePart ? titlePart.replace(/_/g, ' ').substring(0, 60) : 'Reddit Thread';
                      } catch {
                        return 'Reddit Thread';
                      }
                    };
                    
                    const subreddit = threadUrl.match(/\/r\/([^\/]+)\//)?.[1] || 'reddit';
                    const threadTitle = extractThreadTitle(threadUrl);
                    
                    return (
                      <div key={threadUrl} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Thread Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                                <span className="text-sm font-medium text-orange-700">r/{subreddit}</span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
                                </span>
                              </div>
                              <h3 className="font-medium text-gray-900 truncate" title={threadTitle}>
                                {threadTitle}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1 truncate" title={threadUrl}>
                                {threadUrl}
                              </p>
                            </div>
                            <a 
                              href={threadUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                            >
                              View Thread
                            </a>
                          </div>
                        </div>
                        
                        {/* Replies for this thread */}
                        <div className="divide-y divide-gray-100">
                          {threadReplies.map((reply: any, index: number) => (
                            <div key={reply.id || `${threadUrl}_${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                                  <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900">
                                        Reply #{threadReplies.length - index}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Recently generated'}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                        {reply.replyType || 'informational'}
                                      </span>
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                        {reply.tone || 'friendly'}
                                      </span>
                                      {reply.aiProvider && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                          {reply.aiProvider}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => navigator.clipboard.writeText(reply.generatedText)}
                                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors flex-shrink-0"
                                >
                                  Copy
                                </button>
                              </div>
                              
                              <div className="bg-gray-50 rounded-lg p-3 ml-5">
                                <p className="text-gray-800 text-sm leading-relaxed">{reply.generatedText}</p>
                              </div>
                              
                              {reply.brandName && (
                                <div className="mt-2 ml-5 text-xs text-gray-500">
                                  Brand: {reply.brandName}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

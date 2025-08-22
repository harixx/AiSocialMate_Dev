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
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {replyHistory.length} generated replies (most recent first)
                  </div>
                  {replyHistory
                    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .map((reply: any) => (
                    <div key={reply.id || reply.generationId || `${reply.threadUrl}_${Math.random()}`} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500">
                            {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : 'Recently generated'}
                          </span>
                          <span className="text-xs text-gray-400 max-w-md truncate">
                            {reply.threadUrl}
                          </span>
                        </div>
                        <div className="flex space-x-2">
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
                      <p className="text-gray-800 mb-3">{reply.generatedText}</p>
                      <div className="flex justify-between items-center">
                        <a 
                          href={reply.threadUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View Original Thread
                        </a>
                        <button 
                          onClick={() => navigator.clipboard.writeText(reply.generatedText)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      {reply.brandName && (
                        <div className="mt-2 text-xs text-gray-500">
                          Brand: {reply.brandName}
                        </div>
                      )}
                      </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

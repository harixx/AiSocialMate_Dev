import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReplyGeneratorForm from "@/components/forms/reply-generator-form";
import GeneratedReply from "../results/generated-reply";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

export default function AIReplyGenerator() {
  const { data: replyHistory } = useQuery({
    queryKey: ['/api/replies'],
    select: (data) => data || []
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
                  {Array.isArray(replyHistory) && replyHistory.map((reply: any) => (
                    <div key={reply.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(reply.createdAt).toLocaleString()}
                        </span>
                        <div className="flex space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {reply.replyType}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {reply.tone}
                          </span>
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

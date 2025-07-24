import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, ExternalLink, Settings } from "lucide-react";
import { useReplyGenerator } from "../../hooks/use-reply-generator";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function GeneratedReply() {
  const { lastReply, regenerateLastReply, isLoading } = useReplyGenerator();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  if (!lastReply) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lastReply.text);
      toast({
        title: "Success",
        description: "Reply copied to clipboard!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleRegenerate = () => {
    regenerateLastReply();
  };

  const handleFeedback = async (feedbackType: 'like' | 'dislike') => {
    if (!lastReply?.id) return;
    
    setIsSubmittingFeedback(true);
    try {
      await api.submitReplyFeedback(lastReply.id, feedbackType);
      setFeedback(feedbackType);
      toast({
        title: "Feedback submitted",
        description: `Thanks for your ${feedbackType === 'like' ? 'positive' : 'constructive'} feedback!`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Reply</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button size="sm" onClick={handleRegenerate} disabled={isLoading}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {isLoading ? 'Regenerating...' : 'Regenerate Reply'}
              </Button>
              {/* Issue #5 fix - Add Adjust Anchor button */}
              <Button size="sm" variant="outline" onClick={() => {}}>
                <Settings className="h-4 w-4 mr-2" />
                Adjust Anchor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-800 leading-relaxed">
            {lastReply.text}
          </div>
          
          {/* Smart Feedback Integration */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant={feedback === 'like' ? 'default' : 'outline'}
                size="sm" 
                onClick={() => handleFeedback('like')}
                disabled={isSubmittingFeedback}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Like
              </Button>
              <Button 
                variant={feedback === 'dislike' ? 'destructive' : 'outline'}
                size="sm" 
                onClick={() => handleFeedback('dislike')}
                disabled={isSubmittingFeedback}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Dislike
              </Button>
            </div>
            
            {lastReply.metadata?.threadUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a 
                  href={lastReply.metadata.threadUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Original Thread
                </a>
              </Button>
            )}
          </div>
          
          {lastReply.metadata && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Reply type: {lastReply.metadata.replyType} | Tone: {lastReply.metadata.tone}</p>
              {lastReply.metadata.brandName && (
                <p>Brand: {lastReply.metadata.brandName}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

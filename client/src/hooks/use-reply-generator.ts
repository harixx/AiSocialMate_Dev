import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReplyData {
  id?: number;
  text: string;
  metadata?: {
    threadUrl: string;
    replyType: string;
    tone: string;
    brandName?: string;
    creativity?: string;
    model?: string;
  };
}

export function useReplyGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastReply, setLastReply] = useState<ReplyData | null>(null);
  const [lastRequestData, setLastRequestData] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateReply = async (replyData: any) => {
    setIsLoading(true);
    setLastRequestData(replyData);
    
    try {
      console.log('Sending reply generation request:', replyData);
      const result = await api.generateReply(replyData);
      console.log('API Response:', result);
      
      // Enhanced response validation
      if (result?.success && result?.reply?.text) {
        const newReply: ReplyData = {
          id: result.reply.id || Date.now(),
          text: result.reply.text,
          metadata: result.reply.metadata || {}
        };
        
        setLastReply(newReply);
        
        toast({
          title: "✅ Success",
          description: "Reply generated successfully!"
        });
        
        // Invalidate replies cache to refresh history
        queryClient.invalidateQueries({ queryKey: ['/api/replies'] });
        
        return result;
      } else {
        const errorMessage = result?.error || result?.message || 'No reply text received from AI';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Reply generation error:', error);
      
      // Enhanced error message handling
      let errorMessage = "Failed to generate reply. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('authentication')) {
          errorMessage = "API authentication failed. Please check your API keys in settings.";
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
          errorMessage = "API rate limit exceeded. Please try again in a few minutes.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateLastReply = async () => {
    if (!lastRequestData) {
      toast({
        title: "Error",
        description: "No previous request data available",
        variant: "destructive"
      });
      return;
    }

    await generateReply(lastRequestData);
  };

  return {
    generateReply,
    regenerateLastReply,
    isLoading,
    lastReply
  };
}
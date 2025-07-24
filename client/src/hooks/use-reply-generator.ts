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
      const result = await api.generateReply(replyData);
      
      if (result.success && result.reply) {
        const newReply: ReplyData = {
          id: result.reply.id,
          text: result.reply.text,
          metadata: result.reply.metadata
        };
        
        setLastReply(newReply);
        
        toast({
          title: "Success",
          description: "Reply generated successfully!"
        });
        
        // Invalidate replies cache to refresh history
        queryClient.invalidateQueries({ queryKey: ['/api/replies'] });
        
        return result;
      } else {
        throw new Error(result.error || 'Reply generation failed');
      }
    } catch (error) {
      console.error('Reply generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate reply. Please try again.",
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
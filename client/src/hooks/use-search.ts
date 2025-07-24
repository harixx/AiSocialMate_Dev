import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const searchBrandOpportunities = async (searchData: any) => {
    setIsLoading(true);
    try {
      const result = await api.searchBrandOpportunities(searchData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Found ${result.totalResults} brand opportunities!`
        });
        
        // Invalidate search results cache
        queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
        
        return result;
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Brand opportunities search error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search brand opportunities. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const searchThreads = async (searchData: any) => {
    setIsLoading(true);
    try {
      const result = await api.searchThreads(searchData);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Discovered ${result.totalResults} threads!`
        });
        
        // Invalidate search results cache
        queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
        
        return result;
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (error) {
      console.error('Thread discovery search error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to discover threads. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchBrandOpportunities,
    searchThreads,
    isLoading
  };
}
import { useState, useEffect } from "react";
import ThreadSearchForm from "@/components/forms/thread-search-form";
import ThreadResults from "../results/thread-results";
import RedditAuth from "@/components/sections/reddit-auth";
import { useSearch } from "../../hooks/use-search";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ThreadDiscovery() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const { searchThreads, isLoading } = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle OAuth callback messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const message = urlParams.get('message');

    if (authStatus && message) {
      if (authStatus === 'success') {
        toast({
          title: "Authentication Successful",
          description: message,
          variant: "default",
        });
        // Force refresh of authentication status
        queryClient.invalidateQueries({ queryKey: ['/api/reddit/auth-status'] });
      } else if (authStatus === 'error') {
        toast({
          title: "Authentication Failed",
          description: message,
          variant: "destructive",
        });
      }
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [toast, queryClient]);

  const handleSearch = async (searchData: any) => {
    const results = await searchThreads(searchData);
    if (results) {
      setSearchResults(results);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thread Discovery</h1>
        <p className="text-gray-600">Discover relevant threads and conversations across social platforms using keywords.</p>
      </div>

      <div className="mb-6">
        <RedditAuth />
      </div>

      <ThreadSearchForm 
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {searchResults && (
        <ThreadResults 
          results={searchResults.results}
          totalResults={searchResults.totalResults}
          query={searchResults.query}
        />
      )}
    </div>
  );
}

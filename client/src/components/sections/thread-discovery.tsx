import { useState } from "react";
import ThreadSearchForm from "@/components/forms/thread-search-form";
import ThreadResults from "../results/thread-results";
import { useSearch } from "../../hooks/use-search";

export default function ThreadDiscovery() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const { searchThreads, isLoading } = useSearch();

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

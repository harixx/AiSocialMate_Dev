import { useState } from "react";
import BrandOpportunityForm from "@/components/forms/brand-opportunity-form";
import SearchResults from "@/components/results/search-results";
import { useSearch } from "../../hooks/use-search";

export default function BrandOpportunities() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const { searchBrandOpportunities, isLoading } = useSearch();

  const handleSearch = async (searchData: any) => {
    const results = await searchBrandOpportunities(searchData);
    if (results) {
      setSearchResults(results);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Opportunities</h1>
        <p className="text-gray-600">Find mentions of competitors without your brand to discover new opportunities.</p>
      </div>

      {/* Issue #5 fix - Single form without tabs */}
      <div className="space-y-6">
        <BrandOpportunityForm 
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>

      {searchResults && (
        <SearchResults 
          results={searchResults.results}
          type="brand-opportunities"
          totalResults={searchResults.totalResults}
          query={searchResults.query}
        />
      )}
    </div>
  );
}

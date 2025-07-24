import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Search, Zap } from "lucide-react";

const formSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  competitorName: z.string().min(1, "Competitor name is required"),
  keywords: z.string().optional(),
  excludeKeywords: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  timeRange: z.string().default("any"),
  sentiment: z.string().default("all"),
  minEngagement: z.string().default("0"),
  maxResults: z.number().default(10),
  searchDepth: z.string().default("standard"),
  language: z.string().default("en"),
  enableInDepthSearch: z.boolean().default(false),
});

const platformOptions = [
  { id: "Reddit", label: "Reddit", checked: true },
  { id: "Quora", label: "Quora", checked: true },
  { id: "Facebook", label: "Facebook", checked: false },
  { id: "Twitter", label: "Twitter/X", checked: false },
  { id: "LinkedIn", label: "LinkedIn", checked: false },
  { id: "YouTube", label: "YouTube", checked: false },
];

interface BrandOpportunityFormProps {
  onSearch: (data: any) => Promise<void>;
  isLoading: boolean;
  activeTab?: string;
}

export default function BrandOpportunityForm({ onSearch, isLoading, activeTab }: BrandOpportunityFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      competitorName: "",
      keywords: "",
      excludeKeywords: "",
      platforms: ["Reddit", "Quora"],
      timeRange: "any",
      sentiment: "all",
      minEngagement: "0",
      maxResults: 10,
      searchDepth: "standard",
      language: "en",
      enableInDepthSearch: false,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSearch(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Opportunity Search</CardTitle>
        <p className="text-sm text-gray-600">
          Find mentions of competitors without your brand to discover new opportunities
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Brand" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your brand name to exclude from search results
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="competitorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Competitor Brand" {...field} />
                    </FormControl>
                    <FormDescription>
                      Competitor name to search for mentions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="marketing tools, automation, CRM" {...field} />
                    </FormControl>
                    <FormDescription>
                      Additional keywords to refine the search
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excludeKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclude Keywords (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="spam, irrelevant terms" {...field} />
                    </FormControl>
                    <FormDescription>
                      Keywords to exclude from results
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Platform Selection */}
            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Platforms</FormLabel>
                    <FormDescription>
                      Select which platforms to search
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {platformOptions.map((platform) => (
                      <FormField
                        key={platform.id}
                        control={form.control}
                        name="platforms"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={platform.id}
                              className="flex items-center space-x-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.id)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    const newValue = checked
                                      ? [...currentValue, platform.id]
                                      : currentValue.filter((value) => value !== platform.id);
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                {platform.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Filters and Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="timeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="any">Any time</SelectItem>
                        <SelectItem value="day">Past day</SelectItem>
                        <SelectItem value="week">Past week</SelectItem>
                        <SelectItem value="month">Past month</SelectItem>
                        <SelectItem value="year">Past year</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sentiment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sentiment</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All sentiments</SelectItem>
                        <SelectItem value="positive">Positive only</SelectItem>
                        <SelectItem value="negative">Negative only</SelectItem>
                        <SelectItem value="neutral">Neutral only</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxResults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Results</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="10">10 results</SelectItem>
                        <SelectItem value="25">25 results</SelectItem>
                        <SelectItem value="50">50 results</SelectItem>
                        <SelectItem value="100">100 results</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="searchDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Depth</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="quick">Quick (basic results)</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="deep">Deep (comprehensive)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose search depth for result quality vs speed
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Enable In-Depth Search Feature */}
            <FormField
              control={form.control}
              name="enableInDepthSearch"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center">
                      <Zap className="mr-2 h-4 w-4 text-orange-500" />
                      Enable In-Depth Search
                    </FormLabel>
                    <FormDescription>
                      Trigger deeper crawling with broader keyword expansion for more comprehensive results
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Searching...' : 'Find Opportunities'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
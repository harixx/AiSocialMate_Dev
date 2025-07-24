import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

const formSchema = z.object({
  keywords: z.string().min(1, "Keywords are required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  serperApiKey: z.string().optional(),
});

interface ThreadSearchFormProps {
  onSearch: (data: any) => void;
  isLoading: boolean;
}

export default function ThreadSearchForm({ onSearch, isLoading }: ThreadSearchFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
      platforms: ["Reddit", "Quora"],
      serperApiKey: "",
    },
  });

  const platforms = [
    { id: "Reddit", label: "Reddit" },
    { id: "Quora", label: "Quora" },
    { id: "Facebook", label: "Facebook" },
    { id: "Twitter", label: "Twitter" },
  ];

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSearch(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thread Search</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. project management, SaaS tools, productivity" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated keywords to search for
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <FormLabel>Platforms</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {platforms.map((platform) => (
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

            <FormField
              control={form.control}
              name="serperApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serper API Key (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your custom Serper.dev API key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Leave empty to use default API key
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>{isLoading ? 'Searching...' : 'Discover Threads'}</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

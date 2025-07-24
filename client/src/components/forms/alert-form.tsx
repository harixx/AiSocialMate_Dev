import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Calendar } from "lucide-react";
import { useAlerts } from "../../hooks/use-alerts";

const formSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  keywords: z.string().min(1, "Keywords are required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  frequency: z.string().default("daily"),
  minOpportunityScore: z.string().default("medium"),
  maxResults: z.number().default(10),
  includeNegativeSentiment: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  webhookUrl: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
  reportUrl: z.string().url("Please enter a valid report URL").optional().or(z.literal("")),
});

interface AlertFormProps {
  onClose: () => void;
}

export default function AlertForm({ onClose }: AlertFormProps) {
  const { createAlert, isLoading } = useAlerts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      keywords: "",
      platforms: [],
      frequency: "daily",
      minOpportunityScore: "medium",
      maxResults: 10,
      includeNegativeSentiment: false,
      emailNotifications: true,
      email: "",
      webhookUrl: "",
      reportUrl: "",
    },
  });

  const platforms = [
    { id: "Reddit", label: "Reddit" },
    { id: "Quora", label: "Quora" },
    { id: "Facebook", label: "Facebook" },
    { id: "Twitter", label: "Twitter/X" },
    { id: "LinkedIn", label: "LinkedIn" },
    { id: "YouTube", label: "YouTube" },
  ];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const success = await createAlert(values);
    if (success) {
      onClose();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create New Alert</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Brand Monitor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Daily digest of new opportunities</FormLabel>
                <div className="flex items-center space-x-2 text-gray-600 mt-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Every day at 9:00 AM</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="software, tool, alternative, competitor" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated keywords to monitor
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
                  <FormLabel>Platforms to Monitor</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="minOpportunityScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Opportunity Score</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (30%)</SelectItem>
                          <SelectItem value="medium">Medium (50%)</SelectItem>
                          <SelectItem value="high">High (70%)</SelectItem>
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
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="includeNegativeSentiment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include negative sentiment posts
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Send email notifications
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("emailNotifications") && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="notifications@yourdomain.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email address to receive alert notifications
                      </FormDescription>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://your-webhook.com/alerts" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Receive alerts via webhook
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reportUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://your-reports-dashboard.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL where detailed reports will be published
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Calendar, Plus, Minus, Building2 } from "lucide-react";
import { useAlerts } from "../../hooks/use-alerts";

const competitorSchema = z.object({
  canonicalName: z.string().min(1, "Competitor name is required"),
  aliases: z.array(z.string()).default([]),
  domains: z.array(z.string()).default([]),
});

const formSchema = z.object({
  name: z.string().min(1, "Alert name is required"),
  competitors: z.array(competitorSchema).min(1, "Add at least one competitor"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  frequency: z.string().default("daily"),
  maxResults: z.number().default(10),
  includeNegativeSentiment: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  webhookUrl: z.string().url("Please enter a valid webhook URL").optional().or(z.literal("")),
  reportUrl: z.string().url("Please enter a valid report URL").optional().or(z.literal("")),
  enableFuzzyMatching: z.boolean().default(false),
  dedupeWindow: z.number().default(30),
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
      competitors: [{ canonicalName: "", aliases: [], domains: [] }],
      platforms: [],
      frequency: "daily",
      maxResults: 10,
      includeNegativeSentiment: false,
      emailNotifications: true,
      email: "",
      webhookUrl: "",
      reportUrl: "",
      enableFuzzyMatching: false,
      dedupeWindow: 30,
    },
  });

  const { fields: competitorFields, append: appendCompetitor, remove: removeCompetitor } = useFieldArray({
    control: form.control,
    name: "competitors"
  });

  const platforms = [
    { id: "Reddit", label: "Reddit" },
    { id: "Quora", label: "Quora" },
    { id: "Facebook", label: "Facebook" },
    { id: "Twitter", label: "Twitter/X" },
    { id: "LinkedIn", label: "LinkedIn" },
  ];

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const success = await createAlert(values);
    if (success) {
      onClose();
    }
  };

  const addAlias = (competitorIndex: number) => {
    const currentAliases = form.getValues(`competitors.${competitorIndex}.aliases`);
    form.setValue(`competitors.${competitorIndex}.aliases`, [...currentAliases, ""]);
  };

  const removeAlias = (competitorIndex: number, aliasIndex: number) => {
    const currentAliases = form.getValues(`competitors.${competitorIndex}.aliases`);
    const newAliases = currentAliases.filter((_, index) => index !== aliasIndex);
    form.setValue(`competitors.${competitorIndex}.aliases`, newAliases);
  };

  const addDomain = (competitorIndex: number) => {
    const currentDomains = form.getValues(`competitors.${competitorIndex}.domains`);
    form.setValue(`competitors.${competitorIndex}.domains`, [...currentDomains, ""]);
  };

  const removeDomain = (competitorIndex: number, domainIndex: number) => {
    const currentDomains = form.getValues(`competitors.${competitorIndex}.domains`);
    const newDomains = currentDomains.filter((_, index) => index !== domainIndex);
    form.setValue(`competitors.${competitorIndex}.domains`, newDomains);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Competitor Presence Alert</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Monitor competitors across social platforms with advanced deduplication</p>
          </div>
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
                    <Input placeholder="Tech Company Competitor Monitor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base font-medium">Competitors to Monitor</FormLabel>
              <FormDescription className="mb-4">
                Add competitors with their canonical names, aliases, and domains for comprehensive detection
              </FormDescription>
              
              <div className="space-y-4">
                {competitorFields.map((field, competitorIndex) => (
                  <Card key={field.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Competitor {competitorIndex + 1}</span>
                        </div>
                        {competitorFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCompetitor(competitorIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`competitors.${competitorIndex}.canonicalName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Canonical Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Resimpli" {...field} />
                              </FormControl>
                              <FormDescription>
                                The primary name of the competitor
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel>Aliases (Optional)</FormLabel>
                          <FormDescription className="mb-2">
                            Alternative names or variations (e.g., "Resimpli CRM", "Resimpli Software")
                          </FormDescription>
                          {form.watch(`competitors.${competitorIndex}.aliases`).map((alias, aliasIndex) => (
                            <div key={aliasIndex} className="flex gap-2 mb-2">
                              <Input
                                placeholder="e.g., Resimpli CRM"
                                value={alias}
                                onChange={(e) => {
                                  const currentAliases = form.getValues(`competitors.${competitorIndex}.aliases`);
                                  currentAliases[aliasIndex] = e.target.value;
                                  form.setValue(`competitors.${competitorIndex}.aliases`, currentAliases);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAlias(competitorIndex, aliasIndex)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAlias(competitorIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Alias
                          </Button>
                        </div>

                        <div>
                          <FormLabel>Domains (Optional)</FormLabel>
                          <FormDescription className="mb-2">
                            Official domains for verification (e.g., "resimpli.com")
                          </FormDescription>
                          {form.watch(`competitors.${competitorIndex}.domains`).map((domain, domainIndex) => (
                            <div key={domainIndex} className="flex gap-2 mb-2">
                              <Input
                                placeholder="e.g., resimpli.com"
                                value={domain}
                                onChange={(e) => {
                                  const currentDomains = form.getValues(`competitors.${competitorIndex}.domains`);
                                  currentDomains[domainIndex] = e.target.value;
                                  form.setValue(`competitors.${competitorIndex}.domains`, currentDomains);
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDomain(competitorIndex, domainIndex)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addDomain(competitorIndex)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Domain
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendCompetitor({ canonicalName: "", aliases: [], domains: [] })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Competitor
                </Button>
              </div>
            </div>

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
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Next Run</FormLabel>
                <div className="flex items-center space-x-2 text-gray-600 mt-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Will be scheduled automatically</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="platforms"
              render={() => (
                <FormItem>
                  <FormLabel>Platforms to Monitor</FormLabel>
                  <FormDescription>YouTube is excluded from competitor presence monitoring</FormDescription>
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
                  name="maxResults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Results per Platform</FormLabel>
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
                          <SelectItem value="5">5 results</SelectItem>
                          <SelectItem value="10">10 results</SelectItem>
                          <SelectItem value="25">25 results</SelectItem>
                          <SelectItem value="50">50 results</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dedupeWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deduplication Window</FormLabel>
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
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days (recommended)</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Skip duplicate content within this timeframe
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="enableFuzzyMatching"
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
                        Enable fuzzy matching
                      </FormLabel>
                      <FormDescription>
                        Detect variations and misspellings of competitor names
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

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
                    Receive real-time alerts via webhook with HMAC signing
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
                    URL where detailed presence history reports will be published
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Alert...' : 'Create Competitor Alert'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

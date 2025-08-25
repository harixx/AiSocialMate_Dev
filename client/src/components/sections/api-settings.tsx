import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, ExternalLink, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RedditAuth from "./reddit-auth";

const formSchema = z.object({
  openaiApiKey: z.string().optional(),
  serperApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  useCustomKeys: z.boolean().default(false),
});

export default function APISettings() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      openaiApiKey: "",
      serperApiKey: "",
      geminiApiKey: "",
      useCustomKeys: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/settings/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "API Settings Saved",
          description: "Your API keys have been configured and are active.",
        });
        // Also save to localStorage as backup
        localStorage.setItem('customApiKeys', JSON.stringify(values));
      } else {
        throw new Error(result.error || 'Failed to save API keys');
      }
    } catch (error) {
      console.error('Failed to save API keys:', error);
      toast({
        title: "Error",
        description: "Failed to save API keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedSettings = async () => {
    try {
      // First try to load from server
      const response = await fetch('/api/settings/keys');
      const result = await response.json();
      
      if (result.success) {
        // Load current status and update form
        const saved = localStorage.getItem('customApiKeys');
        if (saved) {
          const settings = JSON.parse(saved);
          form.reset(settings);
        }
        toast({
          title: "Settings Loaded",
          description: `API Status: OpenAI ${result.keys.openai ? '✓' : '✗'}, Gemini ${result.keys.gemini ? '✓' : '✗'}, Serper ${result.keys.serper ? '✓' : '✗'}`,
        });
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('customApiKeys');
        if (saved) {
          const settings = JSON.parse(saved);
          form.reset(settings);
          toast({
            title: "Settings Loaded",
            description: "Your saved API settings have been loaded from local storage.",
          });
        }
      }
    } catch (error) {
      console.error('Failed to load saved settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('customApiKeys');
      if (saved) {
        const settings = JSON.parse(saved);
        form.reset(settings);
      }
    }
  };

  const clearSettings = async () => {
    try {
      const response = await fetch('/api/settings/keys', {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        localStorage.removeItem('customApiKeys');
        form.reset();
        toast({
          title: "Settings Cleared",
          description: "All API keys have been cleared from the server.",
        });
      } else {
        throw new Error(result.error || 'Failed to clear API keys');
      }
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      // Still clear localStorage as fallback
      localStorage.removeItem('customApiKeys');
      form.reset();
      toast({
        title: "Warning",
        description: "API keys cleared locally, but server update failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your API keys and authentication settings for enhanced functionality.</p>
      </div>

      <div className="space-y-6">
        {/* Reddit Authentication Section */}
        <RedditAuth />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Configuration</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Optional: Use your own API keys for better performance and higher limits
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="useCustomKeys"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Use Custom API Keys
                        </FormLabel>
                        <FormDescription>
                          Enable this to use your own API keys instead of the default ones
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

                {form.watch("useCustomKeys") && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="openaiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI API Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="sk-..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="flex items-center space-x-2">
                            <span>Get your API key from</span>
                            <a 
                              href="https://platform.openai.com/api-keys" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span>OpenAI Platform</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serperApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serper.dev API Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Your Serper API key..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="flex items-center space-x-2">
                            <span>Get your API key from</span>
                            <a 
                              href="https://serper.dev/" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span>Serper.dev</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="geminiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Gemini API Key (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Your Gemini API key..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="flex items-center space-x-2">
                            <span>Get your API key from</span>
                            <a 
                              href="https://makersuite.google.com/app/apikey" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-1"
                            >
                              <span>Google AI Studio</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Settings className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={loadSavedSettings}
                  >
                    Load Saved
                  </Button>

                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={clearSettings}
                  >
                    Clear All
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">OpenAI GPT</h4>
                <p className="text-sm text-gray-600">
                  Used for AI reply generation with advanced techniques like chain-of-thought reasoning.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Serper.dev</h4>
                <p className="text-sm text-gray-600">
                  Powers social media search across Reddit, Twitter, Facebook, and more platforms.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Google Gemini</h4>
                <p className="text-sm text-gray-600">
                  Alternative AI provider for reply generation and content analysis.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-blue-800">
                Using your own API keys provides higher rate limits, better performance, and access to the latest models. 
                The application will work with default keys, but custom keys are recommended for heavy usage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
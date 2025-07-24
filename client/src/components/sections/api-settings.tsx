import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, Key, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    // Store API keys in localStorage for this demo
    // In production, these should be handled more securely
    localStorage.setItem('customApiKeys', JSON.stringify(values));
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "API Settings Saved",
        description: "Your custom API keys have been configured.",
      });
    }, 1000);
  };

  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('customApiKeys');
      if (saved) {
        const settings = JSON.parse(saved);
        form.reset(settings);
        toast({
          title: "Settings Loaded",
          description: "Your saved API settings have been loaded.",
        });
      }
    } catch (error) {
      console.error('Failed to load saved settings:', error);
    }
  };

  const clearSettings = () => {
    localStorage.removeItem('customApiKeys');
    form.reset();
    toast({
      title: "Settings Cleared",
      description: "All custom API keys have been removed.",
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Settings</h1>
        <p className="text-gray-600">Configure your custom API keys for enhanced functionality and higher usage limits.</p>
      </div>

      <div className="space-y-6">
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
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ExternalLink, Wand2 } from "lucide-react";
import { useReplyGenerator } from "../../hooks/use-reply-generator";

const formSchema = z.object({
  threadUrl: z.string().url("Please enter a valid URL"),
  replyType: z.string().default("informational"),
  tone: z.string().default("friendly"),
  brandName: z.string().optional(),
  brandContext: z.string().optional(),
  brandUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  aiProvider: z.string().default("openai"),
  model: z.string().default("gpt-4o"),
  creativity: z.array(z.number()).default([0.7]),

});

export default function ReplyGeneratorForm() {
  const { generateReply, isLoading } = useReplyGenerator();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      threadUrl: "",
      replyType: "informational",
      tone: "friendly",
      brandName: "",
      brandContext: "",
      brandUrl: "",
      aiProvider: "openai",
      model: "gpt-4o",
      creativity: [0.7],
    },
  });

  // Issue #2 fix - Auto-fill thread URL from query params
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const threadUrl = urlParams.get('threadUrl');
    const title = urlParams.get('title');
    
    if (threadUrl) {
      form.setValue('threadUrl', decodeURIComponent(threadUrl));
    }
    
    // Clear URL params after auto-filling to clean up the URL
    if (threadUrl || title) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Get custom API keys from localStorage if available
    const customKeys = localStorage.getItem('customApiKeys');
    let customApiKey = '';
    
    if (customKeys) {
      try {
        const keys = JSON.parse(customKeys);
        if (keys.useCustomKeys && keys.openaiApiKey) {
          customApiKey = keys.openaiApiKey;
        }
      } catch (error) {
        console.error('Error parsing custom API keys:', error);
      }
    }
    
    const submitData = {
      ...values,
      creativity: values.creativity[0].toString(),
      customApiKey: customApiKey,
    };
    generateReply(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reply Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="threadUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thread URL</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input 
                        placeholder="https://reddit.com/r/example/comments/..." 
                        className="rounded-r-none border-r-0"
                        {...field} 
                      />
                    </FormControl>
                    {field.value && (
                      <a
                        href={field.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-r-lg hover:bg-gray-200 transition-colors flex items-center"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="replyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reply Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="informational">Informational</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="supportive">Supportive</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="brandName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your brand name" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandContext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Context (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional: Add specific details about your product..." 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://yourbrand.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Your brand website to subtly reference in replies
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="aiProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="creativity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creativity (Temperature): {field.value[0]}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>More focused</span>
                    <span>More creative</span>
                  </div>
                </FormItem>
              )}
            />



            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>{isLoading ? 'Generating...' : 'Generate Reply'}</span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

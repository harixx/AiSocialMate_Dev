import { apiRequest } from "./queryClient";

export const api = {
  // Search APIs
  searchBrandOpportunities: async (data: any) => {
    const response = await apiRequest('POST', '/api/search/brand-opportunities', data);
    return response.json();
  },

  searchThreads: async (data: any) => {
    const response = await apiRequest('POST', '/api/search/threads', data);
    return response.json();
  },

  // AI Reply Generation
  generateReply: async (data: any) => {
    const response = await apiRequest('POST', '/api/generate-reply', data);
    return response.json();
  },

  // Alerts
  getAlerts: async () => {
    const response = await apiRequest('GET', '/api/alerts');
    return response.json();
  },

  createAlert: async (data: any) => {
    const response = await apiRequest('POST', '/api/alerts', data);
    return response.json();
  },

  deleteAlert: async (id: number) => {
    const response = await apiRequest('DELETE', `/api/alerts/${id}`);
    return response.json();
  },

  // Replies
  getReplies: async () => {
    const response = await apiRequest('GET', '/api/replies');
    return response.json();
  },

  // Search Results
  getSearchResults: async (type?: string) => {
    const url = type ? `/api/search-results?type=${type}` : '/api/search-results';
    const response = await apiRequest('GET', url);
    return response.json();
  },

  // Reply Feedback
  submitReplyFeedback: async (replyId: number, feedback: 'like' | 'dislike') => {
    const response = await apiRequest('POST', `/api/replies/${replyId}/feedback`, { feedback });
    return response.json();
  },

  // FAQ Generation
  generateFAQ: async (data: any) => {
    const response = await apiRequest('POST', '/api/generate-faq', data);
    return response.json();
  },
};

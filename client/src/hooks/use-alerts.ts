import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useAlerts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts'],
    select: (data) => data || []
  });

  const createAlertMutation = useMutation({
    mutationFn: api.createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Success",
        description: "Alert created successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create alert",
        variant: "destructive"
      });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: api.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Success",
        description: "Alert deleted successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete alert",
        variant: "destructive"
      });
    }
  });

  const createAlert = async (alertData: any) => {
    try {
      await createAlertMutation.mutateAsync(alertData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      toast({
        title: "Success", 
        description: "Alert updated successfully!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update alert",
        variant: "destructive"
      });
    }
  });

  const deleteAlert = async (alertId: number) => {
    try {
      await deleteAlertMutation.mutateAsync(alertId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const updateAlert = async (alertId: number, data: any) => {
    try {
      await updateAlertMutation.mutateAsync({ id: alertId, data });
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    alerts,
    isLoading: isLoading || createAlertMutation.isPending || deleteAlertMutation.isPending || updateAlertMutation.isPending,
    createAlert,
    updateAlert,
    deleteAlert
  };
}
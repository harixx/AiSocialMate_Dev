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

  const deleteAlert = async (alertId: number) => {
    try {
      await deleteAlertMutation.mutateAsync(alertId);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    alerts,
    isLoading: isLoading || createAlertMutation.isPending || deleteAlertMutation.isPending,
    createAlert,
    deleteAlert
  };
}
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEventSource } from "../api/event-sources";
import type {
  EventSourceResponse,
  RegisterEventSourceFormValues,
} from "../schemas/event-source-schema";

export function useCreateEventSource() {
  const queryClient = useQueryClient();

  return useMutation<EventSourceResponse, Error, RegisterEventSourceFormValues>({
    mutationFn: (values) => createEventSource(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["event-sources"] });
    },
  });
}

import { apiRequest } from "@/lib/api/api-client";
import {
  eventSourceResponseSchema,
  type EventSourceResponse,
  type RegisterEventSourceFormValues,
} from "../schemas/event-source-schema";

export async function createEventSource(
  values: RegisterEventSourceFormValues,
): Promise<EventSourceResponse> {
  const payload = {
    name: values.name.trim(),
    sourceType: values.sourceType.trim(),
    endpoint: values.endpoint && values.endpoint.trim().length > 0 ? values.endpoint.trim() : null,
    ingestionMethod: values.ingestionMethod,
    authenticationType:
      values.authenticationType && values.authenticationType.trim().length > 0
        ? values.authenticationType.trim()
        : null,
    status: values.status,
    description:
      values.description && values.description.trim().length > 0
        ? values.description.trim()
        : null,
    eventFamilies: values.eventFamilies,
  };

  const data = await apiRequest<unknown>("/api/event-sources", {
    target: "same-origin",
    method: "POST",
    body: payload,
  });

  return eventSourceResponseSchema.parse(data);
}

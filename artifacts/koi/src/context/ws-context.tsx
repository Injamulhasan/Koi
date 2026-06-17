import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket, type WsEvent } from "@/hooks/useWebSocket";
import { useAuth } from "@/lib/auth";
import {
  getListMessagesQueryKey,
  getListVotesQueryKey,
  getGetMyVoteQueryKey,
  getListLocationsQueryKey,
  getGetScheduleQueryKey,
  getListContributionsQueryKey,
  getListLendingRecordsQueryKey,
  getListNotificationsQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";

const WsContext = createContext<null>(null);

export function WsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  const handleEvent = useCallback(
    (event: WsEvent) => {
      switch (event.type) {
        case "message:new":
        case "message:reaction":
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          break;

        case "vote:cast":
          queryClient.invalidateQueries({ queryKey: getListVotesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyVoteQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          break;

        case "schedule:updated":
          queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          break;

        case "contribution:updated":
          queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          break;

        case "lending:new":
        case "lending:updated":
          queryClient.invalidateQueries({ queryKey: getListLendingRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          break;

        default:
          break;
      }

      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    },
    [queryClient],
  );

  useWebSocket(handleEvent, !!isSignedIn);

  return <WsContext.Provider value={null}>{children}</WsContext.Provider>;
}

export function useWs() {
  return useContext(WsContext);
}

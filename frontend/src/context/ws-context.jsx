import { createContext, useContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket.js";
import { useAuth } from "@/lib/auth.jsx";
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
} from "@/lib/api.js";

const WsContext = createContext(null);

export function WsProvider({ children }) {
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();

  const handleEvent = useCallback(
    (event) => {
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
    [queryClient]
  );

  useWebSocket(handleEvent, !!isSignedIn);

  return <WsContext.Provider value={null}>{children}</WsContext.Provider>;
}

export function useWs() {
  return useContext(WsContext);
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "./supabaseClient.js";

const API_URL = import.meta.env.VITE_API_URL || ""; // Falls back to relative paths (proxied) in development

async function fetchWithAuth(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// Query Keys
export const getGetMeQueryKey = () => ["/api/auth/me"];
export const getListUsersQueryKey = () => ["/api/users"];
export const getGetDashboardSummaryQueryKey = () => ["/api/dashboard/summary"];
export const getListLocationsQueryKey = () => ["/api/locations"];
export const getListVotesQueryKey = () => ["/api/votes"];
export const getGetMyVoteQueryKey = () => ["/api/votes/my"];
export const getGetScheduleQueryKey = () => ["/api/schedule"];
export const getListMessagesQueryKey = () => ["/api/messages"];
export const getListContributionsQueryKey = () => ["/api/contributions"];
export const getListLendingRecordsQueryKey = () => ["/api/lending"];
export const getListNotificationsQueryKey = () => ["/api/notifications"];

// Queries
export function useGetMe(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getGetMeQueryKey(),
    queryFn: () => fetchWithAuth("/api/auth/me"),
    ...query,
  });
}

export const getGetCurrentUserQueryKey = () => ["/api/users/me"];
export function useGetCurrentUser(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: () => fetchWithAuth("/api/users/me"),
    ...query,
  });
}

export function useListUsers(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListUsersQueryKey(),
    queryFn: () => fetchWithAuth("/api/users"),
    ...query,
  });
}

export function useGetDashboardSummary(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => fetchWithAuth("/api/dashboard/summary"),
    ...query,
  });
}

export function useListLocations(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListLocationsQueryKey(),
    queryFn: () => fetchWithAuth("/api/locations"),
    ...query,
  });
}

export function useListVotes(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListVotesQueryKey(),
    queryFn: () => fetchWithAuth("/api/votes"),
    ...query,
  });
}

export function useGetMyVote(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getGetMyVoteQueryKey(),
    queryFn: () => fetchWithAuth("/api/votes/my"),
    ...query,
  });
}

export function useGetSchedule(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getGetScheduleQueryKey(),
    queryFn: () => fetchWithAuth("/api/schedule"),
    ...query,
  });
}

export function useListMessages(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListMessagesQueryKey(),
    queryFn: () => fetchWithAuth("/api/messages"),
    ...query,
  });
}

export function useListContributions(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListContributionsQueryKey(),
    queryFn: () => fetchWithAuth("/api/contributions"),
    ...query,
  });
}

export function useListLendingRecords(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListLendingRecordsQueryKey(),
    queryFn: () => fetchWithAuth("/api/lending"),
    ...query,
  });
}

export function useListNotifications(options = {}) {
  const { query = {} } = options;
  return useQuery({
    queryKey: getListNotificationsQueryKey(),
    queryFn: () => fetchWithAuth("/api/notifications"),
    ...query,
  });
}

// Mutations
export function useCastVote() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/votes", {
      method: "POST",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useUpdateSchedule() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/schedule", {
      method: "PUT",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useUpsertMyContribution() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/contributions/me", {
      method: "PUT",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/messages", {
      method: "POST",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useAddReaction() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth(`/api/messages/${variables.id}/reactions`, {
      method: "POST",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useCreateLendingRecord() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/lending", {
      method: "POST",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useMarkLoanRepaid() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth(`/api/lending/${variables.id}/repaid`, {
      method: "POST",
    }),
  });
}

export function useDeleteLendingRecord() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth(`/api/lending/${variables.id}`, {
      method: "DELETE",
    }),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useUpdateCurrentUser() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(variables.data),
    }),
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () => fetchWithAuth("/api/notifications/read-all", {
      method: "POST",
    }),
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: (variables) => fetchWithAuth(`/api/notifications/${variables.id}/read`, {
      method: "POST",
    }),
  });
}

// Hook que reemplaza el estado local por sincronización en la nube.
// Expone el mismo contrato que el estado previo: `state`, `setState`,
// `reemplazar` y `guardando` para que los componentes de UI no cambien.
import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { AppState } from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  loadSnapshot,
  saveSnapshot,
} from "./workspace.functions";

const SNAPSHOT_KEY = ["workspace-snapshot"] as const;

export function useCloudState() {
  const queryClient = useQueryClient();
  const loadFn = useServerFn(loadSnapshot);
  const saveFn = useServerFn(saveSnapshot);

  const { data, isLoading, error } = useQuery({
    queryKey: SNAPSHOT_KEY,
    queryFn: () => loadFn(),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const workspaceId = data?.workspaceId ?? null;

  // Suscripción realtime al beacon público del workspace: cuando otro
  // dispositivo guarda, invalidamos la query y recargamos el snapshot.
  useEffect(() => {
    if (!workspaceId) return;
    const channel = supabase
      .channel(`workspace-sync-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_sync",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: SNAPSHOT_KEY });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  const mutation = useMutation({
    mutationFn: (snapshot: AppState) => saveFn({ data: { snapshot } }),
    onMutate: async (snapshot) => {
      await queryClient.cancelQueries({ queryKey: SNAPSHOT_KEY });
      const previous = queryClient.getQueryData(SNAPSHOT_KEY);
      queryClient.setQueryData(SNAPSHOT_KEY, (old: any) =>
        old
          ? { ...old, snapshot }
          : { workspaceId, snapshot, updatedAt: new Date().toISOString() },
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(SNAPSHOT_KEY, ctx.previous);
    },
  });

  const saveRef = useRef(mutation.mutate);
  saveRef.current = mutation.mutate;

  const api = useMemo(() => {
    const state: AppState = data?.snapshot ?? {
      version: 1,
      trips: [],
      activeTripId: null,
    };
    const setState = (next: AppState | ((prev: AppState) => AppState)) => {
      const resolved =
        typeof next === "function"
          ? (next as (p: AppState) => AppState)(state)
          : next;
      queryClient.setQueryData(SNAPSHOT_KEY, (old: any) =>
        old
          ? { ...old, snapshot: resolved }
          : { workspaceId, snapshot: resolved, updatedAt: new Date().toISOString() },
      );
      saveRef.current(resolved);
    };
    return { state, setState };
  }, [data, queryClient, workspaceId]);

  return {
    ...api,
    isLoading,
    error: error as Error | null,
    guardando: mutation.isPending,
  };
}

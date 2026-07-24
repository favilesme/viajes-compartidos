import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Login } from "../components/Login";
import { App } from "../components/App";
import { getWorkspaceSession } from "../lib/workspace.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Viajes Compartidos · Anima Praxis — gestión colaborativa de viajes",
      },
      {
        name: "description",
        content:
          "Aplicación interna de Anima Praxis para registrar gastos, actividades y compras de un viaje con liquidación 50/50 sincronizada entre dispositivos.",
      },
      {
        property: "og:title",
        content: "Viajes Compartidos · Anima Praxis",
      },
      {
        property: "og:description",
        content:
          "Gestión colaborativa de viajes entre dos personas con sincronización segura entre dispositivos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const queryClient = useQueryClient();
  const sessionFn = useServerFn(getWorkspaceSession);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["workspace-session"],
    queryFn: () => sessionFn(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  if (!data?.workspaceId) {
    return (
      <Login
        onAcceso={() => {
          refetch();
        }}
      />
    );
  }

  return (
    <App
      onCerrarSesion={() => {
        queryClient.setQueryData(["workspace-session"], { workspaceId: null });
        queryClient.removeQueries({ queryKey: ["workspace-snapshot"] });
        refetch();
      }}
    />
  );
}

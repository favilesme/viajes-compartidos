import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Login } from "../components/Login";
import { App } from "../components/App";
import { isSessionActive } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Viajes Compartidos — Gestión colaborativa de viajes entre dos" },
      {
        name: "description",
        content:
          "Aplicación interna para registrar gastos, actividades, compras y liquidar cuentas 50/50 entre dos participantes.",
      },
      { property: "og:title", content: "Viajes Compartidos" },
      {
        property: "og:description",
        content:
          "Gestiona gastos, actividades y compras de un viaje entre dos personas con liquidación automática 50/50.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  // Comprobación en efecto para evitar mismatch de hidratación SSR.
  const [autenticado, setAutenticado] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setAutenticado(isSessionActive());
    setHidratado(true);
  }, []);

  if (!hidratado) return null;
  if (!autenticado) return <Login onAcceso={() => setAutenticado(true)} />;
  return <App onCerrarSesion={() => setAutenticado(false)} />;
}

// Configuración para una futura integración de Resumen Inteligente.
// El módulo NO llama a ninguna API, NO envía datos y NO requiere claves.
// Cuando se decida habilitar, cambiar `enabled` a true y desarrollar el cliente.

export const AI_FEATURE = {
  enabled: false,
  provider: "openai" as const,
  endpoint: null as string | null,
};

export type AIFeatureConfig = typeof AI_FEATURE;

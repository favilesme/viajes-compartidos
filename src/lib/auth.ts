// Barrera básica de acceso — NO es autenticación empresarial.
// La validación real ocurre en el servidor (src/lib/workspace.functions.ts):
// se compara SHA-256 contra un hash guardado en la nube y se firma una cookie
// httpOnly de sesión con el workspace_id.
//
// Este módulo se mantiene por compatibilidad con imports previos y expone la
// utilidad de hashing por si se necesita en el navegador.
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

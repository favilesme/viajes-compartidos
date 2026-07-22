// Barrera básica de acceso — NO es autenticación empresarial.
// Verifica la contraseña calculando SHA-256 en el navegador y comparando
// contra una huella pre-generada. La sesión se guarda solo en sessionStorage
// (se pierde al cerrar la pestaña).
//
// La contraseña real NO está en el código: solo su huella SHA-256.

const EXPECTED_HASH =
  "1b3affbe74447a9569dbdf36ae7002f630682fbb6094031cab5a714e3beca413";
const SESSION_KEY = "viajes-compartidos:session";

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = await sha256Hex(password);
  // Comparación de igual longitud; suficiente para una barrera básica.
  return hash === EXPECTED_HASH;
}

export function isSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "ok";
}

export function openSession(): void {
  window.sessionStorage.setItem(SESSION_KEY, "ok");
}

export function closeSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}

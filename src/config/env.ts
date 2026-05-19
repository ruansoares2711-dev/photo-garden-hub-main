/**
 * Camada `config`: variáveis e configurações globais do client.
 * Use SOMENTE valores expostos via VITE_*. Segredos ficam no servidor.
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
};

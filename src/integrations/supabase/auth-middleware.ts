import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("(Auth-Middleware) Missing Supabase environment variables.");
    }

    const request = getRequest();
    
    // 1. Tenta pegar do Header Authorization
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 2. SE NÃO TIVER, Tenta pegar do Cookie (Supabase padrão: sb-....-auth-token)
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // Regex para buscar o token dentro dos cookies
        const match = cookieHeader.match(/sb-.*-auth-token=([^;]+)/);
        if (match) {
           // O cookie do supabase costuma ser um JSON, precisamos apenas do access_token
           try {
             const authData = JSON.parse(decodeURIComponent(match[1]));
             token = authData.access_token;
           } catch (e) {
             token = undefined;
           }
        }
      }
    }
  /*
    if (!token) {
      throw new Response('Unauthorized: No token provided', { status: 401 });
    }
  */
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Validar o token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    /*
    if (error || !user) {
      throw new Response('Unauthorized: Invalid token', { status: 401 });
    }
*/
    return next({
      context: {
        supabase,
        userId: user.id,
        user,
      },
    })
  }
)

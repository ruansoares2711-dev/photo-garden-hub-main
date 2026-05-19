# Photo Garden Hub - Guia de Desenvolvimento

## Stack Tecnológico
- **Framework**: TanStack Start + React 19
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui (Radix UI + Tailwind)
- **Roteamento**: TanStack React Router v1
- **State Management**: TanStack Query v5
- **Backend**: Supabase (PostgreSQL)
- **Build**: Vite + Cloudflare Workers
- **Package Manager**: npm/Bun

## Estrutura do Projeto

### Camadas (Clean Architecture)
- **`application/`** - Bootstrap da aplicação e roteador
- **`config/`** - Configurações globais (env, site, storage)
- **`routes/`** - Rotas TanStack Router (incluindo API)
- **`controller/`** - Controllers de página (UI logic)
- **`service/`** - Lógica de negócio
- **`repository/`** - Acesso a dados (Supabase)
- **`model/`** - Tipos de domínio
- **`dto/`** - Transfer Objects (request/response)
- **`hooks/`** - React Hooks customizados
- **`components/`** - Componentes React reutilizáveis
- **`lib/`** - Utilitários (format, utils)
- **`integrations/`** - Integrações externas (Supabase)
- **`server/`** - Server-side functions (Cloudflare Workers)
- **`assets/`** - Imagens e mídia

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- Git
- Conta Supabase

### Variáveis de Ambiente (`.env.local`)
```
VITE_SUPABASE_URL=https://msuffpijwfqzgfeqcszp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_anonima_aqui
MERCADO_PAGO_ACCESS_TOKEN=sua_chave_privada_aqui
```

### Setup Inicial
1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar dev server**:
   ```bash
   npm run dev
   ```
   Aplicação rodará em: `http://localhost:5173`

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server em localhost:5173 |
| `npm run build` | Build produção |
| `npm run preview` | Preview do build local |
| `npm run lint` | Verifica ESLint |
| `npm run format` | Formata com Prettier |

## Fluxo de Autenticação
1. **AuthService** - Lógica de auth
2. **AuthRepository** - Chamadas Supabase
3. **useAuth()** - Hook para consumir no UI
4. **Protected Routes** - Verificação de sessão

## Integração Supabase
- **Client**: `src/integrations/supabase/client.ts`
- **Server Admin**: `src/integrations/supabase/client.server.ts`
- **Auth**: Supabase Auth
- **Database**: PostgreSQL

## Troubleshooting

### "Module not found"
Verificar `tsconfig.json` - paths: `@/*` → `src/*`

### "VITE_SUPABASE_* undefined"
Confirmar `.env.local` com variáveis `VITE_*`

### Supabase connection error
Verificar URL e publishable key em `.env.local`

## Segurança

### Variáveis de Ambiente
- **Public** (`VITE_*`): Expostas ao cliente
- **Secret**: Server-side only (SUPABASE_SERVICE_ROLE_KEY, MERCADO_PAGO_*)

### Row-Level Security (RLS)
- Client usa `supabase` (com auth)
- Server usa `supabaseAdmin` (bypassa RLS, apenas server functions)

## Deployment

### Cloudflare Workers
- Build: `npm run build`
- Config: `wrangler.jsonc`
- Vars via Cloudflare dashboard

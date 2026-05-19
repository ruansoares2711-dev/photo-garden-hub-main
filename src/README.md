# Arquitetura em camadas

```
src/
├── application/   → bootstrap (cria o router e amarra tudo)
├── config/        → variáveis e configurações globais (env, site, storage)
├── controller/    → componentes de página (recebem ações do usuário)
│   └── pages/
├── dto/           → Data Transfer Objects (entradas/saídas entre camadas)
├── model/         → entidades de domínio (Photo, Cart, Purchase, User…)
├── repository/    → acesso a dados (Supabase, storage, RPC)
├── service/       → regras de negócio (orquestra controller ↔ repository)
├── server/        → server functions (TanStack Start, executa no servidor)
├── routes/        → rotas finas — apenas montam a página delegando ao controller
├── components/    → componentes de UI compartilhados (Header, PhotoCard, ui/*)
├── hooks/         → hooks React reutilizáveis (useAuth)
└── integrations/  → SDK/clients gerados (Supabase) — NÃO editar
```

## Fluxo

```
rota (src/routes/*)  →  controller (src/controller/pages/*)
        ↓
     service (regras de negócio)
        ↓
   repository (dados/storage/RPC)
        ↓
  integrations/supabase  ⇄  Lovable Cloud
```

Server functions (`src/server/*.functions.ts`) representam endpoints
seguros (token MP, service role) e são chamadas a partir dos services
quando há lógica que precisa rodar no backend.

## Regras
- **Controllers** não conversam com `supabase` direto. Sempre via service.
- **Services** chamam repositories e/ou server functions; nunca tocam DOM.
- **Repositories** retornam dados tipados pelo `model/`.
- **DTOs** descrevem trocas entre camadas (especialmente client ↔ server fn).
- **Config** centraliza variáveis (`VITE_*`) — sem segredos.

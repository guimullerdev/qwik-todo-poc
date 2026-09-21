# Plano de Estudos — Qwik (a partir do `qwik-todo-poc`)

> Branch: `estudos/qwik-deep-dive` · Criado em 2026-09-21
> Repositório: https://github.com/guimullerdev/qwik-todo-poc — **⚠️ PÚBLICO**

---

## 0. Diagnóstico da POC atual

### Stack instalada

> Atualizado em 2026-09-21 (PR #1): toda a stack foi para a última versão estável.

| Item                                           | Antes      | Agora          | Observação                             |
| ---------------------------------------------- | ---------- | -------------- | -------------------------------------- |
| `@builder.io/qwik`                             | `^1.16.0`  | **`^1.20.0`**  | última estável                         |
| `@builder.io/qwik-city`                        | `^1.16.0`  | **`^1.20.0`**  | última estável                         |
| `eslint-plugin-qwik`                           | `^1.16.0`  | **`^1.20.0`**  |                                        |
| Qwik 2 (`@qwik.dev/core` / `@qwik.dev/router`) | não usado  | não usado      | `2.0.0-beta.43` — ver Fase 5           |
| Tailwind CSS                                   | `^4.1.4`   | **`^4.3.3`**   |                                        |
| Vite                                           | `7.1.0`    | **`^7.3.6`**   | 🔒 segurado: Qwik 1.20 pede `>=5 <8`   |
| TypeScript                                     | `5.4.5`    | **`^5.9.3`**   | 🔒 segurado: ts-eslint pede `<6.1.0`   |
| ESLint                                         | `9.32.0`   | **`^10.11.0`** |                                        |
| Prettier                                       | `3.6.2`    | **`^3.9.8`**   |                                        |
| `@types/node`                                  | `20.19.0`  | **`^24.13.6`** | alinhado ao Node local                 |
| Node (`.nvmrc`)                                | `v22.15.0` | `v22.15.0`     | local roda `v24.13.1` ⚠️ ainda diverge |

**Por que Vite e TypeScript não foram para o "latest absoluto":** os peer deps proíbem.
`@builder.io/qwik@1.20.0` declara `vite: ">=5 <8"` (Vite 8 existe, mas não é suportado)
e `typescript-eslint@8.70.1` declara `typescript: ">=4.8.4 <6.1.0"` (TS 7 existe, mas não é suportado).
Subir qualquer um dos dois exige esperar Qwik 2 / typescript-eslint 9.

### O que existe hoje

```
src/
├── root.tsx                       QwikCityProvider + <head>/<body>
├── routes/
│   ├── layout.tsx                 <main><Slot/></main> + useServerTimeLoader (NÃO USADO)
│   └── index.tsx                  página única do Todo
├── components/
│   ├── todo-input.tsx             input + botão adicionar
│   ├── todo-item.tsx              checkbox + texto + remover
│   ├── todo-filter.tsx            all / active / completed
│   └── router-head/router-head.tsx
├── hooks/useTodos.ts              useSignal + useComputed$ + 5 ações em $()
├── store/todos.ts                 createContextId (NÃO USADO)
└── types/index.ts                 Todo, Filter
```

### Conceitos Qwik que a POC já demonstra ✅

- `component$()` e o lazy-loading boundary do `$`
- `useSignal()` como estado reativo primário
- `useComputed$()` para derivados (`filteredTodos`, `stats`)
- `$()` para serializar handlers (`addTodo`, `toggleTodo`, ...)
- `bind:value` (two-way binding nativo do Qwik, sem `onChange` manual)
- `onClick$` / `onChange$` — listeners serializados no HTML
- `DocumentHead` para SEO por rota
- Roteamento por diretório do Qwik City + `<Slot/>` em layout

### O que **falta** e é justamente o diferencial do Qwik ❌

Esta é a observação mais importante do diagnóstico: **a POC é 100% client-side.**
Ela usa Qwik como se fosse React. Nada aqui prova a tese do framework.

| Lacuna                           | Impacto na apresentação                                                    |
| -------------------------------- | -------------------------------------------------------------------------- |
| Nenhum `routeLoader$`            | Não mostra dados vindos do servidor sem API/fetch client                   |
| Nenhum `routeAction$` / `<Form>` | Não mostra **progressive enhancement** (funcionar sem JS) — o efeito "uau" |
| Nenhum `server$`                 | Não mostra RPC/streaming type-safe                                         |
| Sem persistência                 | Recarregar a página apaga tudo — nem localStorage                          |
| Sem adapter                      | `npm run deploy` é um `echo` placeholder                                   |
| Sem testes                       | —                                                                          |

### Bugs / anti-patterns a corrigir (ótimos exemplos didáticos)

1. **`src/routes/index.tsx:11` — `useVisibleTask$` para semear dados.**
   A doc oficial é explícita: `useVisibleTask$` **não deve** ser usado para buscar/carregar dados —
   ele roda só no browser, força download de JS ansiosamente e perde o SSR.
   → Trocar por `routeLoader$` (servidor) ou `useTask$`.

2. **`src/store/todos.ts` — código morto.**
   `TodoContext` é criado com `createContextId`, mas `useContextProvider`/`useContext`
   nunca são chamados. Ou implementa Context de verdade, ou remove.

3. **`src/routes/layout.tsx:5` — `useServerTimeLoader` declarado e nunca consumido.**
   Ironia: o único `routeLoader$` do projeto está lá e não é usado.

4. **`src/components/todo-input.tsx:19` — `onKeyPress$`.**
   `keypress` é um evento DOM **deprecado**. → `onKeyDown$`.

5. ~~**Props de callback tipadas como função nua.**~~ ✅ **CORRIGIDO no PR #1.**
   `onAddTodo: (text: string) => void` recebia na prática um QRL, o que disparava
   5 erros de `qwik/valid-lexical-scope`. Como `qwik build` roda `lint` no pipeline,
   **o projeto não buildava desde o commit inicial**. Agora tipado como `QRL<(text: string) => void>`.
   (`PropFunction<T>` é alias de `QRL<T>` no Qwik 1.x — ambos funcionam.)

6. **`.nvmrc` (v22.15.0) diverge do Node local (v24.13.1).** Ainda em aberto.

---

## 1. Roteiro de estudos

Cada fase tem: **o que ler** (doc oficial) → **o que codar nesta POC** → **critério de "aprendi"**.

### Fase 1 — Os fundamentos que não existem em React

📖 https://qwik.dev/docs/concepts/resumable/ · https://qwik.dev/docs/concepts/think-qwik/
📖 https://qwik.dev/docs/guides/qwik-nutshell/ (leia inteiro, é o melhor resumo)

**Resumabilidade vs Hidratação.** A citação-chave da doc:

> "All other frameworks' hydration replays all the application logic on the client.
> Qwik instead pauses execution on the server, and resumes execution on the client."

- Hidratação é cara por **dois** motivos: baixar o código de todos os componentes da página
  **e** re-executar os templates para redescobrir onde estão os listeners.
- Qwik serializa o listener direto no HTML:
  `<button on:click="./chunk.js#handler_symbol">click me</button>`
- Um único script global (o **Qwikloader**, ~1KB) intercepta o evento e baixa só aquele chunk.
- Resultado: startup **O(1)** — independente do tamanho do app. React/Next é **O(n)**.

**As regras do `$`.** O `$` não é açúcar sintático: é uma instrução para o optimizer
quebrar o código num chunk lazy. Isso impõe regras de captura:

```ts
// ✅ pode capturar: imports, top-level, e valores serializáveis
// string, number, boolean, null, undefined, Array, Object, Date, RegExp,
// Map, Set, BigInt, Promise, Error, JSX, Signal, Store, HTMLElement
const handler = $(() => console.log(count.value));

// ❌ não pode capturar instância de classe custom, função não-$, closure não-serializável
const svc = new MeuServico();
const ruim = $(() => svc.faz()); // quebra na serialização
```

**Regra de hooks:** qualquer `useX` só dentro de `component$`, sempre no top level —
nunca em `if` ou loop (igual React, mas pelo motivo oposto: ordem de serialização).

✅ **Exercício:** rode `npm run build`, abra `dist/build/` e conte os chunks.
Identifique qual chunk corresponde ao `onClick$` do botão "Limpar Concluídas".
Abra a página buildada, veja o atributo `on:click` no HTML.

---

### Fase 2 — Reatividade: signals, stores, tasks

📖 https://qwik.dev/docs/components/state/ · https://qwik.dev/docs/components/tasks/

| API                              | Quando usar                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `useSignal(v)`                   | **Padrão.** Um valor reativo. Use sempre que puder.                                     |
| `useStore(obj, { deep: true })`  | Objeto/array reativo. `deep` para reatividade aninhada.                                 |
| `useComputed$()`                 | Derivado **síncrono**. Lazy, cacheado. (Já usado na POC ✅)                             |
| `useTask$()`                     | Efeito que roda **no servidor E no cliente**, antes do render. `track()` para reagir.   |
| `useVisibleTask$()`              | Só browser, **depois** do render. DOM/`window`/libs de terceiros. **Nunca para fetch.** |
| `useResource$()` + `<Resource/>` | Dado **assíncrono** com estados loading/resolved/rejected + streaming.                  |

```ts
// useTask$ com track: roda de novo quando `filter.value` muda
useTask$(({ track }) => {
  track(() => filter.value);
  localStorage.setItem("filter", filter.value); // precisa de guard isBrowser!
});
```

Use `isServer` / `isBrowser` de `@builder.io/qwik/build` — nunca `typeof window`.

✅ **Exercício nesta POC:**

1. Remover o `useVisibleTask$` do `index.tsx`.
2. Adicionar persistência em `localStorage` com `useVisibleTask$` (aqui sim é o caso certo:
   API de browser, pós-render) + `useTask$` com `track` para salvar a cada mudança.
3. Converter `useTodos` para usar `useStore({ deep: true })` e comparar o DX.

---

### Fase 3 — Qwik City / Router: onde o Qwik ganha o jogo

📖 https://qwik.dev/docs/routing/ · https://qwik.dev/docs/route-loader/ · https://qwik.dev/docs/action/

**`routeLoader$`** — roda **só no servidor**, antes do render. Retorna um `Signal` readonly.
Substitui `useEffect + fetch` inteiro. Sem waterfall, sem estado de loading no client.

**`routeAction$` + `<Form>`** — o argumento mais forte contra React.
O `<Form>` do Qwik é um `<form>` HTML de verdade. **Funciona com JavaScript desligado.**
Com JS, ele intercepta e vira SPA. Isso é progressive enhancement grátis.

```tsx
import { routeAction$, Form, zod$, z } from "@builder.io/qwik-city";

export const useAddTodo = routeAction$(
  async (data, { cookie }) => {
    const todo = await db.todos.add(data.text);
    return { success: true, todo };
  },
  zod$({ text: z.string().min(1, "Tarefa não pode ser vazia") }),
);

export default component$(() => {
  const action = useAddTodo();
  return (
    <Form action={action}>
      <input name="text" />
      {action.value?.failed && <p>{action.value.fieldErrors?.text}</p>}
      <button disabled={action.isRunning}>Adicionar</button>
    </Form>
  );
});
```

Estado da action: `action.value` · `action.isRunning` · `action.submit()` · `action.formData`.
`routeAction$` = escopado à rota · `globalAction$` = disponível no app todo.

**`server$`** — RPC type-safe. Chama do client, executa no server. Args e retorno serializáveis.
Suporta **streaming** via async generator (`function* `) — ótimo para feed ao vivo / IA.

**Outros:** `useNavigate()`, `useLocation()` (params + `url.searchParams`), `<Link>` (SPA),
`onRequest`/`onGet` para middleware, `validator$` para validação custom.

✅ **Exercício:** migrar a POC inteira para servidor —
`routeLoader$` lista os todos, `routeAction$` + `<Form>` adiciona/toggla/remove,
filtro via `?filter=active` na URL (`useLocation().url.searchParams`).
**Critério de aprovação: desligue o JS no DevTools. O app ainda tem que funcionar.**

---

### Fase 4 — Avançado

📖 https://qwik.dev/docs/components/context/ · https://qwik.dev/docs/advanced/speculative-module-fetching/
📖 https://qwik.dev/docs/deployments/ · https://qwik.dev/docs/labs/insights/

- **Context**: `createContextId` → `useContextProvider` → `useContext`.
  (Terminar o `src/store/todos.ts` que está pela metade.)
- **Speculative module fetching**: o Qwik pré-busca em background os chunks que o usuário
  _provavelmente_ vai precisar, usando um service worker. Por isso o lazy loading não "pisca".
- **Qwik Insights**: coleta dados reais de uso em produção e **reordena os bundles**
  conforme o comportamento dos usuários. Não existe equivalente em React.
- **Adapters / deploy**: `npm run qwik add` → Cloudflare Pages, Vercel Edge, Netlify,
  Node/Express, Deno, Bun, ou **SSG estático**.
- **Optimizer**: entender como o Vite plugin extrai cada `$` em um símbolo exportado.

---

### Fase 5 — Novidades recentes: Qwik 2.0 (beta.43)

📖 https://qwik.dev/docs/ · https://www.builder.io/blog/qwik-2-coming-soon

> Status em set/2026: **beta** (`2.0.0-beta.43`). A linha 1.x estável está em **1.20.0**.
> Para a apresentação: mostre como "o que vem aí", não como produção.

**1. Renomeação dos pacotes (breaking change principal)**

| Qwik 1.x                 | Qwik 2.0           |
| ------------------------ | ------------------ |
| `@builder.io/qwik`       | `@qwik.dev/core`   |
| `@builder.io/qwik-city`  | `@qwik.dev/router` |
| `@builder.io/qwik-react` | `@qwik.dev/react`  |

Há um CLI de migração planejado para automatizar o rename.

**2. `useAsyncComputed$()` — API nova**
Signal reativo que se atualiza sozinho quando uma operação assíncrona resolve.
Preenche o buraco entre `useComputed$` (síncrono) e `useResource$` (verboso).

**3. `useSerializer$()` — API nova**
Permite que libs de terceiros definam como seus dados atravessam a fronteira server→client.
Necessário porque **em v2 os loaders não são mais serializados por padrão**.

**4. `routeLoader$` agora é `AsyncSignal`**

- `value.failed` **deixa de existir**. Erro fica em `error`, e ler `value` **lança** o erro.
- `routeLoader$` **não pode mais ler estado de action** — isso torna loaders cacheáveis
  e previsíveis.

**5. HTML mais enxuto**
Os comment nodes que o Qwik injetava para rastreamento interno foram **removidos**.
Isso + loaders não-serializados = payload de HTML bem menor.

**6. Validação de nesting de HTML no build**
`<p>` não pode mais conter `<div>`, etc. O build reclama. Força correção semântica.

**7. Novo task scheduler**
Apps carregam e respondem mais rápido, com ganho maior em dispositivos de baixo custo e mobile.

✅ **Exercício:** criar uma branch paralela, migrar a POC para `@qwik.dev/core` +
`@qwik.dev/router` e medir a diferença no tamanho do HTML SSR (`curl` + `wc -c`).
Isso rende um slide com número concreto.

---

## 2. Caso de uso para a apresentação

### 🎯 "TaskFlow" — board de tarefas da equipe

Evolução natural da POC atual, escolhido porque **cada feature existe para expor uma
vantagem do Qwik que o React não consegue igualar**. Não é um app bonito: é um argumento.

| #   | Feature                                      | O que prova                                                 | API Qwik                           |
| --- | -------------------------------------------- | ----------------------------------------------------------- | ---------------------------------- |
| 1   | Lista de tarefas vinda do servidor           | Zero `useEffect`, zero waterfall, zero spinner              | `routeLoader$`                     |
| 2   | Form de criação que **funciona sem JS**      | Progressive enhancement — React não faz isso                | `routeAction$` + `<Form>` + `zod$` |
| 3   | Filtro/busca na URL (`?status=active&q=bug`) | Estado no servidor, URL compartilhável, back/forward nativo | `useLocation()` + `<Link>`         |
| 4   | Board com 200+ cards                         | Startup O(1) mesmo com muito DOM                            | resumabilidade                     |
| 5   | Modal de detalhe pesado (editor rich text)   | Código só baixa **no clique** — nunca antes                 | lazy `$` boundary                  |
| 6   | Feed de atividade em streaming               | RPC type-safe com streaming                                 | `server$` async generator          |
| 7   | Gráfico de burndown (lib React: Recharts)    | **Migração incremental** de React                           | `qwikify$` + `client:visible`      |
| 8   | Optimistic UI no toggle                      | Qwik também faz UX moderna                                  | `useSignal` + `action.submit()`    |

### 💥 Os três momentos "uau" da apresentação

**1. O DevTools Network vazio.**
Abra o TaskFlow com 200 cards. Aba Network, filtro JS. Carregado: ~1KB (o Qwikloader).
Abra o equivalente em Next.js ao lado: 80–150KB+ de JS antes de qualquer interação.
Clique em um botão no Qwik → aparece **um** chunk de ~2KB. É o lazy loading acontecendo ao vivo.

**2. Desligue o JavaScript.**
DevTools → Settings → Disable JavaScript. Recarregue. **O formulário ainda adiciona tarefas.
O filtro ainda filtra.** A mesma coisa em React/Next com Client Components: página morta.

**3. O gráfico React dentro do Qwik.**
Mostre o `qwikify$` com `client:visible`: role a página e veja no Network o React
(e só ele) sendo baixado no momento em que o gráfico entra na viewport.
Argumento de venda: "não precisa reescrever tudo de uma vez".

### Estrutura de arquivos proposta

```
src/routes/
├── layout.tsx                  shell + nav
├── index.tsx                   redirect → /board
└── board/
    ├── index.tsx               routeLoader$ (tarefas) + routeAction$ (criar/toggle/remover)
    ├── [id]/index.tsx          detalhe, rota lazy
    └── activity.tsx            server$ streaming
src/components/
├── task-card.tsx
├── task-form.tsx               <Form> progressive
├── filter-bar.tsx              searchParams, sem estado client
└── burndown-chart.tsx          qwikify$(RechartsChart)
src/lib/db.ts                   SQLite/JSON — o ponto é ser server-only
```

---

## 3. Qwik vs React — material de comparação

### Tabela comparativa

| Dimensão                    | React / Next.js                                                        | Qwik                                                      |
| --------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| **Modelo de startup**       | Hidratação: baixa + re-executa tudo → **O(n)**                         | Resumabilidade: retoma do HTML → **O(1)**                 |
| **JS no primeiro load**     | Bundle do framework + componentes da página                            | ~1KB (Qwikloader)                                         |
| **Lazy loading**            | Manual: `React.lazy` + `Suspense` em pontos escolhidos                 | Automático: **todo** `$` é um boundary                    |
| **Unidade de lazy**         | Componente                                                             | Função / handler individual                               |
| **Estado reativo**          | `useState` + re-render do componente                                   | Signals + atualização cirúrgica do DOM                    |
| **Re-render**               | Componente inteiro re-executa; precisa de `memo`/`useCallback`         | Não re-executa; só o nó do DOM que leu o signal muda      |
| **Memoização**              | Responsabilidade do dev (`useMemo`, `useCallback`, `memo`)             | Desnecessária — não existe re-render em cascata           |
| **Fetch de dados**          | `useEffect` + fetch, ou RSC / Server Actions                           | `routeLoader$` / `server$` — server-only por construção   |
| **Forms sem JS**            | Não funciona com Client Components; Server Actions ajudam parcialmente | `<Form>` + `routeAction$` funcionam nativamente           |
| **Fronteira server/client** | `'use client'` / `'use server'` — arquivo inteiro                      | `$` — **por função**                                      |
| **Serialização**            | Props de RSC                                                           | Estado + listeners + grafo de componentes, direto no HTML |
| **Custo de crescer o app**  | Mais código = startup mais lento                                       | Startup praticamente constante                            |
| **Ecossistema**             | Gigante                                                                | Pequeno — mas consome React via `qwikify$`                |
| **Curva de aprendizado**    | Conhecida                                                              | Regras de serialização do `$` são o obstáculo real        |
| **Maturidade**              | Massiva, anos de produção                                              | 1.20.0 estável; 2.0 em beta                               |

### O mesmo código, lado a lado

**Buscar dados**

```tsx
// React
const [todos, setTodos] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  fetch("/api/todos")
    .then((r) => r.json())
    .then((d) => {
      setTodos(d);
      setLoading(false);
    });
}, []);
if (loading) return <Spinner />;
```

```tsx
// Qwik — sem endpoint, sem loading, sem waterfall
export const useTodos = routeLoader$(() => db.todos.findAll());
const todos = useTodos(); // já resolvido no SSR
```

**Derivar valor**

```tsx
// React — precisa de useMemo para não recalcular a cada render
const active = useMemo(() => todos.filter((t) => !t.done), [todos]);
```

```tsx
// Qwik — lazy e cacheado por construção, sem array de dependências
const active = useComputed$(() => todos.value.filter((t) => !t.done));
```

**Handler de evento**

```tsx
// React — vai no bundle da página, custa hidratação
<button onClick={() => remove(id)}>✕</button>
```

```tsx
// Qwik — vira on:click="chunk.js#s_abc" no HTML; o chunk só baixa no clique
<button onClick$={() => remove(id)}>✕</button>
```

### Onde ser honesto na apresentação (isto dá credibilidade)

- **Ecossistema.** React tem ordens de magnitude mais libs, exemplos, vagas e respostas no StackOverflow.
- **Serialização é uma restrição real.** Não dá para capturar instância de classe num `$`.
  Isso muda como você arquiteta serviços — e frustra quem vem de React.
- **Qwik 2.0 ainda é beta** e já quebrou nomes de pacote e semântica de loader.
- **O ganho não é universal.** Em um dashboard interno atrás de login, com sessão longa,
  a diferença de startup importa pouco. O Qwik brilha em: e-commerce, landing pages, conteúdo,
  qualquer coisa com muito tráfego mobile e first-visit.
- **`qwikify$` tem custo.** Cada componente qwikificado é um app React isolado:
  estilos duplicam, contexto não herda, estado não compartilha.
  A doc recomenda qwikificar **ilhas largas**, não folhas individuais.

---

## 4. Checklist de execução

### Preparação

- [x] `yarn install` com a stack atualizada — OK, sem conflito de peer deps
- [x] `yarn build` passando (type check + lint + client modules)
- [ ] `nvm use` (alinhar `.nvmrc` v22.15.0 ↔ Node local v24.13.1)
- [ ] `yarn start` — confirmar a POC no browser (SSR já validado via curl: HTTP 200)
- [ ] Decidir se o repo continua público (ver seção 5)

### Limpeza da POC (Fase 1–2)

- [ ] Trocar `useVisibleTask$` de seed por `routeLoader$` em `src/routes/index.tsx`
- [ ] Implementar ou remover `TodoContext` em `src/store/todos.ts`
- [ ] Usar ou remover `useServerTimeLoader` em `src/routes/layout.tsx`
- [ ] `onKeyPress$` → `onKeyDown$` em `src/components/todo-input.tsx`
- [x] Tipar callbacks como `QRL<...>` — feito no PR #1
- [x] `yarn lint` sem erros (resta 1 warning: o `useVisibleTask$` acima)

### Construção do TaskFlow (Fase 3)

- [ ] `routeLoader$` + `routeAction$` + `<Form>` + `zod$`
- [ ] Filtro via `searchParams`
- [ ] **Teste do JS desligado** ← o momento da apresentação
- [ ] `server$` com streaming
- [ ] `qwikify$` de um componente React

### Material da apresentação

- [ ] Screenshots do Network: Qwik vs Next.js (mesma feature)
- [ ] Lighthouse dos dois lado a lado
- [ ] Vídeo de 10s do form funcionando sem JS
- [ ] Slide de números: KB de JS, TTI, tamanho do HTML SSR
- [ ] Slide "quando NÃO usar Qwik" (credibilidade)

---

## 5. Sobre o repositório

**O repo é PÚBLICO**, não privado:

```
https://github.com/guimullerdev/qwik-todo-poc  →  visibility: PUBLIC
```

O `"private": true` no `package.json` **não** tem relação com isso — ele só impede
publicação acidental no npm.

Se quiser torná-lo privado antes de continuar:

```bash
gh repo edit guimullerdev/qwik-todo-poc --visibility private --accept-visibility-change-consequences
```

Sendo público: não commite tokens, connection strings ou dados de cliente no TaskFlow.
Use `.env.local` (já coberto pelo `.gitignore`).

---

## 6. Links oficiais

| Tema                                     | Link                                           |
| ---------------------------------------- | ---------------------------------------------- |
| Docs                                     | https://qwik.dev/docs/                         |
| Qwik in a nutshell (melhor resumo único) | https://qwik.dev/docs/guides/qwik-nutshell/    |
| Resumabilidade                           | https://qwik.dev/docs/concepts/resumable/      |
| Think Qwik                               | https://qwik.dev/docs/concepts/think-qwik/     |
| State (signals/stores)                   | https://qwik.dev/docs/components/state/        |
| Tasks & lifecycle                        | https://qwik.dev/docs/components/tasks/        |
| routeLoader$                             | https://qwik.dev/docs/route-loader/            |
| routeAction$ / Form                      | https://qwik.dev/docs/action/                  |
| server$                                  | https://qwik.dev/docs/server$/                 |
| Integração React (`qwikify$`)            | https://qwik.dev/docs/integrations/react/      |
| Cookbook                                 | https://qwik.dev/docs/cookbook/                |
| Deployments / adapters                   | https://qwik.dev/docs/deployments/             |
| Qwik Insights                            | https://qwik.dev/docs/labs/insights/           |
| Blog "Towards Qwik 2.0"                  | https://www.builder.io/blog/qwik-2-coming-soon |
| Qwik 2.0 Beta (APIs novas)               | https://www.learn-qwik.com/blog/qwik-2-beta/   |
| GitHub                                   | https://github.com/QwikDev/qwik                |

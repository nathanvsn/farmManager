# Próximos Passos - Farming Manager

## 🚀 Prioridade Alta (Core Gameplay)

### 1. Silo Modal & Gestão de Produção
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Sistema completo de armazenamento e gestão de produção agrícola

**Tarefas:**
- [ ] Criar `SiloModal.tsx` com tabs:
  - Seeds (sementes em estoque)
  - Produce (colheitas armazenadas)
  - Statistics (estatísticas de produção)
- [ ] Backend: Adicionar coluna `silo_inventory` JSONB em `users`
- [ ] Lógica de dedução de sementes ao plantar
- [ ] Integrar com TopBar (botão "Silo" já tem placeholder)

**Impacto**: Fecha o loop de gameplay completo (plantar → colher → armazenar)

---

### 2. Sistema de Colheita
**Status**: Placeholder em `farmingService.ts`  
**Complexidade**: Média  
**Descrição**: Implementar lógica completa de colheita com cálculo de yield

**Tarefas:**
- [ ] Completar função `farmingService.harvest()`
- [ ] Cálculo de yield: `area_ha × seed.yield_kg_ha × (0.8-1.2 random)`
- [ ] Adicionar produção ao silo do usuário
- [ ] Resetar condição do terreno: `growing → bruto`
- [ ] UI: Botão "Colher" quando `condition === 'mature'`
- [ ] Validação de equipamento (colheitadeira)

**Fórmula de Yield:**
```typescript
const baseYield = area_ha * crop.yield_kg_ha;
const randomFactor = 0.8 + Math.random() * 0.4; // 80-120%
const finalYield = Math.floor(baseYield * randomFactor);
```

---

### 3. Mercado (Venda de Produção)
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Sistema de venda de colheitas com flutuação de preços

**Tarefas:**
- [ ] Criar `MarketModal.tsx`
- [ ] Tabela `market_prices` com preços dinâmicos
- [ ] API: `GET /api/game/market` (preços atuais)
- [ ] API: `POST /api/game/market/sell` (vender produção)
- [ ] Flutuação de preços baseada em:
  - Oferta/demanda (quantas pessoas venderam)
  - Sazonalidade (dia da semana simulado)
  - Eventos aleatórios (clima, pragas)

**Exemplo de Preços:**
```typescript
{
  "soja": { base: 80, current: 92, trend: "up" },
  "milho": { base: 45, current: 41, trend: "down" }
}
```

---

### 4. Sistema de Crescimento com Timer Real
**Status**: Parcial (timer existe mas não monitora crescimento)  
**Complexidade**: Baixa  
**Descrição**: Atualizar condição de `growing` para `mature` automaticamente

**Tarefas:**
- [ ] Job backend (ou API route chamada periodicamente)
- [ ] Query: `UPDATE lands SET condition='mature' WHERE operation_end < NOW() AND condition='growing'`
- [ ] Frontend: Auto-refresh da lista de terrenos ao detectar maturação
- [ ] Notificação visual quando colheita estiver pronta

**Alternativa Simples:**
- Frontend checa `operation_end` e chama `/api/game/farm` com `type: 'mature'`

---

## 🎨 Melhorias de UX/UI

### 5. Notificações em Tempo Real
**Status**: Não Implementado  
**Complexidade**: Baixa  
**Descrição**: Toast notifications para eventos importantes

**Tarefas:**
- [ ] Biblioteca: `react-hot-toast` ou `sonner`
- [ ] Notificar em:
  - Operação concluída
  - Colheita pronta
  - Dinheiro insuficiente
  - Zoom muito distante (Discovery Mode)
- [ ] Estilo customizado com tema do jogo

---

### 6. Tutorial Interativo
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Onboarding para novos jogadores

**Tarefas:**
- [ ] Biblioteca: `react-joyride` ou custom
- [ ] Steps:
  1. "Compre seu primeiro terreno"
  2. "Visite a Loja e compre um trator"
  3. "Acople a roçadeira no Celeiro"
  4. "Limpe seu terreno"
  5. "Acompanhe o progresso no painel lateral"
- [ ] Armazenar progresso em `localStorage`

---

### 7. Miniaturas de Terrenos no Overview
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Mini mapa de cada terreno no `LandsOverviewSidebar`

**Tarefas:**
- [ ] Renderizar Leaflet mini maps estáticos
- [ ] Highlight do polígono do terreno
- [ ] Alternativa: Screenshot via Canvas ou imagem estática

---

### 8. Animações e Feedback Visual
**Status**: Parcial (alguns elementos têm)  
**Complexidade**: Baixa  
**Descrição**: Melhorar microinterações

**Tarefas:**
- [ ] Animação de "compra" (confete, counter up)
- [ ] Pulso visual quando operação concluída
- [ ] Transições suaves entre estados do terreno
- [ ] Skeleton loaders em vez de "Carregando..."

---

## ⚙️ Otimizações Técnicas

### 9. Caching de Terrenos
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Reduzir requisições ao banco

**Tarefas:**
- [ ] Implementar Redis para cache de GeoJSON
- [ ] Cache key: `lands:bbox:{hash}`
- [ ] TTL: 10 minutos
- [ ] Invalidar cache ao comprar/vender terreno naquela área

---

### 10. Paginação no Overview Sidebar
**Status**: Não Implementado (mostra tudo)  
**Complexidade**: Baixa  
**Descrição**: Evitar lag com muitos terrenos

**Tarefas:**
- [ ] Virtualização via `react-window`
- [ ] Ou paginação simples (10 terrenos por vez)
- [ ] Scroll infinito

---

### 11. Web Workers para Cálculos Pesados
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Processar GeoJSON em worker separado

**Tarefas:**
- [ ] Worker para calcular progresso dos timers
- [ ] Worker para processar geometrias grandes
- [ ] Evitar freeze da UI

---

### 12. Service Worker & PWA
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: App instalável e com cache offline

**Tarefas:**
- [ ] Configurar Next.js PWA
- [ ] Manifest com ícones
- [ ] Cache de assets estáticos
- [ ] Offline mode parcial (mostrar terrenos já carregados)

---

## 🎮 Novas Features de Gameplay

### 13. Sistema de Clima
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Clima dinâmico que afeta operações

**Tarefas:**
- [ ] Integração com API meteorológica (OpenWeatherMap)
- [ ] Impossibilitar operações na chuva/neve
- [ ] Bonus de yield em clima ideal
- [ ] UI: Indicador de clima no TopBar

---

### 14. Eventos Aleatórios
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Pragas, doenças, eventos climáticos

**Tarefas:**
- [ ] Tabela `events` com:
  - Tipo (praga, geada, mercado)
  - Impacto (yield reduzido, preço alterado)
  - Duração
- [ ] Modal de notificação do evento
- [ ] Possibilidade de mitigar (comprar pesticida, seguro)

---

### 15. Contratos & Missões
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Sistema de objetivos com recompensas

**Tarefas:**
- [ ] Tabela `contracts`:
  - "Produza 500kg de soja em 7 dias"
  - "Compre 3 terrenos consecutivos"
- [ ] Recompensas: dinheiro bônus, diamantes
- [ ] UI: Painel de Contratos Ativos

---

### 16. Sistema de Níveis & XP
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Progressão do jogador com desbloqueios

**Tarefas:**
- [ ] Tabela `users`: adicionar `level`, `xp`
- [ ] XP por:
  - Comprar terreno
  - Completar operação
  - Vender produção
- [ ] Desbloqueio de equipamentos por nível
- [ ] Bonuses: desconto na loja, yield aumentado

---

### 17. Multiplayer / Mercado Global
**Status**: Não Implementado  
**Complexidade**: Muito Alta  
**Descrição**: Jogadores competem/cooperam

**Tarefas:**
- [ ] Leaderboard de produção
- [ ] Mercado global (preços afetados por TODOS jogadores)
- [ ] Trade de equipamentos entre jogadores
- [ ] Co-op: contratar máquinas de outros jogadores
- [ ] WebSockets para updates em tempo real

---

### 18. Sistema de Expansão
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Melhorias permanentes

**Tarefas:**
- [ ] Tabela `upgrades`:
  - Silo maior (armazenar mais)
  - Garagem expandida (mais tratores)
  - Laboratório (pesquisa de sementes melhores)
- [ ] UI: "Upgrade" modal
- [ ] Custos crescentes

---

### 19. Empréstimos & Crédito Rural
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Sistema bancário para investimento

**Tarefas:**
- [ ] Tabela `loans`:
  - Valor, juros, parcelas
  - Status (ativo, quitado)
- [ ] Parcelas debitadas automaticamente
- [ ] Penalidade por inadimplência
- [ ] UI: Banco modal

---

### 20. Animais & Pecuária
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Expandir para criação de animais

**Tarefas:**
- [ ] Novos tipos de terrenos (pasto)
- [ ] Compra de animais (gado, galinhas)
- [ ] Sistema de alimentação e cuidados
- [ ] Produção (leite, ovos, carne)
- [ ] Novos equipamentos (ordenhadeira, galinheiro)

---

## 🔧 Infraestrutura & DevOps

### 21. Testes Automatizados
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Garantir qualidade do código

**Tarefas:**
- [ ] Unit tests: services (`inventoryService`, `farmingService`)
- [ ] Integration tests: API routes
- [ ] E2E tests: Cypress (fluxo completo de jogo)
- [ ] CI/CD pipeline (GitHub Actions)

---

### 22. Monitoring & Analytics
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Monitorar uso e erros

**Tarefas:**
- [ ] Sentry para error tracking
- [ ] Plausible/Google Analytics para métricas
- [ ] Dashboards de uso:
  - Usuários ativos
  - Terrenos comprados por dia
  - Taxa de conversão (registros → compras)

---

### 23. Database Backups Automatizados
**Status**: Manual  
**Complexidade**: Baixa  
**Descrição**: Proteção de dados

**Tarefas:**
- [ ] Script cron para `pg_dump`
- [ ] Upload para S3/Backblaze
- [ ] Retenção de 30 dias
- [ ] Testes de restore periódicos

---

### 24. Rate Limiting
**Status**: Não Implementado  
**Complexidade**: Baixa  
**Descrição**: Prevenir abuso de API

**Tarefas:**
- [ ] Middleware com `express-rate-limit` ou similar
- [ ] Limites:
  - `/api/lands/survey`: 5 req/min
  - `/api/game/shop`: 20 req/min
  - `/api/auth/login`: 5 req/5min (brute force)

---

## 🎁 Monetização (Opcional)

### 25. Sistema de Diamantes (Premium Currency)
**Status**: Campo existe mas sem uso  
**Complexidade**: Média  
**Descrição**: Moeda premium para compras especiais

**Tarefas:**
- [ ] Loja de Diamantes (pacotes IAP simulados)
- [ ] Usos:
  - Acelerar timers (skip wait)
  - Equipamentos exclusivos
  - Expansões de silo
- [ ] Integração com payment gateway (Stripe)

---

### 26. Passe de Temporada
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Recompensas por jogabilidade ativa

**Tarefas:**
- [ ] Tabela `season_pass`:
  - Tiers (1-50)
  - Recompensas por tier
  - Free vs Premium track
- [ ] XP sazonal (reseta a cada temporada)
- [ ] Itens cosméticos exclusivos

---

## 📱 Mobile & Acessibilidade

### 27. Responsividade Mobile
**Status**: Parcial (desktop-first)  
**Complexidade**: Alta  
**Descrição**: Otimizar para touch

**Tarefas:**
- [ ] Sidebars em bottom sheets no mobile
- [ ] Controles touch-friendly (botões maiores)
- [ ] Gestos: pinch to zoom, swipe to close
- [ ] PWA installable em iOS/Android

---

### 28. Acessibilidade (A11y)
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Tornar acessível para todos

**Tarefas:**
- [ ] Aria labels em todos botões/inputs
- [ ] Navegação por teclado (Tab, Enter)
- [ ] Alto contraste mode
- [ ] Screen reader friendly
- [ ] WCAG 2.1 AA compliance

---

## 🌍 Internacionalização

### 29. i18n (Múltiplos Idiomas)
**Status**: Apenas PT-BR  
**Complexidade**: Alta  
**Descrição**: Suporte para inglês, espanhol, etc.

**Tarefas:**
- [ ] Biblioteca: `next-intl` ou `i18next`
- [ ] Arquivos de tradução: `en.json`, `es.json`, `pt-BR.json`
- [ ] Selector de idioma no TopBar
- [ ] Traduzir:
  - UI strings
  - Nomes de itens (ou manter inglês)
  - Mensagens de erro

---

## 🗺️ Features de Mapa

### 30. Filtros de Terreno
**Status**: Não Implementado  
**Complexidade**: Baixa  
**Descrição**: Filtrar terrenos visíveis

**Tarefas:**
- [ ] Dropdown de filtros:
  - Por tipo (farmland, meadow, orchard)
  - Por tamanho (pequeno/médio/grande)
  - Por preço (faixas)
  - Por condição (bruto/limpo/arado)
- [ ] Aplicar filtro no frontend (não recarregar)

---

### 31. Busca por Localização
**Status**: Não Implementado  
**Complexidade**: Baixa  
**Descrição**: Navegar para endereço/coordenadas

**Tarefas:**
- [ ] Input de busca no mapa
- [ ] Integração com geocoding API (Nominatim)
- [ ] Flyto para localização

---

### 32. Desenhar Áreas Customizadas
**Status**: Não Implementado  
**Complexidade**: Muito Alta  
**Descrição**: Criar terrenos manualmente

**Tarefas:**
- [ ] Leaflet.draw para desenhar polígonos
- [ ] Validação: não sobrepor outros terrenos
- [ ] Cálculo de preço baseado em área
- [ ] Custo premium (diamantes?)

---

## 📊 Estatísticas & Dashboards

### 33. Dashboard do Fazendeiro
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Analytics pessoais

**Tarefas:**
- [ ] Gráficos (Chart.js ou Recharts):
  - Receita ao longo do tempo
  - Produção por cultura
  - Expenses vs Income
- [ ] KPIs:
  - Total de hectares
  - Produtividade média
  - ROI (retorno sobre investimento)

---

### 34. Ranking Global
**Status**: Não Implementado  
**Complexidade**: Baixa  
**Descrição**: Competir com outros jogadores

**Tarefas:**
- [ ] Leaderboards:
  - Maior fazendeiro (área total)
  - Maior produtor (kg colhidos)
  - Mais rico (dinheiro + assets)
- [ ] Atualização diária/semanal

---

## 🔐 Segurança

### 35. Auditoria de Segurança
**Status**: Não Implementado  
**Complexidade**: Alta  
**Descrição**: Review de vulnerabilidades

**Tarefas:**
- [ ] SQL Injection tests (parameterized queries já usam)
- [ ] XSS prevention (React já sanitiza)
- [ ] CSRF tokens (Next.js middleware)
- [ ] Dependency audit: `npm audit fix`
- [ ] Rate limiting (ver item 24)

---

### 36. Logs & Auditoria
**Status**: Básico (console.log)  
**Complexidade**: Média  
**Descrição**: Rastreabilidade de ações

**Tarefas:**
- [ ] Tabela `audit_log`:
  - user_id, action, details, timestamp
- [ ] Logar:
  - Compras de terreno
  - Transações de dinheiro
  - Login/logout
- [ ] Dashboard admin para análise

---

## 🎓 Educacional

### 37. Modo Educativo
**Status**: Não Implementado  
**Complexidade**: Média  
**Descrição**: Ensinar conceitos de agricultura

**Tarefas:**
- [ ] Tooltips explicativos:
  - O que é aragem?
  - Por que rotação de culturas?
- [ ] Quiz mode com recompensas
- [ ] Parceria com instituições agrícolas

---

## 🚀 Launch Checklist

### 38. Preparação para Produção
**Status**: Dev mode  
**Complexidade**: Alta  
**Descrição**: Deploy readiness

**Tarefas:**
- [ ] Domain + SSL certificate
- [ ] Migrar para Vercel/Railway/Render
- [ ] PostgreSQL gerenciado (Supabase, Neon, RDS)
- [ ] Environment variables em prod
- [ ] SEO: meta tags, sitemap, robots.txt
- [ ] Legal: Termos de Uso, Política de Privacidade
- [ ] GDPR compliance (se aplicável)

---

## Priorização Sugerida

### Sprint 1 (2 semanas)
1. ✅ Silo Modal
2. ✅ Sistema de Colheita
3. ✅ Mercado (venda básica)

### Sprint 2 (2 semanas)
4. ✅ Crescimento automático
5. ✅ Notificações toast
6. ✅ Tutorial básico

### Sprint 3 (2 semanas)
7. ✅ Otimizações (cache, paginação)
8. ✅ Testes automatizados (críticos)
9. ✅ Rate limiting

### Sprint 4 (1 semana)
10. ✅ UI polish (animações, feedback)
11. ✅ Mobile responsiveness básico

### Long-term (3+ meses)
- Sistema de Clima
- Multiplayer
- Animais & Pecuária
- Monetização

---

**Última atualização**: 2026-01-06  
**Mantenedor**: Nathan (@nathanitau)

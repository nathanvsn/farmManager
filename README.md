# 🚜 Farm Manager

Um simulador de gestão agrícola desenvolvido com Next.js, PostgreSQL e PostGIS, onde você gerencia sua própria fazenda desde a compra de terrenos até a venda da produção no mercado.

## 🎮 Sobre o Jogo

Farm Manager é um jogo de simulação e estratégia onde você assume o papel de um fazendeiro empreendedor. Comece do zero, compre terrenos, invista em maquinário, plante culturas e venda sua produção para expandir seu império agrícola.

### Objetivo

Transformar-se no maior produtor agrícola da região através da:
- Compra estratégica de terrenos
- Gestão eficiente de recursos e equipamentos
- Produção e venda de commodities agrícolas
- Maximização de lucros através do timing de mercado

## 🌾 Como Jogar

### 1. **Exploração e Compra de Terrenos**
- Use o mapa interativo para explorar terrenos disponíveis
- Clique no botão **"Minhas Terras"** para focar nos seus terrenos
- Use **"Search Area"** para descobrir novos terrenos à venda
- Compare preços, tamanhos e condições antes de comprar

### 2. **Prepare seus Terrenos**
O ciclo de preparação segue esta ordem:
1. **Bruto → Limpar** (use roçadeira ou escavadeira)
2. **Limpo → Arar** (use arado)
3. **Arado → Plantar** (use semeadeira + sementes)

### 3. **Gestão de Recursos**

#### 🏪 Loja
Compre equipamentos e sementes:
- **Tratores**: Base para acoplar implementos
- **Implementos**: Arados, semeadeiras, roçadeiras
- **Máquinas Pesadas**: Escavadeiras, colheitadeiras
- **Sementes**: Soja, Milho (em KG)

#### 🏭 Silo
Gerencie seu estoque:
- **Tab Sementes**: Veja sementes disponíveis
- **Tab Produção**: Produtos colhidos prontos para venda
- **Tab Estatísticas**: Resumo geral do armazenamento

#### 🏪 Mercado
Venda sua produção:
- Preços flutuam baseado em oferta/demanda
- Indicadores de tendência: ↑ (alta), ↓ (baixa), → (estável)
- Venda quando os preços estiverem favoráveis

### 4. **Ciclo de Produção**

```
Comprar Sementes → Plantar → Aguardar Crescimento → Colher → Vender
```

#### Plantar
1. Selecione um terreno "arado"
2. Clique em **"Planejar Plantio"**
3. Escolha maquinário (semeadeira)
4. Selecione a semente
5. Veja o preview:
   - Sementes necessárias
   - Tempo de plantio
   - Tempo de crescimento
   - Produção esperada
   - Receita estimada
6. Confirme o plantio

#### Colher
1. Aguarde a cultura amadurecer (status: "Mature")
2. Selecione uma colheitadeira
3. Colha a produção (vai para o Silo)
4. Terreno volta para "Limpo"

#### Vender
1. Abra o Mercado
2. Compare preços e tendências
3. Venda produtos do seu Silo
4. Receba o dinheiro instantaneamente

## 🛠️ Setup Técnico

### Pré-requisitos
- Node.js 18+
- Docker (para PostgreSQL)
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repo>
cd farmManager
```

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o banco de dados**
```bash
docker-compose up -d
```

4. **Execute as migrações**
```bash
npm run db:migrate
```

5. **Popule o banco com dados iniciais**
```bash
# Adiciona equipamentos e sementes
npx tsx src/scripts/seed_items.ts

# Configura inventário e silo
npx tsx src/scripts/010_add_silo_inventory.ts

# Cria tabela de preços de mercado
npx tsx src/scripts/011_create_market_prices.ts

# Atualiza constraints da tabela lands
npx tsx src/scripts/012_update_lands_condition_constraint.ts
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

7. **Acesse o jogo**
Abra [http://localhost:3000](http://localhost:3000)

## 🎯 Dicas de Gameplay

1. **Comece pequeno**: Compre 1-2 terrenos pequenos primeiro
2. **Invista em equipamento**: Priorize trator + semeadeira + colheitadeira
3. **Diversifique**: Plante diferentes culturas para mitigar riscos
4. **Tempo é dinheiro**: Soja cresce mais rápido (120s), Milho rende mais por hectare
5. **Observe o mercado**: Venda quando a tendência estiver ↑
6. **Escale gradualmente**: Use lucros para comprar mais terrenos

## 🏗️ Stack Tecnológica

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: PostgreSQL 16 + PostGIS
- **Mapas**: Leaflet, React-Leaflet
- **UI/UX**: Lucide Icons, Design System customizado

## 📊 Funcionalidades

- ✅ Sistema de autenticação (JWT)
- ✅ Mapa interativo com PostGIS
- ✅ Sistema de inventário e equipamentos
- ✅ Ciclo completo de farming (limpar → plantar → colher)
- ✅ Silo com gestão de sementes e produção
- ✅ Mercado com flutuação de preços
- ✅ Crescimento automático de culturas
- ✅ Modal de planejamento de plantio
- ✅ Auto-finalização de operações

## 📝 Licença

Este projeto é um protótipo educacional.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, abra uma issue antes de fazer um PR grande.

---

**Desenvolvido com ☕ e 🚜**

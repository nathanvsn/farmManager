# Documentação: Geração de Terrenos (Land Generator)

Esta documentação descreve o funcionamento do módulo de geração procedural de fazendas localizado em `src/lib/landGenerator.ts`.

## 🧠 Como Funciona

O sistema utiliza a estratégia de **"Busca Inversa"**. Ao invés de pegar um quadrado e cortar estradas (que gerava falhas em áreas vazias), nós perguntamos explicitamente ao **OpenStreetMap (OSM)** onde estão as fazendas.

### Fluxo do Algoritmo

1.  **Recebe Bounding Box:** O frontend envia as coordenadas (Norte, Sul, Leste, Oeste) da área visível no mapa.
2.  **Consulta Overpass API:** Fazemos uma requisição para a API do OpenStreetMap pedindo polígonos com tags específicas de agricultura.
3.  **Processamento:**
    *   Converte a resposta XML/JSON do OSM para GeoJSON.
    *   Filtra polígonos muito pequenos (< 5000m²) para evitar "sujeira" no mapa.
    *   Simplifica a geometria (remove excesso de pontos) para otimizar o banco de dados.
    *   Corrige geometrias inválidas (`ST_MakeValid`).
4.  **Persistência:** Salva no banco PostGIS na tabela `lands`.

---

## 🌍 Fontes de Dados (Query Overpass)

Buscamos polígonos (`way` e `relation`) que contenham as seguintes tags:

*   `landuse = farmland` (Plantações genéricas)
*   `landuse = meadow` (Pastos e prados)
*   `landuse = orchard` (Pomares)
*   `landuse = vineyard` (Vinhedos)
*   `landuse = farm` (Fazendas gerais)
*   `natural = grassland` (Campos de grama natural - comum em pastagens não demarcadas)

> **Nota:** Se uma região não tiver nada mapeado no OSM, a geração não criará nenhum terreno.

---

## 🛡️ Robustez e Confiabilidade

A API do Overpass é pública e gratuita, mas as vezes instável. Implementamos mecanismos de defesa:

### 1. Timeout Estendido
A query tem um timeout de **180 segundos** (3 minutos) para lidar com áreas grandes ou servidores lentos.

### 2. Retry com Múltiplos Servidores
Se o servidor principal falhar (Erro 504 ou 429), o código tenta automaticamente os backups:
1.  `overpass-api.de` (Principal)
2.  `overpass.kumi.systems` (Backup)
3.  `maps.mail.ru` (Backup)

### 3. Tratamento de Erros XML
Às vezes, o Overpass retorna uma página de erro HTML/XML ao invés de JSON. O código detecta isso, loga o corpo da resposta para debug e evita que o servidor crashe com `SyntaxError`.

---

## 🛠️ Guia de Manutenção

### Como adicionar novos tipos de terreno?
Edite a string `overpassQuery` em `src/lib/landGenerator.ts`.
Exemplo: Para incluir florestas como áreas cultiváveis (desmatamento), adicione `|forest` na regex:
```javascript
way["landuse"~"^(farmland|meadow|orchard|vineyard|farm|forest)$"](...)
```

### O mapa está vindo vazio, por quê?
1.  **Região não mapeada:** Verifique no site [OpenStreetMap.org](https://www.openstreetmap.org/) se a área tem polígonos desenhados. Se forem apenas linhas (estradas), nada será gerado.
2.  **Timeout:** Se a área for gigantesca (ex: um estado inteiro), o Overpass vai abortar (error 504). Tente áreas menores (zoom in).

### Erro "Geometry type mismatch"
Se o banco reclamar que você tentou inserir `MultiPolygon` em coluna `Polygon`:
*   O código atual já trata isso explodindo MultiPolygons em vários Polígonos simples antes de salvar.
*   Verifique se `ST_MakeValid` está sendo usado na query SQL.

### Como testar manualmente?
1.  Abra o [Overpass Turbo](https://overpass-turbo.eu/).
2.  Cole a query que está no código (removendo os `${buttons}`).
3.  Clique em "Run" para ver o que o OSM retorna naquela região.

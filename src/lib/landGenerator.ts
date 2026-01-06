import { query } from './db';
import osmtogeojson from 'osmtogeojson';
import * as turf from '@turf/turf';
import wellknown from 'wellknown';

interface Bounds {
    south: number;
    west: number;
    north: number;
    east: number;
}

export async function generateLandForBounds(bounds: Bounds) {
    console.log('Iniciando algoritmo "Busca Inversa" (Focar no que É fazenda) para:', bounds);

    // List of Overpass servers to try (Main + Backups)
    const servers = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ];

    // Increase timeout to 180s in query
    const overpassQuery = `
    [out:json][timeout:180];
    (
      way["landuse"~"^(farmland|meadow|orchard|vineyard|farm)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      relation["landuse"~"^(farmland|meadow|orchard|vineyard|farm)$"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      
      way["natural"="grassland"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      relation["natural"="grassland"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
    );
    (._;>;);
    out body;
    `;

    let osmData;
    let lastError;

    // Retry loop
    for (const server of servers) {
        try {
            console.log(`Trying Overpass server: ${server}`);

            // AbortController for client-side timeout (set slightly higher than server timeout)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 190000); // 190s

            const response = await fetch(server, {
                method: 'POST',
                body: overpassQuery,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const text = await response.text();

            if (!response.ok) {
                // If 429 (Too Many Requests) or 504 (Gateway Timeout), try next server
                if (response.status === 429 || response.status === 504) {
                    console.warn(`Server ${server} failed with ${response.status}. Trying next...`);
                    lastError = new Error(`Overpass API error: ${response.statusText}`);
                    continue;
                }
                throw new Error(`Overpass API error: ${response.statusText} \nBody: ${text.substring(0, 500)}`);
            }

            try {
                osmData = JSON.parse(text);
                lastError = null; // Success!
                break; // Exit loop
            } catch (e) {
                console.warn(`Failed to parse JSON from ${server}. content start: ${text.substring(0, 100)}`);
                lastError = new Error(`Invalid JSON from ${server}`);
                continue;
            }

        } catch (err: any) {
            console.warn(`Error connecting to ${server}:`, err.message);
            lastError = err;
            // Continue to next server
        }
    }

    if (!osmData || lastError) {
        console.error('All Overpass servers failed.');
        throw lastError || new Error('Failed to fetch data from any Overpass server');
    }
    const geoJsonData = osmtogeojson(osmData);

    console.log(`Encontradas ${geoJsonData.features.length} áreas potenciais...`);

    let savedCount = 0;

    // 2. Processamento Direto
    // Não precisamos mais cortar nada. O que veio do mapa JÁ É uma fazenda.
    for (const feature of geoJsonData.features) {

        // Garantir que é um Polígono
        if (!feature.geometry || (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon')) {
            continue;
        }

        let polygons = [];
        if (feature.geometry.type === 'MultiPolygon') {
            polygons = feature.geometry.coordinates.map((coords: any) => turf.polygon(coords));
        } else {
            polygons = [turf.polygon(feature.geometry.coordinates as any)];
        }

        for (const poly of polygons) {
            // Calcula área
            const area = turf.area(poly);

            // FILTRO DE QUALIDADE:
            // Ignora pedaços muito pequenos (< 5000m² - meio hectare) para evitar sujeira
            // Se quiser pegar hortas pequenas, diminua para 1000
            if (area < 5000) continue;

            // Simplifica a geometria para não pesar no banco de dados
            const simplifiedField = turf.simplify(poly, { tolerance: 0.00005, highQuality: true });

            const wkt = wellknown.stringify(simplifiedField);

            // Random Condition Logic
            let condition = 'bruto';
            let priceMultiplier = 1.0;
            const rand = Math.random();

            if (rand < 0.70) {
                condition = 'bruto'; // 70%
                priceMultiplier = 1.0;
            } else if (rand < 0.90) {
                condition = 'limpo'; // 20%
                priceMultiplier = 1.15; // +15%
            } else {
                condition = 'arado'; // 10%
                priceMultiplier = 1.35; // +35%
            }

            // Base Price calculation (e.g., 10 per sqm)
            const basePricePerSqm = 0.5; // Ajuste conforme economia do jogo
            const initialPrice = area * basePricePerSqm * priceMultiplier;

            // Salva no banco
            try {
                await query(`
                         INSERT INTO lands (geom, area_sqm, land_type, is_generated, condition, price, status)
                         VALUES (
                             ST_MakeValid(ST_GeomFromText($1, 4326)), 
                             $2, 
                             'fertile_land', 
                             true,
                             $3,
                             $4,
                             'disponivel'
                         )
                         ON CONFLICT DO NOTHING
                     `, [wkt, area, condition, initialPrice]);

                savedCount++;
            } catch (dbErr) {
                console.error('Database insert error:', dbErr);
            }
        }
    }

    console.log(`Busca Inversa finalizada. Criadas ${savedCount} fazendas.`);
    return { success: true, generated_fields: savedCount };
}

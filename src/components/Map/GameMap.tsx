'use client';

import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

// Fix for default marker icon in Next.js + Leaflet
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
    const map = useMapEvents({
        moveend: () => {
            onBoundsChange(map.getBounds());
        },
        zoomend: () => {
            onBoundsChange(map.getBounds());
        },
        load: () => {
            onBoundsChange(map.getBounds());
        }
    });

    useEffect(() => {
        // Initial bounds
        onBoundsChange(map.getBounds());
    }, [map, onBoundsChange]);

    return null;
}

export default function GameMap() {
    const [isMounted, setIsMounted] = useState(false);
    const [lands, setLands] = useState<any>(null);
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchLands = useCallback(async (currentBounds: L.LatLngBounds) => {
        const bbox = `${currentBounds.getWest()},${currentBounds.getSouth()},${currentBounds.getEast()},${currentBounds.getNorth()}`;
        try {
            const res = await fetch(`/api/lands?bbox=${bbox}`);
            if (res.ok) {
                const data = await res.json();
                setLands(data);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    const handleSurvey = async () => {
        if (!bounds) return;
        setLoading(true);
        try {
            const payload = {
                bounds: {
                    south: bounds.getSouth(),
                    west: bounds.getWest(),
                    north: bounds.getNorth(),
                    east: bounds.getEast()
                }
            };
            const res = await fetch('/api/lands/survey', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Refresh lands
                await fetchLands(bounds);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBoundsChange = useCallback((newBounds: L.LatLngBounds) => {
        setBounds(newBounds);
        // Debounce fetching could be good, but for now direct call
        fetchLands(newBounds);
    }, [fetchLands]);

    // Expose buy function to window for popup interaction
    useEffect(() => {
        (window as any).buyLand = async (landId: any) => {
            console.log('Tentativa de compra para ID:', landId, 'Tipo:', typeof landId);

            if (!landId) {
                alert(`ID inválido: ${landId}`);
                return;
            }

            if (!confirm('Deseja comprar este terreno?')) return;

            try {
                const res = await fetch('/api/game/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ landId })
                });

                const data = await res.json();
                if (data.success) {
                    alert('Terreno comprado com sucesso!');
                    // Refresh lands with timestamp to force update
                    if (bounds) fetchLands(bounds);
                    // Notify other components (TopBar)
                    window.dispatchEvent(new Event('game_update'));
                } else {
                    alert('Erro: ' + (data.error || 'Falha na compra'));
                }
            } catch (e) {
                console.error(e);
                alert('Erro de conexão');
            }
        };
    }, [bounds, fetchLands]);

    const onEachFeature = (feature: any, layer: L.Layer) => {
        if (feature.properties) {
            const { id, land_type, area_sqm, condition, price, status, owner_id } = feature.properties;

            if (!id) {
                console.warn('Feature sem ID:', feature);
                return; // Ou renderizar popup de erro
            }

            const hectares = (area_sqm / 10000).toFixed(2);
            const isOwned = status === 'comprado';

            const priceFormatted = parseFloat(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const popupContent = `
                <div class="p-2 min-w-[200px]">
                    <h3 class="font-bold text-lg capitalize mb-1">${land_type}</h3>
                     <div class="space-y-1 text-sm mb-3">
                        <p><strong>Condição:</strong> ${condition || 'Desconhecido'}</p>
                        <p><strong>Área:</strong> ${hectares} ha</p>
                        <p><strong>Preço:</strong> ${priceFormatted}</p>
                        <p><strong>Status:</strong> <span class="${isOwned ? 'text-red-600' : 'text-green-600'} font-bold">${status}</span></p>
                     </div>
                    
                    ${!isOwned ? `
                    <button 
                        onclick="window.buyLand('${id}')"
                        class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full transition"
                    >
                        Comprar
                    </button>
                    ` : `
                    <button disabled class="bg-gray-400 text-white font-bold py-2 px-4 rounded w-full cursor-not-allowed">
                        Indisponível
                    </button>
                    `}
                </div>
            `;
            layer.bindPopup(popupContent);

            // Style based on ownership/type
            const pathLayer = layer as L.Path;
            if (isOwned) {
                pathLayer.setStyle({ color: '#ef4444', weight: 2, fillOpacity: 0.6, fillColor: '#f87171' }); // Red for owned
            } else {
                if (condition === 'arado') {
                    pathLayer.setStyle({ color: '#d97706', weight: 2, fillOpacity: 0.4, fillColor: '#fbbf24' }); // Amber/Brownish for Plowed
                } else if (condition === 'limpo') {
                    pathLayer.setStyle({ color: '#65a30d', weight: 2, fillOpacity: 0.4, fillColor: '#84cc16' }); // Lime Green for Clean
                } else {
                    pathLayer.setStyle({ color: '#166534', weight: 1, fillOpacity: 0.3, fillColor: '#22c55e' }); // Dark Green for Raw
                }
            }
        }
    };

    const mapStyle = (feature: any) => {
        // Default style (will be overridden by onEachFeature usually, but good for init)
        if (feature.properties.status === 'comprado') {
            return { color: '#ef4444', weight: 2, fillOpacity: 0.6, fillColor: '#f87171' };
        }
        return { color: '#166534', weight: 1, fillOpacity: 0.3, fillColor: '#22c55e' };
    };

    console.log('Rendering Map. Lands data:', lands ? `${lands.features.length} features` : 'null');

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[-23.5505, -46.6333]}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                />
                <MapController onBoundsChange={handleBoundsChange} />
                {lands && <GeoJSON key={JSON.stringify(lands)} data={lands} style={mapStyle} onEachFeature={onEachFeature} />}
            </MapContainer>

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-1000">
                <button
                    onClick={handleSurvey}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full shadow-lg border-2 border-white transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin text-xl">⚙️</span> Surveying...
                        </>
                    ) : (
                        <>
                            <span className="text-xl">🔍</span> Search Area
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

'use client';

import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import LandSidebar from '../HUD/LandSidebar';
import LandsOverviewSidebar from '../HUD/LandsOverviewSidebar';

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

function MapController({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds, zoom: number) => void }) {
    const map = useMapEvents({
        moveend: () => {
            onBoundsChange(map.getBounds(), map.getZoom());
        },
        zoomend: () => {
            onBoundsChange(map.getBounds(), map.getZoom());
        },
        load: () => {
            onBoundsChange(map.getBounds(), map.getZoom());
        }
    });

    useEffect(() => {
        // Initial bounds
        onBoundsChange(map.getBounds(), map.getZoom());
    }, [map, onBoundsChange]);

    return null;
}

export default function GameMap() {
    const [isMounted, setIsMounted] = useState(false);
    const [lands, setLands] = useState<any>(null);
    const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedLand, setSelectedLand] = useState<any>(null);
    const [isOverviewOpen, setIsOverviewOpen] = useState(false);
    const [discoveryMode, setDiscoveryMode] = useState(true); // Toggle for field discovery
    const [currentZoom, setCurrentZoom] = useState(13);
    const [autoSearchActive, setAutoSearchActive] = useState(false); // Auto-search toggle

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Stable fetch function
    const fetchLands = useCallback(async (currentBounds: L.LatLngBounds, zoom: number) => {
        if (!discoveryMode) {
            // Discovery off: fetch only owned lands (from /api/game/my-lands)
            try {
                const res = await fetch('/api/game/my-lands');
                if (res.ok) {
                    const data = await res.json();
                    // Convert to GeoJSON format
                    const geoJson = {
                        type: 'FeatureCollection',
                        features: data.lands.map((land: any) => ({
                            type: 'Feature',
                            properties: {
                                id: land.id,
                                land_type: land.land_type,
                                area_sqm: land.area_sqm,
                                condition: land.condition,
                                status: 'comprado',
                                operation_start: land.operation_start,
                                operation_end: land.operation_end,
                                operation_type: land.operation_type
                            },
                            geometry: JSON.parse(land.geojson)
                        }))
                    };
                    setLands(geoJson);
                }
            } catch (err) {
                console.error(err);
            }
            return;
        }

        // Discovery mode: fetch available lands with zoom limit
        if (zoom < 10) {
            console.warn('Zoom muito distante para buscar campos. Aproxime o mapa.');
            return;
        }

        const bbox = `${currentBounds.getWest()},${currentBounds.getSouth()},${currentBounds.getEast()},${currentBounds.getNorth()}`;
        try {
            const res = await fetch(`/api/lands?bbox=${bbox}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setLands(data);
            }
        } catch (err) {
            console.error(err);
        }
    }, [discoveryMode]);

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
                await fetchLands(bounds, currentZoom);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Throttle ref to limit API calls
    const lastFetchTime = useRef<number>(0);
    const fetchThrottleMs = 2000; // 2 seconds

    const handleBoundsChange = useCallback((newBounds: L.LatLngBounds, zoom: number) => {
        setBounds(newBounds);
        setCurrentZoom(zoom);

        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime.current;

        if (!discoveryMode) {
            // Only fetch once when turned off, not on every move
            if (lands === null) fetchLands(newBounds, zoom);
        } else {
            // Throttle: only fetch if 2 seconds have passed since last fetch
            if (timeSinceLastFetch >= fetchThrottleMs) {
                lastFetchTime.current = now;
                fetchLands(newBounds, zoom);
            }
        }
    }, [fetchLands, discoveryMode, lands]);

    // Expose buy function to window for popup interaction
    useEffect(() => {
        (window as any).buyLand = async (landId: any) => {
            console.log('Tentativa de compra para ID:', landId);

            if (!landId) return;
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
                    if (bounds) fetchLands(bounds, currentZoom);
                    window.dispatchEvent(new Event('game_update'));
                } else {
                    alert('Erro: ' + (data.error || 'Falha na compra'));
                }
            } catch (e) {
                alert('Erro de conexão');
            }
        };
    }, [bounds, fetchLands, currentZoom]);

    // Listen for TopBar control events
    useEffect(() => {
        const handleDiscoveryToggle = () => {
            setDiscoveryMode(prev => {
                const newMode = !prev;
                if (bounds) {
                    fetchLands(bounds, currentZoom);
                }
                // Notify TopBar of state change ASYNCHRONOUSLY to avoid render cycle conflicts
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('map_state_changed', {
                        detail: { discoveryMode: newMode }
                    }));
                }, 0);
                return newMode;
            });
        };

        const handleAutoSearchToggle = () => {
            setAutoSearchActive(prev => {
                const newState = !prev;
                // Notify TopBar of state change ASYNCHRONOUSLY
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('map_state_changed', {
                        detail: { autoSearchActive: newState }
                    }));
                }, 0);
                return newState;
            });
        };

        window.addEventListener('map_toggle_discovery', handleDiscoveryToggle);
        window.addEventListener('map_toggle_autosearch', handleAutoSearchToggle);

        return () => {
            window.removeEventListener('map_toggle_discovery', handleDiscoveryToggle);
            window.removeEventListener('map_toggle_autosearch', handleAutoSearchToggle);
        };
    }, [bounds, currentZoom, fetchLands]);

    // Auto-search interval (every 5 seconds when active)
    useEffect(() => {
        if (!autoSearchActive || !bounds) return;

        const interval = setInterval(() => {
            handleSurvey();
        }, 5000);

        return () => clearInterval(interval);
    }, [autoSearchActive, handleSurvey]);

    // Auto-check maturation every 30 seconds
    useEffect(() => {
        const checkInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/game/farm/check-maturation', {
                    method: 'POST'
                });
                const data = await res.json();

                if (data.maturedLands && data.maturedLands.length > 0) {
                    console.log(`${data.count} land(s) matured:`, data.maturedLands);
                    // Refresh lands if on owned lands mode
                    if (!discoveryMode && bounds) {
                        fetchLands(bounds, currentZoom);
                    }
                }
            } catch (e) {
                console.error('Maturation check error:', e);
            }
        }, 30000); // Every 30 seconds

        return () => clearInterval(checkInterval);
    }, [discoveryMode, bounds, currentZoom, fetchLands]);

    // Handle map clicks - define this before passing to GeoJSON
    const onFeatureClick = (feature: any, layer: L.Layer) => {
        const { status, id } = feature.properties;
        const isOwned = status === 'comprado';

        if (isOwned) {
            // Select land for Sidebar
            console.log('Land selected:', feature.properties);
            setSelectedLand(feature.properties);

            // Unbind popup if it exists (or just close it)
            layer.closePopup();
        }
        // If not owned, let the popup handle it (already bound below)
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        if (feature.properties) {
            const { id, land_type, area_sqm, condition, price, status } = feature.properties;
            const hectares = (area_sqm / 10000).toFixed(2);
            const isOwned = status === 'comprado';
            const priceFormatted = parseFloat(price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            layer.on({
                click: () => onFeatureClick(feature, layer)
            });

            // Only bind popup if NOT owned
            if (!isOwned) {
                const popupContent = `
                    <div class="p-2 min-w-[200px]">
                        <h3 class="font-bold text-lg capitalize mb-1">${land_type}</h3>
                         <div class="space-y-1 text-sm mb-3">
                            <p><strong>Condição:</strong> ${condition || 'Desconhecido'}</p>
                            <p><strong>Área:</strong> ${hectares} ha</p>
                            <p><strong>Preço:</strong> ${priceFormatted}</p>
                            <p><strong>Status:</strong> <span class="text-green-600 font-bold">${status}</span></p>
                         </div>
                        <button 
                            onclick="window.buyLand('${id}')"
                            class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full transition"
                        >
                            Comprar
                        </button>
                    </div>
                `;
                layer.bindPopup(popupContent);
            }

            // Styles
            const pathLayer = layer as L.Path;
            if (isOwned) {
                pathLayer.setStyle({ color: '#ef4444', weight: 2, fillOpacity: 0.6, fillColor: '#f87171' });
            } else if (condition === 'arado') {
                pathLayer.setStyle({ color: '#d97706', weight: 2, fillOpacity: 0.4, fillColor: '#fbbf24' });
            } else if (condition === 'limpo') {
                pathLayer.setStyle({ color: '#65a30d', weight: 2, fillOpacity: 0.4, fillColor: '#84cc16' });
            } else {
                pathLayer.setStyle({ color: '#166534', weight: 1, fillOpacity: 0.3, fillColor: '#22c55e' });
            }
        }
    };

    const mapStyle = (feature: any) => {
        return { color: '#166534', weight: 1, fillOpacity: 0.3, fillColor: '#22c55e' };
    };

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={[-23.5505, -46.6333]}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full z-0"
            >
                {/* OpenStreetMap - Colorful and clean */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController onBoundsChange={handleBoundsChange} />
                {lands && <GeoJSON key={JSON.stringify(lands)} data={lands} style={mapStyle} onEachFeature={onEachFeature} />}
            </MapContainer>

            {/* Blur overlay removed - cleaner view */}

            {/* Lands Overview Sidebar */}
            <LandsOverviewSidebar
                isOpen={isOverviewOpen}
                onToggle={() => setIsOverviewOpen(!isOverviewOpen)}
                onSelectLand={(land) => setSelectedLand(land)}
                selectedLandId={selectedLand?.id}
            />

            {/* Land Detail Sidebar */}
            {selectedLand && (
                <LandSidebar
                    land={selectedLand}
                    onClose={() => setSelectedLand(null)}
                    onUpdate={() => bounds && fetchLands(bounds, currentZoom)}
                />
            )}
        </div>
    );
}

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

    const onEachFeature = (feature: any, layer: L.Layer) => {
        if (feature.properties) {
            const { land_type, area_sqm } = feature.properties;
            const hectares = (area_sqm / 10000).toFixed(2);
            layer.bindPopup(`
                <div class="p-2">
                    <h3 class="font-bold capitalize">${land_type}</h3>
                    <p>Area: ${hectares} ha</p>
                    <button class="bg-green-600 text-white px-2 py-1 mt-2 rounded text-xs w-full">Buy Land</button>
                </div>
            `);

            // Style based on ownership/type
            if (feature.properties.owner_id) {
                (layer as L.Path).setStyle({ color: 'blue', weight: 2, fillOpacity: 0.4 });
            } else {
                (layer as L.Path).setStyle({ color: 'white', weight: 1, fillOpacity: 0.2, fillColor: 'green' });
            }
        }
    };

    if (!isMounted) {
        return <div className="w-full h-full flex items-center justify-center bg-gray-100">Loading Map...</div>;
    }

    const mapStyle = (feature: any) => {
        if (feature.properties.owner_id) {
            return { color: 'blue', weight: 2, fillOpacity: 0.4 };
        }
        return { color: 'yellow', weight: 2, fillOpacity: 0.2, fillColor: 'green' };
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

'use client';

import { useState, useEffect } from 'react';

type SiloModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SiloData = {
    seeds: Array<{
        id: number;
        name: string;
        quantity: number;
        image_url: string;
        category: string;
        stats: any;
    }>;
    produce: Array<{
        id: number;
        name: string;
        quantity: number;
        image_url: string;
        category: string;
        stats: any;
    }>;
    statistics: {
        total_seeds_kg: number;
        total_produce_kg: number;
        seed_types: number;
        produce_types: number;
    };
};

export default function SiloModal({ isOpen, onClose }: SiloModalProps) {
    const [activeTab, setActiveTab] = useState('seeds');
    const [siloData, setSiloData] = useState<SiloData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSilo();
        }
    }, [isOpen]);

    const fetchSilo = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/game/silo');
            const data = await res.json();
            setSiloData(data);
        } catch (e) {
            console.error('Failed to fetch silo:', e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">🏭 Silo - Armazenamento</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-800/50">
                    {['seeds', 'produce', 'statistics'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors
                                ${activeTab === tab
                                    ? 'bg-amber-600 text-white shadow-inner'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {tab === 'seeds' && '🌱 Sementes'}
                            {tab === 'produce' && '📦 Produção'}
                            {tab === 'statistics' && '📊 Estatísticas'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {loading ? (
                        <div className="text-white text-center mt-10">Carregando...</div>
                    ) : !siloData ? (
                        <div className="text-white text-center mt-10">Erro ao carregar dados</div>
                    ) : (
                        <>
                            {/* Seeds Tab */}
                            {activeTab === 'seeds' && (
                                <div>
                                    {siloData.seeds.length === 0 ? (
                                        <div className="text-center text-slate-400 mt-10">
                                            <p className="text-lg mb-2">Nenhuma semente armazenada</p>
                                            <p className="text-sm">Compre sementes na loja para começar a plantar</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {siloData.seeds.map(seed => (
                                                <div
                                                    key={seed.id}
                                                    className={`bg-slate-800 rounded-lg p-4 border ${seed.quantity < 100
                                                            ? 'border-red-500/50'
                                                            : 'border-slate-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-16 h-16 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                                                            <img src={seed.image_url} alt={seed.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-white">{seed.name}</h3>
                                                            <p className="text-xs text-slate-400 capitalize">{seed.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900 p-2 rounded">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-slate-400">Estoque:</span>
                                                            <span className="text-lg font-bold text-white font-mono">
                                                                {seed.quantity.toLocaleString()} kg
                                                            </span>
                                                        </div>
                                                        {seed.quantity < 100 && (
                                                            <p className="text-xs text-red-400 mt-1">⚠️ Estoque baixo</p>
                                                        )}
                                                    </div>
                                                    {seed.stats && (
                                                        <div className="mt-2 text-xs text-slate-400 space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>Uso:</span>
                                                                <span>{seed.stats.seed_usage_kg_ha} kg/ha</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Produtividade:</span>
                                                                <span>{seed.stats.yield_kg_ha} kg/ha</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Produce Tab */}
                            {activeTab === 'produce' && (
                                <div>
                                    {siloData.produce.length === 0 ? (
                                        <div className="text-center text-slate-400 mt-10">
                                            <p className="text-lg mb-2">Nenhuma produção armazenada</p>
                                            <p className="text-sm">Colha suas plantações para armazenar produtos aqui</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {siloData.produce.map(product => (
                                                <div
                                                    key={product.id}
                                                    className="bg-slate-800 rounded-lg p-4 border border-emerald-700/50"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-16 h-16 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-white">{product.name}</h3>
                                                            <p className="text-xs text-slate-400 capitalize">{product.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900 p-2 rounded">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-slate-400">Armazenado:</span>
                                                            <span className="text-lg font-bold text-emerald-400 font-mono">
                                                                {product.quantity.toLocaleString()} kg
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {siloData.produce.length > 0 && (
                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-slate-400">
                                                💡 Venda sua produção no Mercado para ganhar dinheiro
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Statistics Tab */}
                            {activeTab === 'statistics' && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                                            <div className="text-slate-400 text-sm mb-2">Total de Sementes</div>
                                            <div className="text-3xl font-bold text-white font-mono">
                                                {siloData.statistics.total_seeds_kg.toLocaleString()} kg
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {siloData.statistics.seed_types} tipo(s) armazenado(s)
                                            </div>
                                        </div>

                                        <div className="bg-slate-800 rounded-lg p-6 border border-emerald-700/50">
                                            <div className="text-slate-400 text-sm mb-2">Total de Produção</div>
                                            <div className="text-3xl font-bold text-emerald-400 font-mono">
                                                {siloData.statistics.total_produce_kg.toLocaleString()} kg
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {siloData.statistics.produce_types} tipo(s) de cultura(s)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                                        <h3 className="text-lg font-bold text-white mb-4">Resumo do Armazenamento</h3>
                                        <div className="space-y-3">
                                            {siloData.seeds.map(seed => (
                                                <div key={`stat-seed-${seed.id}`} className="flex justify-between items-center">
                                                    <span className="text-slate-300">🌱 {seed.name}</span>
                                                    <span className="font-mono text-white">{seed.quantity.toLocaleString()} kg</span>
                                                </div>
                                            ))}
                                            {siloData.produce.map(product => (
                                                <div key={`stat-produce-${product.id}`} className="flex justify-between items-center">
                                                    <span className="text-emerald-300">📦 {product.name}</span>
                                                    <span className="font-mono text-emerald-400">{product.quantity.toLocaleString()} kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

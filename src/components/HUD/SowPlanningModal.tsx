'use client';

import { useState, useEffect } from 'react';

type SowPlanningModalProps = {
    isOpen: boolean;
    onClose: () => void;
    land: any;
    machinery: any[];
    onConfirm: (machineId: number, seedId: number) => void;
};

type Seed = {
    id: number;
    name: string;
    image_url: string;
    category: string;
    stats: {
        growth_time: number;
        yield_kg_ha: number;
        seed_usage_kg_ha: number;
        sell_price: number;
    };
    quantity: number; // Available in silo
};

export default function SowPlanningModal({ isOpen, onClose, land, machinery, onConfirm }: SowPlanningModalProps) {
    const [selectedMachine, setSelectedMachine] = useState<any>(null);
    const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
    const [seeds, setSeeds] = useState<Seed[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSeeds();
        }
    }, [isOpen]);

    const fetchSeeds = async () => {
        try {
            const res = await fetch('/api/game/silo');
            const data = await res.json();
            setSeeds(data.seeds || []);
        } catch (e) {
            console.error('Failed to fetch seeds:', e);
        }
    };

    const handleConfirm = () => {
        if (!selectedMachine || !selectedSeed) {
            alert('Selecione o maquinário e a semente');
            return;
        }

        onConfirm(selectedMachine.id, selectedSeed.id);
        onClose();
    };

    if (!isOpen) return null;

    const areaHa = land ? land.area_sqm / 10000 : 0;
    const requiredSeeds = selectedSeed ? Math.ceil(areaHa * selectedSeed.stats.seed_usage_kg_ha) : 0;
    const hasEnoughSeeds = selectedSeed ? selectedSeed.quantity >= requiredSeeds : false;

    // Calculate duration (simplified - copy from farmingService logic)
    const efficiency = selectedMachine ?
        (selectedMachine.type === 'heavy' ? selectedMachine.stats.efficiency :
            selectedMachine.imp_stats?.efficiency * (selectedMachine.stats.speed_multiplier || 1)) : 1;
    const durationSeconds = Math.floor((areaHa * 30) / (efficiency || 1));
    const durationMinutes = Math.floor(durationSeconds / 60);

    const growthTimeMinutes = selectedSeed ? Math.floor(selectedSeed.stats.growth_time / 60) : 0;
    const expectedYield = selectedSeed ? Math.floor(areaHa * selectedSeed.stats.yield_kg_ha) : 0;
    const expectedRevenue = selectedSeed ? expectedYield * selectedSeed.stats.sell_price : 0;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[2100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">🌱 Planejar Plantio</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Land Info */}
                    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <h3 className="font-bold text-white mb-2">Informações do Terreno</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400">Área:</span>
                                <span className="text-white ml-2 font-mono">{areaHa.toFixed(2)} ha</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Condição:</span>
                                <span className="text-emerald-400 ml-2 capitalize">{land?.condition}</span>
                            </div>
                        </div>
                    </div>

                    {/* Machine Selection */}
                    <div>
                        <h3 className="font-bold text-white mb-3">1. Selecione o Maquinário</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {machinery.map(machine => (
                                <button
                                    key={machine.id}
                                    onClick={() => setSelectedMachine(machine)}
                                    className={`p-3 rounded-lg border-2 transition-all text-left ${selectedMachine?.id === machine.id
                                            ? 'border-emerald-500 bg-emerald-900/30'
                                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden shrink-0">
                                            <img src={machine.image_url} className="w-full h-full object-cover" alt={machine.name} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{machine.name}</p>
                                            <p className="text-xs text-slate-400">
                                                {machine.type === 'heavy' ? 'Maquinário Pesado' : `Semeadeira (${Math.round(machine.stats.hp)}cv)`}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seed Selection */}
                    <div>
                        <h3 className="font-bold text-white mb-3">2. Selecione a Semente</h3>
                        {seeds.length === 0 ? (
                            <div className="bg-yellow-900/20 border border-yellow-900 p-4 rounded-lg">
                                <p className="text-yellow-400 text-sm">⚠️ Você não tem sementes no silo. Compre sementes na loja primeiro.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {seeds.map(seed => (
                                    <button
                                        key={seed.id}
                                        onClick={() => setSelectedSeed(seed)}
                                        className={`p-3 rounded-lg border-2 transition-all text-left ${selectedSeed?.id === seed.id
                                                ? 'border-emerald-500 bg-emerald-900/30'
                                                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden shrink-0">
                                                <img src={seed.image_url} className="w-full h-full object-cover" alt={seed.name} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-sm">{seed.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    Estoque: <span className="font-mono">{seed.quantity}kg</span>
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {selectedMachine && selectedSeed && (
                        <div className="bg-slate-800 rounded-lg p-4 border border-emerald-700">
                            <h3 className="font-bold text-emerald-400 mb-3">📋 Resumo do Plantio</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Sementes necessárias:</span>
                                    <span className={`font-mono ${hasEnoughSeeds ? 'text-white' : 'text-red-400'}`}>
                                        {requiredSeeds}kg {!hasEnoughSeeds && '⚠️'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tempo de plantio:</span>
                                    <span className="text-white font-mono">~{durationMinutes}min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tempo de crescimento:</span>
                                    <span className="text-white font-mono">~{growthTimeMinutes}min</span>
                                </div>
                                <div className="h-px bg-slate-700 my-2"></div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Produção esperada:</span>
                                    <span className="text-emerald-400 font-mono">{expectedYield.toLocaleString()}kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Receita estimada:</span>
                                    <span className="text-emerald-400 font-mono font-bold">
                                        ${expectedRevenue.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {!hasEnoughSeeds && (
                                <div className="mt-3 bg-red-900/20 border border-red-900 p-2 rounded">
                                    <p className="text-red-400 text-xs">
                                        ⚠️ Sementes insuficientes! Você tem {selectedSeed.quantity}kg mas precisa de {requiredSeeds}kg.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedMachine || !selectedSeed || !hasEnoughSeeds}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Plantio 🌱
                    </button>
                </div>
            </div>
        </div>
    );
}

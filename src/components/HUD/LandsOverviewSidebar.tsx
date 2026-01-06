import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type LandsOverviewProps = {
    isOpen: boolean;
    onToggle: () => void;
    onSelectLand: (land: any) => void;
    selectedLandId?: string;
};

export default function LandsOverviewSidebar({ isOpen, onToggle, onSelectLand, selectedLandId }: LandsOverviewProps) {
    const [lands, setLands] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'finished'>('all');
    const [loading, setLoading] = useState(false);

    const fetchLands = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/game/my-lands');
            const data = await res.json();
            if (data.lands) setLands(data.lands);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLands();
            const interval = setInterval(fetchLands, 10000); // Refresh every 10s
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    const filteredLands = lands.filter(land => {
        if (filter === 'all') return true;
        if (filter === 'waiting') return !land.operation_start && land.condition !== 'growing';
        if (filter === 'active') return land.is_active;
        if (filter === 'finished') return land.is_finished;
        return true;
    });

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'bruto': return 'text-emerald-700 bg-emerald-900/20';
            case 'limpo': return 'text-lime-400 bg-lime-900/20';
            case 'arado': return 'text-amber-500 bg-amber-900/20';
            case 'growing': return 'text-green-400 bg-green-900/20';
            default: return 'text-slate-400 bg-slate-900/20';
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className={`fixed top-1/2 -translate-y-1/2 z-[999] bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-r-lg shadow-xl border border-l-0 border-slate-600 transition-all ${isOpen ? 'left-80' : 'left-0'
                    }`}
                title={isOpen ? 'Fechar painel' : 'Minhas Terras'}
            >
                {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 left-0 h-full bg-slate-900/95 border-r border-slate-700 shadow-2xl z-[998] flex flex-col backdrop-blur-sm transition-transform duration-300 pointer-events-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ width: '320px' }}
                onClick={(e) => e.stopPropagation()}
                onScroll={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        🏞️ Minhas Propriedades
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{lands.length} terreno(s) total</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-800/50 border-b border-slate-700">
                    {[
                        { key: 'all', label: 'Todos', icon: '📋' },
                        { key: 'waiting', label: 'Aguardando', icon: '⏳' },
                        { key: 'active', label: 'Ativos', icon: '🚜' },
                        { key: 'finished', label: 'Prontos', icon: '✅' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as any)}
                            className={`flex-1 py-2 px-1 text-[10px] font-bold uppercase transition-colors ${filter === tab.key
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="block text-sm">{tab.icon}</span>
                            <span className="block mt-0.5">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Lands List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {loading && lands.length === 0 ? (
                        <div className="text-center text-slate-400 py-8">Carregando...</div>
                    ) : filteredLands.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            {filter === 'all' ? 'Nenhuma terra comprada ainda' : 'Nenhuma terra nesta categoria'}
                        </div>
                    ) : (
                        filteredLands.map(land => (
                            <div
                                key={land.id}
                                onClick={() => onSelectLand(land)}
                                className={`bg-slate-800 rounded-lg p-3 border cursor-pointer transition-all hover:border-emerald-500 ${selectedLandId === land.id
                                        ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg'
                                        : 'border-slate-700'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-white capitalize">{land.land_type}</h3>
                                        <p className="text-xs text-slate-400 font-mono">
                                            {land.area_ha} ha
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${getConditionColor(land.condition)}`}>
                                        {land.condition}
                                    </span>
                                </div>

                                {/* Operation Status */}
                                {land.is_active && (
                                    <div className="bg-blue-900/30 border border-blue-500/30 rounded p-2 mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-blue-300 font-bold capitalize">
                                                {land.operation_type === 'clean' ? '🧹 Limpando' :
                                                    land.operation_type === 'plow' ? '🚜 Arando' :
                                                        land.operation_type === 'sow' ? '🌱 Plantando' : '⚙️ Operando'}
                                            </span>
                                            <span className="text-xs text-blue-200 font-mono">
                                                {formatTime(land.time_remaining || 0)}
                                            </span>
                                        </div>
                                        <div className="w-full bg-blue-900 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000"
                                                style={{
                                                    width: land.time_remaining
                                                        ? `${Math.max(5, 100 - (land.time_remaining / 60) * 10)}%`
                                                        : '100%'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {land.is_finished && !land.is_active && (
                                    <div className="bg-green-900/30 border border-green-500/30 rounded p-2 mb-2">
                                        <span className="text-xs text-green-300 font-bold">✅ Operação Concluída!</span>
                                        <p className="text-[10px] text-green-200 mt-0.5">Clique para finalizar</p>
                                    </div>
                                )}

                                {!land.operation_start && land.condition !== 'growing' && (
                                    <div className="text-xs text-slate-400 italic">
                                        {land.condition === 'bruto' && '🧹 Precisa limpar'}
                                        {land.condition === 'limpo' && '🚜 Pronto para arar'}
                                        {land.condition === 'arado' && '🌱 Pronto para plantar'}
                                    </div>
                                )}

                                {land.condition === 'growing' && !land.operation_start && (
                                    <div className="text-xs text-green-400">
                                        🌾 Colheita crescendo...
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-400">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="font-bold text-emerald-400">{lands.filter(l => l.is_active).length}</span> em operação
                        </div>
                        <div>
                            <span className="font-bold text-amber-400">{lands.filter(l => l.is_finished).length}</span> prontas
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}


import { useEffect, useState } from 'react';
import SowPlanningModal from './SowPlanningModal';

type LandActionSidebarProps = {
    land: any;
    onClose: () => void;
    onUpdate: () => void;
};

export default function LandSidebar({ land, onClose, onUpdate }: LandActionSidebarProps) {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [showSowModal, setShowSowModal] = useState(false);

    useEffect(() => {
        if (land) {
            fetchInventory();
            // Calculate initial time remaining
            if (land.operation_end) {
                const remaining = Math.max(0, Math.floor((new Date(land.operation_end).getTime() - Date.now()) / 1000));
                setTimeRemaining(remaining);
            } else {
                setTimeRemaining(null);
            }
        }
    }, [land]);

    // Timer countdown
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev === null || prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Auto-finish when timer reaches 0
    useEffect(() => {
        if (timeRemaining === 0 && land.operation_end) {
            // Auto-finish operation
            handleFinish();
        }
    }, [timeRemaining]);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/game/inventory');
            const data = await res.json();
            if (data.inventory) setInventory(data.inventory);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAction = async (action: string, machineId: number, seedId?: number) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/game/farm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'start',
                    action: action,
                    landId: land.id,
                    toolInvId: machineId,
                    seedId: seedId // Pass seedId for sow action
                })
            });
            const data = await res.json();

            if (data.success) {
                // alert('Operação iniciada!');
                onUpdate(); // Refund map
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (e) {
            alert('Erro de conexão');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFinish = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/game/farm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'finish',
                    landId: land.id
                })
            });
            const data = await res.json();
            if (data.completed) {
                alert('Operação concluída!');
                onUpdate();
            } else {
                alert('Ainda não terminou!');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    // Filter Logic
    const getCompatibleTools = (action: string) => {
        // Returns list of inventory items (Main Tractors or Heavy Machines) that can perform the action
        // Logic must match farmingService.ts
        return inventory.filter(item => {
            // 1. Check Heavy Machines
            if (item.type === 'heavy' && item.stats.operation === 'cleaning' && action === 'clean') return true;
            if (item.type === 'heavy' && item.stats.operation === 'harvesting' && action === 'harvest') return true;

            // 2. Check Tractors with Implements
            // Tractors don't have 'attached_to' field - implements do!
            // Find if there's an implement attached TO this tractor
            if (item.type === 'tractor') {
                const implement = inventory.find(imp => imp.type === 'implement' && imp.attached_to === item.instance_id);
                if (!implement) return false;

                if (action === 'clean' && implement.category === 'cleaner') return true;
                if (action === 'plow' && implement.category === 'plow') return true;
                if (action === 'sow' && implement.category === 'seeder') return true;
            }
            return false;
        });
    };

    if (!land) return null;

    const hectares = (land.area_sqm / 10000).toFixed(2);
    const isOperationActive = land.operation_end && new Date(land.operation_end) > new Date();
    const isOperationFinished = land.operation_end && new Date(land.operation_end) <= new Date();

    console.log(`Land on sidebar: ${land}`);

    // Available actions based on state
    // Bruto -> Clean
    // Limpo -> Plow
    // Arado -> Sow
    // Growing -> Wait -> Harvest

    let possibleAction = '';
    if (land.condition === 'bruto') possibleAction = 'clean';
    else if (land.condition === 'limpo') possibleAction = 'plow';
    else if (land.condition === 'arado') possibleAction = 'sow';
    else if (land.condition === 'growing') possibleAction = 'grow'; // Just status

    const machines = possibleAction ? getCompatibleTools(possibleAction) : [];

    return (
        <div
            className="absolute top-0 left-0 h-full w-96 bg-slate-900/95 border-r border-slate-700 shadow-2xl z-[1000] flex flex-col backdrop-blur-sm transform transition-transform duration-300 ease-in-out pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-blend-soft-light">
                <div>
                    <h2 className="text-xl font-bold text-white">Propriedade Rural</h2>
                    <p className="text-xs text-slate-400 font-mono">ID: {land.id.substring(0, 8)}...</p>
                </div>
                <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full transition-colors">
                    ✕
                </button>
            </div>

            {/* Land Stats */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-inner">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Área</p>
                            <p className="text-white font-mono text-lg">{hectares} ha</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold">Condição</p>
                            <p className={`font-bold capitalize ${land.condition === 'bruto' ? 'text-emerald-700' :
                                land.condition === 'limpo' ? 'text-lime-400' :
                                    land.condition === 'arado' ? 'text-amber-500' : 'text-green-500'
                                }`}>{land.condition}</p>
                        </div>
                    </div>
                </div>

                {/* Operations Status */}
                {isOperationActive && (
                    <div className="bg-blue-900/40 border border-blue-500/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-blue-300 font-bold flex items-center gap-2">
                                🚜 Operação em Andamento
                            </h4>
                            <span className="text-blue-200 font-mono text-lg font-bold tabular-nums">
                                {(() => {
                                    const hours = Math.floor((timeRemaining || 0) / 3600);
                                    const minutes = Math.floor(((timeRemaining || 0) % 3600) / 60);
                                    const seconds = (timeRemaining || 0) % 60;
                                    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                })()}
                            </span>
                        </div>
                        <p className="text-sm text-blue-200 mb-3 capitalize font-medium">
                            {land.operation_type === 'clean' ? '🧹 Limpeza' :
                                land.operation_type === 'plow' ? '🚜 Aragem' :
                                    land.operation_type === 'sow' ? '🌱 Plantio' : '⚙️ Processando'}
                        </p>
                        <div className="w-full bg-blue-900 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-400 h-3 rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
                                style={{
                                    width: `${(() => {
                                        if (!land.operation_start || !land.operation_end) return 0;
                                        const totalDuration = new Date(land.operation_end).getTime() - new Date(land.operation_start).getTime();
                                        const elapsed = Date.now() - new Date(land.operation_start).getTime();
                                        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                                        return progress;
                                    })()}%`
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-blue-300/70">
                            <span>Iniciado: {new Date(land.operation_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>Término: {new Date(land.operation_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                )}

                {/* Confirm Finish */}
                {isOperationFinished && land.operation_type && (
                    <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-4">
                        <h4 className="text-green-300 font-bold mb-2">✅ Concluído!</h4>
                        <button
                            onClick={handleFinish}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded shadow transition-colors"
                        >
                            Finalizar & Atualizar
                        </button>
                    </div>
                )}

                {/* Actions Selector */}
                {!land.operation_start && possibleAction && possibleAction !== 'grow' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
                            Ação Disponível: <span className="text-emerald-400 capitalize">{possibleAction === 'clean' ? 'Limpeza' : possibleAction === 'plow' ? 'Arar' : 'Semear'}</span>
                        </h3>

                        {possibleAction === 'sow' ? (
                            // Sow action uses modal
                            <button
                                onClick={() => setShowSowModal(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow transition-colors flex items-center justify-center gap-2"
                            >
                                <span>🌱</span>
                                <span>Planejar Plantio</span>
                            </button>
                        ) : machines.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400 mb-2">Selecione o maquinário:</p>
                                {machines.map(machine => (
                                    <button
                                        key={machine.id}
                                        onClick={() => handleAction(possibleAction, machine.id)}
                                        disabled={actionLoading}
                                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-emerald-500 rounded p-3 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                                    >
                                        <div className="w-10 h-10 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                                            <img src={machine.image_url} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{machine.name}</p>
                                            <p className="text-xs text-slate-400">
                                                {machine.type === 'heavy'
                                                    ? 'Maquinário Pesado'
                                                    : `Trator + Implemento (${Math.round(machine.stats.hp)}cv)`}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-red-900/20 border border-red-900 p-3 rounded">
                                <p className="text-red-400 text-sm font-bold flex items-center gap-2">❌ Sem equipamento!</p>
                                <p className="text-xs text-red-300 mt-1">
                                    {possibleAction === 'clean' && 'Precisa: Trator + Roçadeira OU Escavadeira.'}
                                    {possibleAction === 'plow' && 'Precisa: Trator + Arado.'}
                                    {possibleAction === 'sow' && 'Precisa: Trator + Semeadeira.'}
                                </p>
                                <button className="text-xs text-emerald-400 underline mt-2" onClick={onClose}>Ir à Loja/Celeiro</button>
                            </div>
                        )}
                    </div>
                )}

                {possibleAction === 'grow' && (
                    <div className="p-4 bg-slate-800 rounded border border-slate-600">
                        <h3 className="font-bold text-white">🌱 Colheita em crescimento</h3>
                        <p className="text-sm text-slate-400">Aguarde o tempo de maturação.</p>
                    </div>
                )}

                {/* Harvest Option for Mature Lands */}
                {land.condition === 'mature' && (
                    <div className="space-y-4">
                        <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-4">
                            <h3 className="text-green-300 font-bold mb-2 flex items-center gap-2">
                                🌾 Colheita Pronta!
                            </h3>
                            <p className="text-sm text-green-200 mb-3">
                                A plantação está madura e pronta para ser colhida.
                            </p>
                            {land.current_crop_id && (
                                <p className="text-xs text-green-300 mb-2">
                                    Rendimento esperado: ~{Math.floor((land.area_sqm / 10000) * 3000)} - {Math.floor((land.area_sqm / 10000) * 4000)} kg
                                </p>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">
                            Selecione a Colheitadeira:
                        </h3>

                        {(() => {
                            const harvesters = inventory.filter(item =>
                                item.type === 'heavy' && item.stats.operation === 'harvesting'
                            );

                            if (harvesters.length === 0) {
                                return (
                                    <div className="bg-red-900/20 border border-red-900 p-3 rounded">
                                        <p className="text-red-400 text-sm font-bold">❌ Sem colheitadeira!</p>
                                        <p className="text-xs text-red-300 mt-1">
                                            Precisa de uma colheitadeira para colher.
                                        </p>
                                        <button className="text-xs text-emerald-400 underline mt-2" onClick={onClose}>
                                            Ir à Loja
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-2">
                                    {harvesters.map(harvester => (
                                        <button
                                            key={harvester.id}
                                            onClick={async () => {
                                                setActionLoading(true);
                                                try {
                                                    const res = await fetch('/api/game/farm', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            type: 'harvest',
                                                            landId: land.id,
                                                            toolInvId: harvester.id
                                                        })
                                                    });
                                                    const data = await res.json();

                                                    if (data.success) {
                                                        alert(
                                                            `Colheita realizada com sucesso!\n\n` +
                                                            `Produto: ${data.cropName}\n` +
                                                            `Quantidade colhida: ${data.yield}kg\n` +
                                                            `Adicionado ao silo!`
                                                        );
                                                        onUpdate();
                                                    } else {
                                                        alert('Erro: ' + data.error);
                                                    }
                                                } catch (e) {
                                                    alert('Erro de conexão');
                                                } finally {
                                                    setActionLoading(false);
                                                }
                                            }}
                                            disabled={actionLoading}
                                            className="w-full bg-green-800 hover:bg-green-700 border border-green-600 hover:border-green-500 rounded p-3 flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                                        >
                                            <div className="w-10 h-10 rounded bg-slate-900 overflow-hidden flex-shrink-0">
                                                <img src={harvester.image_url} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{harvester.name}</p>
                                                <p className="text-xs text-green-200">Colheitadeira</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Sow Planning Modal */}
            <SowPlanningModal
                isOpen={showSowModal}
                onClose={() => setShowSowModal(false)}
                land={land}
                machinery={getCompatibleTools('sow')}
                onConfirm={(machineId, seedId) => {
                    handleAction('sow', machineId, seedId);
                    setShowSowModal(false);
                }}
            />
        </div>
    );
}

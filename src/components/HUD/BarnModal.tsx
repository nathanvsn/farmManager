
import { useState, useEffect } from 'react';

type BarnModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type InventoryItem = {
    id: number; // Inventory ID
    item_id: number;
    name: string;
    type: string;
    category: string;
    image_url: string;
    stats: any;
    quantity: number;
    instance_id?: string;
    attached_to?: string;
};

export default function BarnModal({ isOpen, onClose }: BarnModalProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTractor, setSelectedTractor] = useState<InventoryItem | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchInventory();
        }
    }, [isOpen]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/game/inventory');
            const data = await res.json();
            if (data.inventory) setItems(data.inventory);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEquip = async (tractor: InventoryItem, implement: InventoryItem) => {
        if (implement.attached_to) {
            alert('Implemento já está em uso.');
            return;
        }

        try {
            const res = await fetch('/api/game/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'equip',
                    tractorId: tractor.id, // Inventory ID
                    implementId: implement.id // Inventory ID
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('Equipado com sucesso!');
                fetchInventory();
                setSelectedTractor(null);
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    const handleUnequip = async (implement: InventoryItem) => {
        if (!confirm('Desacoplar implemento?')) return;
        try {
            const res = await fetch('/api/game/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'unequip',
                    implementInvId: implement.id
                })
            });
            const data = await res.json();
            if (data.success) {
                fetchInventory();
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    // Filter Logic
    const tractors = items.filter(i => i.type === 'tractor');
    const implementsList = items.filter(i => i.type === 'implement');
    const heavy = items.filter(i => i.type === 'heavy');

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-xl border border-amber-900/50 flex flex-col overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                {/* Wood Texture / Barn Theme Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

                {/* Header */}
                <div className="p-4 bg-amber-900/40 border-b border-amber-800 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-amber-100 flex items-center gap-2">
                        🏚️ Celeiro <span className="text-sm font-normal text-amber-300 opacity-70">(Gerencie sua frota)</span>
                    </h2>
                    <button onClick={onClose} className="text-amber-200 hover:text-white text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 z-10 space-y-8">
                    {loading ? (
                        <div className="text-amber-200 text-center">Carregando inventário...</div>
                    ) : (
                        <>
                            {/* Tractors Section */}
                            <section>
                                <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-amber-800 pb-2">🚜 Tratores Disponíveis</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tractors.length === 0 && <p className="text-slate-500 italic">Nenhum trator. Vá à Concessionária comprar um!</p>}
                                    {tractors.map(tractor => {
                                        // Check if anything is attached to this tractor
                                        const attachment = implementsList.find(imp => imp.attached_to === tractor.instance_id);

                                        return (
                                            <div key={tractor.id} className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${selectedTractor?.id === tractor.id ? 'border-amber-500 shadow-amber-500/20 shadow-lg' : 'border-slate-700'}`}>
                                                <div className="flex gap-4">
                                                    <img src={tractor.image_url} className="w-20 h-20 object-cover rounded bg-slate-900" alt={tractor.name} />
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-white text-sm">{tractor.name}</h4>
                                                        <p className="text-xs text-amber-300 mb-1">{tractor.stats.hp} cv</p>

                                                        <div className="mt-2 bg-slate-900 p-2 rounded border border-slate-700 min-h-[50px] flex items-center justify-center">
                                                            {attachment ? (
                                                                <div className="w-full relative group">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs text-emerald-400 truncate w-24" title={attachment.name}>{attachment.name}</span>
                                                                        <button onClick={() => handleUnequip(attachment)} className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-900 bg-red-950 px-2 py-1 rounded">⏏</button>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 mt-1 uppercase">{attachment.category}</div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setSelectedTractor(selectedTractor?.id === tractor.id ? null : tractor)}
                                                                    className={`text-xs font-bold px-3 py-1 rounded w-full border border-dashed transition-colors
                                                                        ${selectedTractor?.id === tractor.id
                                                                            ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                                                                            : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-400'
                                                                        }`}
                                                                >
                                                                    {selectedTractor?.id === tractor.id ? 'CANCELAR AJUSTE' : '+ ACOPLAR IMPLEMENTO'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Implements Selection Area (Only shows when tractor selected) */}
                            {selectedTractor && (
                                <section className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="text-lg font-bold text-amber-300 mb-4 flex items-center gap-2">
                                        ⚙️ Selecione um implemento para: <span className="text-white bg-slate-800 px-2 py-1 rounded text-sm">{selectedTractor.name} ({selectedTractor.stats.hp}cv)</span>
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {implementsList.filter(i => !i.attached_to).length === 0 && <p className="text-slate-400 text-sm">Nenhum implemento disponível.</p>}

                                        {implementsList.filter(i => !i.attached_to).map(imp => {
                                            const compatible = selectedTractor.stats.hp >= imp.stats.req_hp;
                                            return (
                                                <div key={imp.id} className={`bg-slate-800 p-3 rounded border flex flex-col justify-between ${compatible ? 'border-slate-600 hover:border-emerald-500' : 'border-red-900 opacity-60'}`}>
                                                    <div>
                                                        <h5 className="font-bold text-white text-xs">{imp.name}</h5>
                                                        <p className="text-xs text-slate-400">{imp.category}</p>
                                                        <p className={`text-xs mt-1 font-mono ${compatible ? 'text-emerald-400' : 'text-red-400'}`}>Req: {imp.stats.req_hp} cv</p>
                                                    </div>
                                                    <button
                                                        disabled={!compatible}
                                                        onClick={() => handleEquip(selectedTractor, imp)}
                                                        className={`mt-3 w-full py-1 text-xs font-bold rounded ${compatible ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                                    >
                                                        {compatible ? 'EQUIPAR' : 'POTÊNCIA BAIXA'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Heavy Machinery */}
                            <section>
                                <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-amber-800 pb-2">🏗️ Maquinário Pesado</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {heavy.length === 0 && <p className="text-slate-500 italic">Nenhuma máquina pesada.</p>}
                                    {heavy.map(machine => (
                                        <div key={machine.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex gap-4">
                                            <img src={machine.image_url} className="w-20 h-20 object-cover rounded bg-slate-900" alt={machine.name} />
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{machine.name}</h4>
                                                <span className="text-xs bg-amber-900 text-amber-200 px-2 py-0.5 rounded uppercase mt-1 inline-block">{machine.category}</span>
                                                <p className="text-xs text-slate-400 mt-2">{machine.stats.hp}cv • {machine.stats.efficiency} ha/h</p>
                                                <div className="mt-2 text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                    ✅ PRONTO PARA USO
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

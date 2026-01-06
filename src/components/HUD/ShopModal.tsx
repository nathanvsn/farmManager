
import { useState, useEffect } from 'react';
import Image from 'next/image';

type ShopModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type ShopItem = {
    id: number;
    name: string;
    type: string;
    category: string;
    price: string;
    description: string;
    image_url: string;
    stats: any;
};

export default function ShopModal({ isOpen, onClose }: ShopModalProps) {
    const [activeTab, setActiveTab] = useState('tractor');
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchItems(activeTab);
        }
    }, [isOpen, activeTab]);

    const fetchItems = async (type: string) => {
        setLoading(true);
        try {
            // Map tab to type/category logic
            let query = `?category=${type}`;
            if (type === 'seeds') query = '?category=seed';

            const res = await fetch(`/api/game/shop${query}`);
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const buyItem = async (item: ShopItem) => {
        if (!confirm(`Comprar ${item.name} por $${parseFloat(item.price).toLocaleString()}?`)) return;

        try {
            let quantity = 1;
            // For seeds, maybe implement a quantity selector later. Defaulting to 1kg/unit for now or package.
            // Actually seed_items.ts logic is price per unit (kg).
            if (item.type === 'seed') {
                const qtyStr = prompt('Quantos KG deseja comprar?', '100');
                if (!qtyStr) return;
                quantity = parseInt(qtyStr);
                if (isNaN(quantity) || quantity <= 0) return;
            }

            const res = await fetch('/api/game/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id, quantity })
            });

            const data = await res.json();
            if (data.success) {
                alert('Compra realizada com sucesso!');
                window.dispatchEvent(new Event('game_update')); // Refresh balance
            } else {
                alert('Erro na compra: ' + data.error);
            }
        } catch (e) {
            alert('Erro de conexão');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
        >
            <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">🛍️ Concessionária & Mercado</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-800/50">
                    {['tractor', 'implement', 'heavy', 'seeds'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors
                                ${activeTab === tab
                                    ? 'bg-emerald-600 text-white shadow-inner'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            {tab === 'tractor' && 'Tratores 🚜'}
                            {tab === 'implement' && 'Implementos ⚙️'}
                            {tab === 'heavy' && 'Pesados 🏗️'}
                            {tab === 'seeds' && 'Sementes 🌱'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {loading ? (
                        <div className="text-white text-center mt-10">Carregando catálogo...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map(item => (
                                <div key={item.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition-all group">
                                    <div className="h-40 bg-slate-700 relative overflow-hidden">
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute bottom-0 right-0 bg-emerald-600 px-3 py-1 font-bold text-white shadow-lg">
                                            $ {parseFloat(item.price).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
                                            <span className="text-xs bg-slate-900 text-emerald-400 px-2 py-1 rounded uppercase">{item.category}</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden">{item.description}</p>

                                        {/* Stats Display */}
                                        <div className="bg-slate-900/50 p-2 rounded text-xs text-slate-300 mb-4 space-y-1">
                                            {item.type === 'tractor' && (
                                                <div className="flex justify-between">
                                                    <span>Potência:</span> <span className="text-white font-mono">{item.stats.hp} cv</span>
                                                </div>
                                            )}
                                            {item.type === 'implement' && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span>Requer:</span> <span className="text-white font-mono">{item.stats.req_hp} cv</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Eficiência:</span> <span className="text-white font-mono">{item.stats.efficiency} ha/h</span>
                                                    </div>
                                                </>
                                            )}
                                            {item.type === 'seed' && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span>Produtividade:</span> <span className="text-white font-mono">{item.stats.yield_kg_ha} kg/ha</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Crescimento:</span> <span className="text-white font-mono">{(item.stats.growth_time / 60).toFixed(1)} mins</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => buyItem(item)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                                        >
                                            COMPRAR 🛒
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

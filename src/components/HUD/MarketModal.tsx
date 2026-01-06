'use client';

import { useState, useEffect } from 'react';

type MarketModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

type MarketPrice = {
    id: number;
    item_id: number;
    base_price: string;
    current_price: string;
    trend: 'up' | 'down' | 'stable';
    name: string;
    image_url: string;
    category: string;
    available_quantity: number;
};

export default function MarketModal({ isOpen, onClose }: MarketModalProps) {
    const [prices, setPrices] = useState<MarketPrice[]>([]);
    const [loading, setLoading] = useState(false);
    const [selling, setSelling] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPrices();
        }
    }, [isOpen]);

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/game/market');
            const data = await res.json();
            setPrices(data.prices || []);
        } catch (e) {
            console.error('Failed to fetch market prices:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSell = async (item: MarketPrice) => {
        if (item.available_quantity <= 0) {
            alert('Você não tem este produto no silo!');
            return;
        }

        const qtyStr = prompt(
            `Quanto deseja vender? (Disponível: ${item.available_quantity}kg)`,
            String(Math.min(100, item.available_quantity))
        );

        if (!qtyStr) return;

        const quantity = parseInt(qtyStr);
        if (isNaN(quantity) || quantity <= 0) {
            alert('Quantidade inválida');
            return;
        }

        if (quantity > item.available_quantity) {
            alert(`Quantidade insuficiente! Disponível: ${item.available_quantity}kg`);
            return;
        }

        const totalValue = quantity * parseFloat(item.current_price);
        if (!confirm(
            `Confirmar venda?\n\n` +
            `Produto: ${item.name}\n` +
            `Quantidade: ${quantity}kg\n` +
            `Preço: $${parseFloat(item.current_price).toFixed(2)}/kg\n` +
            `Total: $${totalValue.toFixed(2)}`
        )) {
            return;
        }

        setSelling(true);
        try {
            const res = await fetch('/api/game/market', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.item_id, quantity })
            });

            const data = await res.json();

            if (data.success) {
                alert(
                    `Venda realizada com sucesso!\n\n` +
                    `Vendido: ${data.quantitySold}kg\n` +
                    `Valor recebido: $${data.totalValue.toFixed(2)}\n` +
                    `Novo saldo: $${data.newBalance.toFixed(2)}`
                );

                // Refresh prices and trigger game update
                fetchPrices();
                window.dispatchEvent(new Event('game_update'));
            } else {
                alert('Erro na venda: ' + data.error);
            }
        } catch (e) {
            alert('Erro de conexão');
            console.error(e);
        } finally {
            setSelling(false);
        }
    };

    if (!isOpen) return null;

    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    const getTrendColor = (trend: string) => {
        if (trend === 'up') return 'text-green-400';
        if (trend === 'down') return 'text-red-400';
        return 'text-yellow-400';
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 z-[2000] flex items-center justify-center p-4 pointer-events-auto"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 w-full max-w-6xl h-[80vh] rounded-xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">🏪 Mercado Agrícola</h2>
                        <p className="text-xs text-slate-400">Preços atualizados em tempo real</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                    {loading ? (
                        <div className="text-white text-center mt-10">Carregando preços...</div>
                    ) : prices.length === 0 ? (
                        <div className="text-white text-center mt-10">Nenhum produto disponível</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-400 uppercase">
                                <div className="col-span-3">Produto</div>
                                <div className="col-span-2 text-center">Estoque</div>
                                <div className="col-span-2 text-center">Preço Base</div>
                                <div className="col-span-2 text-center">Preço Atual</div>
                                <div className="col-span-1 text-center">Tendência</div>
                                <div className="col-span-2 text-center">Ação</div>
                            </div>

                            {/* Table Rows */}
                            {prices.map(item => {
                                const hasStock = item.available_quantity > 0;
                                const basePrice = parseFloat(item.base_price);
                                const currentPrice = parseFloat(item.current_price);
                                const priceChange = ((currentPrice - basePrice) / basePrice) * 100;

                                return (
                                    <div
                                        key={item.id}
                                        className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg border transition-all ${hasStock
                                                ? 'bg-slate-800 border-slate-700 hover:border-emerald-500'
                                                : 'bg-slate-800/50 border-slate-800'
                                            }`}
                                    >
                                        {/* Product Info */}
                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-slate-700 overflow-hidden flex-shrink-0">
                                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{item.name}</div>
                                                <div className="text-xs text-slate-400 capitalize">{item.category}</div>
                                            </div>
                                        </div>

                                        {/* Stock */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className={`font-mono ${hasStock ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {item.available_quantity.toLocaleString()} kg
                                            </span>
                                        </div>

                                        {/* Base Price */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <span className="font-mono text-slate-400">
                                                ${basePrice.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Current Price */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="font-mono text-white font-bold">
                                                    ${currentPrice.toFixed(2)}
                                                </div>
                                                <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Trend */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <span className={`text-2xl ${getTrendColor(item.trend)}`}>
                                                {getTrendIcon(item.trend)}
                                            </span>
                                        </div>

                                        {/* Action */}
                                        <div className="col-span-2 flex items-center justify-center">
                                            <button
                                                onClick={() => handleSell(item)}
                                                disabled={!hasStock || selling}
                                                className={`px-4 py-2 rounded font-bold text-sm transition-all ${hasStock && !selling
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                {selling ? 'Vendendo...' : 'Vender'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {prices.length > 0 && (
                        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-sm text-slate-400">
                                💡 <strong>Dica:</strong> Os preços flutuam baseado em oferta e demanda.
                                Venda quando a tendência estiver <span className="text-green-400">↑ para cima</span> para maximizar lucros!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

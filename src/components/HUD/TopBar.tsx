'use client';

import { useEffect, useState } from 'react';
import { Wallet, Diamond, User, Store, Warehouse, Tractor } from 'lucide-react';
import Link from 'next/link';
import ShopModal from './ShopModal';
import BarnModal from './BarnModal';
import SiloModal from './SiloModal';
import MarketModal from './MarketModal';

export default function TopBar() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showShop, setShowShop] = useState(false);
    const [showBarn, setShowBarn] = useState(false);
    const [showSilo, setShowSilo] = useState(false);
    const [showMarket, setShowMarket] = useState(false);
    const [discoveryMode, setDiscoveryMode] = useState(true);
    const [autoSearchActive, setAutoSearchActive] = useState(false);

    const fetchUser = () => {
        // console.log('Fetching user session...');
        fetch('/api/auth/me', { headers: { 'Cache-Control': 'no-store' } })
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => {
                if (data?.user) setUser(data.user);
                setLoading(false);
            })
            .catch(err => console.error('Auth fetch error:', err));
    };

    useEffect(() => {
        fetchUser();

        const handleGameUpdate = () => {
            fetchUser();
        };

        // Listen for map state changes
        const handleMapStateChange = (event: any) => {
            if (event.detail?.discoveryMode !== undefined) {
                setDiscoveryMode(event.detail.discoveryMode);
            }
            if (event.detail?.autoSearchActive !== undefined) {
                setAutoSearchActive(event.detail.autoSearchActive);
            }
        };

        window.addEventListener('game_update', handleGameUpdate);
        window.addEventListener('map_state_changed', handleMapStateChange);

        return () => {
            window.removeEventListener('game_update', handleGameUpdate);
            window.removeEventListener('map_state_changed', handleMapStateChange);
        };
    }, []);

    if (loading) return null;

    if (!user) {
        return (
            <div className="absolute top-4 right-4 z-[1000] flex gap-2">
                <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
                    Login
                </Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                    Criar Conta
                </Link>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none w-full px-8 items-end">
            {/* Wrapper to allow pointer events for buttons */}
            <div className="pointer-events-auto flex items-center gap-4 bg-slate-900/90 p-2 rounded-xl border border-slate-700 backdrop-blur shadow-2xl">

                {/* Map Controls */}
                <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-4">
                    <button
                        onClick={() => {
                            const event = new CustomEvent('map_toggle_discovery');
                            window.dispatchEvent(event);
                        }}
                        className={`flex flex-col items-center justify-center w-16 h-14 rounded border transition-all group ${!discoveryMode
                            ? 'bg-green-900/20 hover:bg-green-900/50 border-green-800/50 text-green-200'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                            }`}
                        title="Alternar entre Campos e Minhas Terras"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform mb-1">🏠</span>
                        <span className="text-[9px] font-bold uppercase">Terras</span>
                    </button>

                    {/* Auto Search Area Toggle */}
                    <button
                        onClick={() => {
                            const event = new CustomEvent('map_toggle_autosearch');
                            window.dispatchEvent(event);
                        }}
                        className={`flex flex-col items-center justify-center w-16 h-14 rounded border transition-all group ${autoSearchActive
                            ? 'bg-yellow-900/20 hover:bg-yellow-900/50 border-yellow-800/50 text-yellow-200'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700/50'
                            }`}
                        title="Busca automática a cada 5 segundos"
                    >
                        <span className={`text-xl group-hover:scale-110 transition-transform mb-1 ${autoSearchActive ? 'animate-pulse' : ''}`}>🔍</span>
                        <span className="text-[9px] font-bold uppercase">Auto</span>
                    </button>
                </div>

                {/* HUD Buttons */}
                <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-4">
                    <button
                        onClick={() => setShowBarn(true)}
                        className="flex flex-col items-center justify-center w-16 h-14 bg-amber-900/20 hover:bg-amber-900/50 rounded border border-amber-800/50 text-amber-200 transition-all group"
                        title="Celeiro"
                    >
                        <Warehouse className="w-5 h-5 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[9px] font-bold uppercase">Celeiro</span>
                    </button>

                    <button
                        onClick={() => setShowShop(true)}
                        className="flex flex-col items-center justify-center w-16 h-14 bg-emerald-900/20 hover:bg-emerald-900/50 rounded border border-emerald-800/50 text-emerald-200 transition-all group"
                        title="Loja"
                    >
                        <Store className="w-5 h-5 group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[9px] font-bold uppercase">Loja</span>
                    </button>

                    {/* Silo Button */}
                    <button
                        onClick={() => setShowSilo(true)}
                        className="flex flex-col items-center justify-center w-16 h-14 bg-orange-900/20 hover:bg-orange-900/50 rounded border border-orange-800/50 text-orange-200 transition-all group"
                        title="Silo"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform mb-1">🏭</span>
                        <span className="text-[9px] font-bold uppercase">Silo</span>
                    </button>

                    {/* Market Button */}
                    <button
                        onClick={() => setShowMarket(true)}
                        className="flex flex-col items-center justify-center w-16 h-14 bg-green-900/20 hover:bg-green-900/50 rounded border border-green-800/50 text-green-200 transition-all group"
                        title="Mercado"
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform mb-1">🏪</span>
                        <span className="text-[9px] font-bold uppercase">Mercado</span>
                    </button>
                </div>

                {/* Nickname & Stats */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-lg text-white">{user.nickname}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="bg-green-500/20 p-1.5 rounded-full">
                            <Wallet className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Dinheiro</p>
                            <p className="font-mono text-xl text-green-400 font-bold">
                                $ {parseFloat(user.money).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l border-gray-600">
                        <div className="bg-blue-500/20 p-1.5 rounded-full">
                            <Diamond className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Diamantes</p>
                            <p className="font-mono text-xl text-blue-400 font-bold">
                                {user.diamonds}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ShopModal isOpen={showShop} onClose={() => setShowShop(false)} />
            <BarnModal isOpen={showBarn} onClose={() => setShowBarn(false)} />
            <SiloModal isOpen={showSilo} onClose={() => setShowSilo(false)} />
            <MarketModal isOpen={showMarket} onClose={() => setShowMarket(false)} />
        </div>
    );
}

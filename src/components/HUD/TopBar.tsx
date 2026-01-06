'use client';

import { useEffect, useState } from 'react';
import { Wallet, Diamond, User, Store, Warehouse, Tractor } from 'lucide-react';
import Link from 'next/link';
import ShopModal from './ShopModal';
import BarnModal from './BarnModal';

export default function TopBar() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showShop, setShowShop] = useState(false);
    const [showBarn, setShowBarn] = useState(false);

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

        window.addEventListener('game_update', handleGameUpdate);
        return () => window.removeEventListener('game_update', handleGameUpdate);
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

                    {/* Placeholder for Silo */}
                    <button
                        className="flex flex-col items-center justify-center w-16 h-14 bg-slate-800/50 rounded border border-slate-700 text-slate-500 cursor-not-allowed opacity-50"
                        title="Silo (Em breve)"
                    >
                        <span className="text-xl opacity-50">🏭</span>
                        <span className="text-[9px] font-bold uppercase mt-1">Silo</span>
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
        </div>
    );
}

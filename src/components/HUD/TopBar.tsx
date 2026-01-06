'use client';

import { useEffect, useState } from 'react';
import { Wallet, Diamond, User } from 'lucide-react';
import Link from 'next/link';

export default function TopBar() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = () => {
        console.log('Fetching user session...');
        fetch('/api/auth/me', { headers: { 'Cache-Control': 'no-store' } })
            .then(res => {
                console.log('Auth response status:', res.status);
                if (res.ok) return res.json();
                return null;
            })
            .then(data => {
                console.log('Auth data:', data);
                if (data?.user) setUser(data.user);
                setLoading(false);
            })
            .catch(err => console.error('Auth fetch error:', err));
    };

    useEffect(() => {
        fetchUser();

        const handleGameUpdate = () => {
            console.log('Game update received, refreshing user...');
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
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
            {/* Main Stats Bar */}
            <div className="bg-gray-900/90 text-white p-2 rounded-lg shadow-xl border border-gray-700 backdrop-blur pointer-events-auto flex items-center gap-6">

                {/* Nickname */}
                <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-lg">{user.nickname}</span>
                </div>

                {/* Money */}
                <div className="flex items-center gap-2">
                    <div className="bg-green-500/20 p-1.5 rounded-full">
                        <Wallet className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Dinheiro</p>
                        <p className="font-mono text-xl text-green-400 font-bold">
                            $ {user.money.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Diamonds */}
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
    );
}

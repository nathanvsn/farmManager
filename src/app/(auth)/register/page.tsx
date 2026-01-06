'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [form, setForm] = useState({ nickname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        const data = await res.json();
        if (data.success) {
            router.push('/');
            router.refresh();
        } else {
            setError(data.error);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-center text-green-500">Criar Fazenda</h2>

                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1 ml-1 text-gray-400">Nome da Fazenda (Nickname)</label>
                        <input
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-green-500 outline-none transition"
                            placeholder="Ex: Fazenda Feliz"
                            value={form.nickname}
                            onChange={e => setForm({ ...form, nickname: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 ml-1 text-gray-400">Email</label>
                        <input
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-green-500 outline-none transition"
                            type="email"
                            placeholder="seu@email.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1 ml-1 text-gray-400">Senha</label>
                        <input
                            className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-green-500 outline-none transition"
                            type="password"
                            placeholder="******"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition transform hover:scale-[1.02]">
                        Começar Aventura
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-500 text-sm">
                    Já tem uma conta? <Link href="/login" className="text-green-500 hover:underline">Entrar</Link>
                </p>
            </div>
        </div>
    );
}

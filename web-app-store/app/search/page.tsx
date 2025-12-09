'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppCard from '@/components/AppCard';
import { App } from '@/utils/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const [query, setQuery] = useState(initialQuery);
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!initialQuery) {
            setApps([]);
            return;
        }

        const fetchApps = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(initialQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setApps(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchApps();
    }, [initialQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6">Search</h1>

            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for apps, games, and more..."
                        className="w-full bg-gray-100 border-none rounded-xl py-3 px-4 pl-12 text-lg focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                    <svg className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </form>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <>
                    {apps.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {apps.map(app => (
                                <AppCard key={app.app_id} app={app} />
                            ))}
                        </div>
                    ) : initialQuery ? (
                        <div className="text-center py-12 text-gray-500">
                            No results found for "{initialQuery}"
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Type something to search
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchContent />
        </Suspense>
    );
}

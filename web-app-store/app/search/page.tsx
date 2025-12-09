'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppCard from '@/components/AppCard';
import { App, Category } from '@/utils/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const categoryQuery = searchParams.get('category') || '';

    const [query, setQuery] = useState(initialQuery);
    const [apps, setApps] = useState<App[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fetch categories on mount
    useEffect(() => {
        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Failed to fetch categories", err));
    }, []);

    // Perform search or filter
    useEffect(() => {
        const fetchApps = async () => {
            setLoading(true);
            setApps([]);
            try {
                let url = '';
                // Logic:
                // If both present -> /api/search?q=...&category=...
                // If only category -> /api/apps?category=...
                // If only q -> /api/search?q=...
                // If neither -> do nothing

                if (initialQuery && categoryQuery) {
                    url = `/api/search?q=${encodeURIComponent(initialQuery)}&category=${encodeURIComponent(categoryQuery)}`;
                } else if (categoryQuery) {
                    url = `/api/apps?category=${encodeURIComponent(categoryQuery)}&limit=50`;
                } else if (initialQuery) {
                    url = `/api/search?q=${encodeURIComponent(initialQuery)}`;
                } else {
                    setLoading(false);
                    return;
                }

                const res = await fetch(url);
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
    }, [initialQuery, categoryQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Preserve category in URL if exists
        let url = `/search?q=${encodeURIComponent(query)}`;
        if (categoryQuery) {
            url += `&category=${encodeURIComponent(categoryQuery)}`;
        }
        router.push(url);
    };

    const handleCategoryClick = (tagId: string | null) => {
        // Preserve query in URL if exists
        let url = '/search';
        const params = new URLSearchParams();

        if (initialQuery) {
            params.set('q', initialQuery);
        }

        if (tagId) {
            params.set('category', tagId);
        }

        const searchString = params.toString();
        if (searchString) {
            url += `?${searchString}`;
        }

        router.push(url);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-6">Search</h1>

            <form onSubmit={handleSearch} className="mb-6">
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

            {/* Category Pills */}
            <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex space-x-3">
                    {/* None Pill */}
                    <button
                        onClick={() => handleCategoryClick(null)}
                        className={`
                            px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                            ${!categoryQuery
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        None
                    </button>

                    {categories.map(cat => (
                        <button
                            key={cat.tag_id}
                            onClick={() => handleCategoryClick(cat.tag_id)}
                            className={`
                                px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                                ${categoryQuery === cat.tag_id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
                            `}
                        >
                            {cat.tag_id.charAt(0).toUpperCase() + cat.tag_id.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <>
                    {apps.length > 0 ? (
                        <div>
                            {categoryQuery && (
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 capitalize">
                                    {categoryQuery} Apps
                                </h2>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {apps.map(app => (
                                    <AppCard key={app.app_id} app={app} />
                                ))}
                            </div>
                        </div>
                    ) : (initialQuery || categoryQuery) ? (
                        <div className="text-center py-12 text-gray-500">
                            No results found.
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Select a category or type to search
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

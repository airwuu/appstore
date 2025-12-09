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
    const [maxPrice, setMaxPrice] = useState(10);
    const [isPriceOpen, setIsPriceOpen] = useState(false);

    // Sort state
    const [sortBy, setSortBy] = useState('downloads'); // Default sort
    const [sortOrder, setSortOrder] = useState('desc'); // Default order
    const [isSortOpen, setIsSortOpen] = useState(false);

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
                // Logic:
                // Base URLs + max_price + sort param

                const params = new URLSearchParams();
                params.set('max_price', maxPrice.toString());
                params.set('limit', '50');
                params.set('sort_by', sortBy);
                params.set('sort_order', sortOrder);

                let url = '';

                if (initialQuery && categoryQuery) {
                    params.set('q', initialQuery);
                    params.set('category', categoryQuery);
                    url = `/api/search?${params.toString()}`;
                } else if (categoryQuery) {
                    params.set('category', categoryQuery);
                    url = `/api/apps?${params.toString()}`;
                } else if (initialQuery) {
                    params.set('q', initialQuery);
                    url = `/api/search?${params.toString()}`;
                } else {
                    // Default view: fetch all apps (filtered by price/sort)
                    url = `/api/apps?${params.toString()}`;
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

        // Debounce fetching for slider and typing
        const timeoutId = setTimeout(fetchApps, 300);
        return () => clearTimeout(timeoutId);
    }, [initialQuery, categoryQuery, maxPrice, sortBy, sortOrder]);

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

    const handleSortChange = (by: string, order: string) => {
        setSortBy(by);
        setSortOrder(order);
        setIsSortOpen(false);
    };

    const getSortLabel = () => {
        if (sortBy === 'price') return sortOrder === 'asc' ? 'Price: Low to High' : 'Price: High to Low';
        if (sortBy === 'rating') return sortOrder === 'desc' ? 'Rating: High to Low' : 'Rating: Low to High';
        if (sortBy === 'downloads') return 'Most Popular';
        return 'Sort';
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

            <div className="flex items-center space-x-3 mb-8 relative">
                {/* Price Filter Dropdown */}
                <div className="relative z-20 shrink-0">
                    <button
                        onClick={() => { setIsPriceOpen(!isPriceOpen); setIsSortOpen(false); }}
                        className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                            ${maxPrice < 10
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        <span>Price</span>
                        {maxPrice < 10 && (
                            <span className="bg-white/20 px-1.5 rounded text-xs font-semibold">
                                {maxPrice === 0 ? 'Free' : `<$${maxPrice}`}
                            </span>
                        )}
                        <svg
                            className={`w-4 h-4 transition-transform duration-200 ${isPriceOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isPriceOpen && (
                        <>
                            <div className="fixed inset-0 z-0 bg-black/5" onClick={() => setIsPriceOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-5 z-10 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm font-semibold text-gray-900">Maximum Price</span>
                                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                        {maxPrice === 0 ? 'Free' : `$${maxPrice}`}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-3 font-medium">
                                    <span>Free</span>
                                    <span>$10+</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative z-20 shrink-0">
                    <button
                        onClick={() => { setIsSortOpen(!isSortOpen); setIsPriceOpen(false); }}
                        className={`
                            flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                            ${sortBy !== 'downloads'
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        <span>{getSortLabel()}</span>
                    </button>

                    {isSortOpen && (
                        <>
                            <div className="fixed inset-0 z-0 bg-black/5" onClick={() => setIsSortOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-2 z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                                <button
                                    onClick={() => handleSortChange('downloads', 'desc')}
                                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'downloads' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Most Popular
                                </button>
                                <button
                                    onClick={() => handleSortChange('price', 'asc')}
                                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'price' && sortOrder === 'asc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Price: Low to High
                                </button>
                                <button
                                    onClick={() => handleSortChange('price', 'desc')}
                                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'price' && sortOrder === 'desc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Price: High to Low
                                </button>
                                <button
                                    onClick={() => handleSortChange('rating', 'desc')}
                                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'rating' && sortOrder === 'desc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Rating: High to Low
                                </button>
                                <button
                                    onClick={() => handleSortChange('rating', 'asc')}
                                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${sortBy === 'rating' && sortOrder === 'asc' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Rating: Low to High
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-200 shrink-0"></div>

                {/* Categories Scroll Area */}
                <div className="flex-1 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
                    <div className="flex space-x-3">
                        {/* None Pill */}
                        <button
                            onClick={() => handleCategoryClick(null)}
                            className={`
                                px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border
                                ${!categoryQuery
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }
                            `}
                        >
                            All
                        </button>

                        {categories.map(cat => (
                            <button
                                key={cat.tag_id}
                                onClick={() => handleCategoryClick(cat.tag_id)}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border
                                    ${categoryQuery === cat.tag_id
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {cat.tag_id.charAt(0).toUpperCase() + cat.tag_id.slice(1)}
                            </button>
                        ))}
                    </div>
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

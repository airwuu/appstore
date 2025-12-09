"use client";

import { App } from '@/utils/types';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { MouseEvent } from 'react';

interface AppCardProps {
    app: App;
}

export default function AppCard({ app }: AppCardProps) {
    const { user } = useUser();
    // Generate a distinct color/gradient based on app_id to act as placeholder for icon
    const colors = [
        'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400', 'bg-indigo-400'
    ];
    const bgColor = colors[app.app_id % colors.length];

    const isInstalled = user?.app_ids?.includes(app.app_id) || false;

    return (
        <Link href={`/apps/${app.app_id}`} className="group block">
            <div className="flex items-center space-x-4 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                <div className={`w-16 h-16 ${bgColor} rounded-[14px] shadow-sm flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:shadow-md transition-all`}>
                    {/* Fallback for icon since backend returns dummy filenames */}
                    {app.app_name[0]}
                </div>
                <div className="flex-1 min-w-0 border-b border-gray-100 pb-2 group-hover:border-transparent">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{app.app_name}</h3>
                    <p className="text-xs text-gray-500 truncate">Utilities</p> {/* Placeholder category */}
                    <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-gray-400 text-xs">★</span>
                            <span className="text-xs text-gray-500 ml-1">{app.rating.toFixed(1)}</span>
                        </div>
                        <div className={`
                            text-xs font-bold px-4 py-1 rounded-full uppercase transition-colors
                            ${isInstalled
                                ? 'bg-gray-200 text-gray-500'
                                : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                            }
                        `}>
                            {isInstalled ? 'Open' : (app.price === 0 ? 'Get' : `$${app.price}`)}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

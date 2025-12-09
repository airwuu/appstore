"use client";

import { useState } from 'react';
import { AppDetails } from '@/utils/types';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function DownloadButton({ app }: { app: AppDetails }) {
    const { user, installApp } = useUser();
    const router = useRouter(); // To refresh page after updates
    const [downloading, setDownloading] = useState(false);

    const isInstalled = user?.app_ids?.includes(app.app_id) || false;

    const handleDownload = async () => {
        if (!user) {
            alert("Please log in to download apps.");
            return;
        }

        setDownloading(true);
        // Simulate network delay for effect
        setTimeout(async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/apps/${app.app_id}/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.user_id })
                });

                if (res.ok) {
                    installApp(app.app_id);
                    router.refresh(); // Refresh to update download count
                } else {
                    alert("Download failed.");
                }
            } catch (e) {
                console.error(e);
                alert("Error downloading app.");
            } finally {
                setDownloading(false);
            }
        }, 1500);
    };

    return (
        <div className="flex items-center gap-4 mb-2">
            <button
                onClick={handleDownload}
                disabled={downloading || isInstalled}
                className={`
                    rounded-full px-8 py-2 font-bold transition-all duration-300 min-w-[120px]
                    ${isInstalled
                        ? 'bg-gray-200 text-gray-500 cursor-default'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                `}
            >
                {downloading ? "..." : isInstalled ? "Open" : (app.price === 0 ? 'Get' : `$${app.price}`)}
            </button>
            <div className="text-gray-400 text-sm font-medium">
                {isInstalled ? "Installed" : "In-App Purchases"}
            </div>
        </div>
    );
}

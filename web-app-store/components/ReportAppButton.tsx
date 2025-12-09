"use client";
import { useState } from 'react';

export default function ReportAppButton({ appId }: { appId: number }) {
    const [isReporting, setIsReporting] = useState(false);

    const handleReport = async () => {
        const reason = prompt("Please provide a reason for reporting this app:");
        if (!reason) return;

        setIsReporting(true);
        try {
            const res = await fetch(`http://localhost:5000/api/apps/${appId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                alert("App reported successfully. Admins will review it.");
            } else {
                alert("Failed to report app.");
            }
        } catch (e) {
            console.error(e);
            alert("Error reporting app.");
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <button
            onClick={handleReport}
            disabled={isReporting}
            className="mt-8 text-red-500 text-sm font-medium hover:text-red-600 hover:underline flex items-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
            </svg>
            {isReporting ? "Reporting..." : "Report this App"}
        </button>
    );
}

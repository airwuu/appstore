import { AppDetails } from '@/utils/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DownloadButton from '@/components/AppActions';
import ReviewSection from '@/components/ReviewSection';

async function getAppDetails(id: string): Promise<AppDetails | null> {
    const res = await fetch(`http://localhost:5000/api/apps/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function AppDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const app = await getAppDetails(id);

    if (!app) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <Link href="/" className="text-blue-600 mb-6 inline-block font-medium hover:underline">
                ← Back to Browse
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-6 mb-10">
                <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-[22%] bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md flex items-center justify-center text-5xl text-white font-bold shrink-0`}>
                    {app.app_name[0]}
                </div>
                <div className="flex flex-col justify-start pt-2">
                    <h1 className="text-3xl font-bold mb-1">{app.app_name}</h1>
                    <p className="text-gray-500 text-lg mb-4">Essential utility for your life</p>

                    <DownloadButton app={app} />
                </div>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Ratings Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                    <div className="text-gray-400 font-medium text-xs uppercase tracking-wide mb-1">Ratings</div>
                    <div className="text-2xl font-bold text-gray-900">{app.rating.toFixed(1)}</div>
                    <div className="text-gray-400 text-xs">★★★★★</div>
                </div>
                <div className="text-center border-l border-r border-gray-100">
                    <div className="text-gray-400 font-medium text-xs uppercase tracking-wide mb-1">Downloads</div>
                    <div className="text-2xl font-bold text-gray-900">{app.downloads}</div>
                </div>
                <div className="text-center">
                    <div className="text-gray-400 font-medium text-xs uppercase tracking-wide mb-1">Developer</div>
                    <div className="text-2xl font-bold text-gray-900 truncate px-2">Tech Corp</div>
                </div>
            </div>

            <hr className="border-gray-200 mb-8" />

            {/* Description */}
            <div className="mb-10">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                    {app.description || "No description available."}
                </p>
            </div>

            {/* Comments */}
            <div>
                <ReviewSection appId={app.app_id} />
                <div className="space-y-6">
                    {app.comments && app.comments.length > 0 ? (
                        app.comments.map(c => (
                            <div key={c.comment_id} className="bg-gray-100 rounded-xl p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">{c.username}</span>
                                    <span className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex text-amber-500 mb-2">
                                    {"★".repeat(Math.round(c.stars))}
                                    <span className="text-gray-300">{"★".repeat(5 - Math.round(c.stars))}</span>
                                </div>
                                <p className="text-gray-700">{c.comment}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-gray-500">No reviews yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

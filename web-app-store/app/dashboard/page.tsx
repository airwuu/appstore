"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user } = useUser();
    const router = useRouter();

    // Tab State: 'users' or 'apps'
    const [activeTab, setActiveTab] = useState<'users' | 'apps'>('users');

    // Reporting States (Users)
    const [reportedUsers, setReportedUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userReports, setUserReports] = useState<any[]>([]);

    // Reporting States (Apps)
    const [reportedApps, setReportedApps] = useState<any[]>([]);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [appReports, setAppReports] = useState<any[]>([]);

    const [searchQuery, setSearchQuery] = useState("");

    // Add App States
    const [categories, setCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [appName, setAppName] = useState("");
    const [appPrice, setAppPrice] = useState("");
    const [appCategory, setAppCategory] = useState("");
    const [appDeveloper, setAppDeveloper] = useState("");
    const [appDescription, setAppDescription] = useState("");
    const [appIcon, setAppIcon] = useState("");
    const [appImages, setAppImages] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && user.username !== 'evan_engineer') {
            router.push('/');
            return;
        }

        // Fetch All Initial Data
        fetchData();

    }, [user, router]);

    const fetchData = () => {
        // Users
        fetch('http://localhost:5000/api/admin/reported_users')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setReportedUsers(data); })
            .catch(err => console.error(err));

        // Apps
        fetch('http://localhost:5000/api/admin/reported_apps')
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setReportedApps(data); })
            .catch(err => console.error(err));

        // Categories
        fetch('http://localhost:5000/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));

        // User List for Dropdown
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    };

    const handleSelectUser = (u: any) => {
        setSelectedUser(u);
        setSelectedApp(null); // Deselect app
        fetch(`http://localhost:5000/api/admin/users/${u.user_id}/reports`)
            .then(res => res.json())
            .then(data => setUserReports(data))
            .catch(err => console.error(err));
    };

    const handleSelectApp = (a: any) => {
        setSelectedApp(a);
        setSelectedUser(null); // Deselect user
        fetch(`http://localhost:5000/api/admin/apps/${a.app_id}/reports`)
            .then(res => res.json())
            .then(data => setAppReports(data))
            .catch(err => console.error(err));
    };

    const handleAddApp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appName || !appDescription || !appCategory) return;

        setIsSubmitting(true);
        try {
            const imagesList = appImages.split(',').map(s => s.trim()).filter(Boolean);

            const res = await fetch('http://localhost:5000/api/apps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: appName,
                    price: parseFloat(appPrice) || 0,
                    description: appDescription,
                    category: appCategory,
                    icon: appIcon || 'default_icon.png',
                    images: imagesList,
                    developer_id: appDeveloper ? parseInt(appDeveloper) : null
                })
            });

            if (res.ok) {
                alert("App created successfully!");
                setAppName("");
                setAppPrice("");
                setAppDescription("");
                setAppIcon("");
                setAppImages("");
                setAppCategory("");
                setAppDeveloper("");
            } else {
                alert("Failed to create app.");
            }
        } catch (e) {
            console.error(e);
            alert("Error creating app.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredUsers = [...reportedUsers].filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredApps = [...reportedApps].filter(a =>
        a.app_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user || user.username !== 'evan_engineer') {
        return <div className="p-10">Access Denied</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Add App Form */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Add New App</h2>
                    <form onSubmit={handleAddApp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">App Name *</label>
                            <input type="text" value={appName} onChange={e => setAppName(e.target.value)} className="w-full p-2 border rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                            <input type="number" step="0.01" value={appPrice} onChange={e => setAppPrice(e.target.value)} className="w-full p-2 border rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category *</label>
                            <select value={appCategory} onChange={e => setAppCategory(e.target.value)} className="w-full p-2 border rounded" required>
                                <option value="">Select Category</option>
                                {categories.map(c => (
                                    <option key={c.tag_id} value={c.tag_id}>{c.tag_id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Developer (Owner)</label>
                            <select value={appDeveloper} onChange={e => setAppDeveloper(e.target.value)} className="w-full p-2 border rounded">
                                <option value="">Select Developer</option>
                                {users.map(u => (
                                    <option key={u.user_id} value={u.user_id}>{u.username}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description *</label>
                            <textarea value={appDescription} onChange={e => setAppDescription(e.target.value)} className="w-full p-2 border rounded" rows={3} required />
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                            {isSubmitting ? 'Creating...' : 'Create App'}
                        </button>
                    </form>
                </div>

                {/* MIDDLE COLUMN: List */}
                <div className="bg-white rounded-xl shadow p-0 h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex border-b">
                        <button
                            className={`flex-1 py-4 font-medium text-sm ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => { setActiveTab('users'); setSearchQuery(""); }}
                        >
                            Reported Users
                        </button>
                        <button
                            className={`flex-1 py-4 font-medium text-sm ${activeTab === 'apps' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => { setActiveTab('apps'); setSearchQuery(""); }}
                        >
                            Reported Apps
                        </button>
                    </div>

                    <div className="p-4 border-b">
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="w-full p-2 border rounded bg-gray-50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 ">
                        {activeTab === 'users' ? (
                            <div className="divide-y">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.user_id}
                                        onClick={() => handleSelectUser(u)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center
                                            ${selectedUser?.user_id === u.user_id ? 'bg-blue-50' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {u.username[0].toUpperCase()}
                                            </div>
                                            <span className="font-medium text-gray-900">{u.username}</span>
                                        </div>
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{u.report_count}</span>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && <p className="text-gray-500 text-center mt-8">No users found.</p>}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredApps.map(a => (
                                    <div
                                        key={a.app_id}
                                        onClick={() => handleSelectApp(a)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center
                                            ${selectedApp?.app_id === a.app_id ? 'bg-blue-50' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                {a.app_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm leading-none">{a.app_name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{a.developer_name || 'Unknown'}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">{a.report_count}</span>
                                    </div>
                                ))}
                                {filteredApps.length === 0 && <p className="text-gray-500 text-center mt-8">No specific apps reported.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Details */}
                <div className="bg-white rounded-xl shadow h-[80vh] overflow-y-auto">
                    {activeTab === 'users' && selectedUser && (
                        <div className="p-6">
                            <div className="border-b pb-4 mb-6">
                                <h2 className="text-2xl font-bold">{selectedUser.username}</h2>
                                <p className="text-gray-500">User ID: {selectedUser.user_id}</p>
                            </div>

                            <h3 className="text-sm font-semibold mb-4 text-gray-900 uppercase tracking-wide">Recent Reports</h3>
                            <div className="space-y-4">
                                {userReports.map((report, idx) => (
                                    <div key={report.report_id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-medium text-gray-500">{new Date(report.report_date).toLocaleDateString()}</span>
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">Review Flagged</span>
                                        </div>

                                        <div className="mb-4 bg-white p-3 rounded border border-gray-200 shadow-sm">
                                            <p className="text-gray-900 italic text-sm">"{report.flagged_content}"</p>
                                            <div className="mt-2 flex text-amber-400 text-xs">
                                                {"★".repeat(Math.round(report.stars || 0))}
                                                <span className="text-gray-200">{"★".repeat(5 - Math.round(report.stars || 0))}</span>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reason</p>
                                            <p className="text-gray-700 text-sm">{report.report_reason}</p>
                                        </div>
                                    </div>
                                ))}
                                {userReports.length === 0 && <p>No detailed reports found.</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'apps' && selectedApp && (
                        <div className="p-6">
                            <div className="border-b pb-4 mb-6 flex items-start gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm flex items-center justify-center text-white font-bold text-2xl shrink-0">
                                    {selectedApp.app_name[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedApp.app_name}</h2>
                                    <p className="text-blue-600 font-medium">{selectedApp.developer_name || 'Unknown Developer'}</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-semibold mb-4 text-gray-900 uppercase tracking-wide">App Reports</h3>
                            <div className="space-y-4">
                                {appReports.map((report, idx) => (
                                    <div key={report.report_id || idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-medium text-gray-500">{new Date(report.report_date).toLocaleDateString()}</span>
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">App Flagged</span>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reason</p>
                                            <p className="text-gray-900 text-sm font-medium">{report.report_reason}</p>
                                        </div>
                                    </div>
                                ))}
                                {appReports.length === 0 && <p className="text-gray-500">No reports found.</p>}
                            </div>
                        </div>
                    )}

                    {(!selectedUser && !selectedApp) && (
                        <div className="h-full flex items-center justify-center text-gray-400 p-10 text-center">
                            Select a {activeTab === 'users' ? 'user' : 'app'} on the left to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

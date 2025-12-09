"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const { user } = useUser();
    const router = useRouter();
    const [reportedUsers, setReportedUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userReports, setUserReports] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (user && user.username !== 'evan_engineer') {
            router.push('/');
            return;
        }

        // Fetch reported users
        fetch('http://localhost:5000/api/admin/reported_users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReportedUsers(data);
                }
            })
            .catch(err => console.error("Failed to fetch reported users", err));

    }, [user, router]);

    const handleSelectUser = (u: any) => {
        setSelectedUser(u);
        fetch(`http://localhost:5000/api/admin/users/${u.user_id}/reports`)
            .then(res => res.json())
            .then(data => setUserReports(data))
            .catch(err => console.error("Failed to fetch user reports", err));
    };

    const sortedUsers = [...reportedUsers].filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!user || user.username !== 'evan_engineer') {
        return <div className="p-10">Access Denied</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User List Panel */}
                <div className="bg-white rounded-xl shadow p-6 h-[80vh] overflow-hidden flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Reported Users</h2>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full p-2 border rounded mb-4"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="overflow-y-auto flex-1 space-y-2">
                        {sortedUsers.map(u => (
                            <div
                                key={u.user_id}
                                onClick={() => handleSelectUser(u)}
                                className={`p-3 rounded cursor-pointer flex justify-between items-center
                                    ${selectedUser?.user_id === u.user_id ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50 border border-transparent'}
                                `}
                            >
                                <span className="font-medium">{u.username}</span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-bold">{u.report_count}</span>
                            </div>
                        ))}
                        {sortedUsers.length === 0 && <p className="text-gray-500 text-center mt-4">No users found.</p>}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="md:col-span-2 bg-white rounded-xl shadow p-6 h-[80vh] overflow-y-auto">
                    {selectedUser ? (
                        <>
                            <div className="border-b pb-4 mb-4">
                                <h2 className="text-2xl font-bold">{selectedUser.username}</h2>
                                <p className="text-gray-500">User ID: {selectedUser.user_id}</p>
                            </div>

                            <h3 className="text-lg font-semibold mb-4 text-red-600">Flagged Comments</h3>
                            <div className="space-y-4">
                                {userReports.map((report, idx) => (
                                    <div key={report.report_id || idx} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs text-gray-400">Reported on {new Date(report.report_date).toLocaleDateString()}</span>
                                            <div className="flex text-amber-500 text-sm">
                                                {"★".repeat(Math.round(report.stars || 0))}
                                                <span className="text-gray-300">{"★".repeat(5 - Math.round(report.stars || 0))}</span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <p className="font-semibold text-xs text-uppercase text-gray-500 mb-1">FLAGGED CONTENT</p>
                                            <p className="text-gray-900 bg-white p-3 rounded border italic">"{report.flagged_content}"</p>
                                        </div>

                                        <div>
                                            <p className="font-semibold text-xs text-uppercase text-gray-500 mb-1">REPORT REASON</p>
                                            <p className="text-red-700">{report.report_reason}</p>
                                        </div>
                                    </div>
                                ))}
                                {userReports.length === 0 && <p>No detailed reports found.</p>}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Select a user to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

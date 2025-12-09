"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface Comment {
    comment_id: number;
    user_id: number;
    username: string;
    stars: number;
    comment: string;
    date: string;
}

export default function ReviewList({ initialComments }: { initialComments: Comment[] }) {
    const { user } = useUser();
    const router = useRouter();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [editRating, setEditRating] = useState(5);

    const startEdit = (c: Comment) => {
        setEditingId(c.comment_id);
        setEditText(c.comment);
        setEditRating(c.stars);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    const saveEdit = async (commentId: number) => {
        if (!user) return;
        try {
            const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    stars: editRating,
                    comment: editText
                })
            });
            if (res.ok) {
                setEditingId(null);
                router.refresh();
            } else {
                alert("Failed to update comment");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating comment");
        }
    };

    const deleteComment = async (commentId: number) => {
        if (!user || !confirm("Are you sure you want to delete this review?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id })
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Failed to delete comment");
            }
        } catch (e) {
            console.error(e);
            alert("Error deleting comment");
        }
    };

    // Use initialComments unless we want to fetch? Router refresh will update the prop passed from server component
    // BUT React might not reconcile if we just use props. 
    // Actually, when router.refresh() happens, the Server Component re-renders and passes new initialComments.

    return (
        <div className="space-y-6">
            {initialComments && initialComments.length > 0 ? (
                initialComments.map(c => (
                    <div key={c.comment_id} className="bg-gray-100 rounded-xl p-5">
                        {editingId === c.comment_id ? (
                            // Edit Mode
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold">Edit Review</h3>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setEditRating(star)}
                                                className={`text-lg ${editRating >= star ? 'text-amber-500' : 'text-gray-300'}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 mb-2"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={cancelEdit} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                    <button onClick={() => saveEdit(c.comment_id)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Save</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{c.username}</span>
                                            <span className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex text-amber-500 mt-1">
                                            {"★".repeat(Math.round(c.stars))}
                                            <span className="text-gray-300">{"★".repeat(5 - Math.round(c.stars))}</span>
                                        </div>
                                    </div>
                                    {user && user.user_id === c.user_id && (
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(c)} className="text-xs text-blue-600 hover:underline">Edit</button>
                                            <button onClick={() => deleteComment(c.comment_id)} className="text-xs text-red-600 hover:underline">Delete</button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-700 mt-2">{c.comment}</p>
                            </>
                        )}
                    </div>
                ))
            ) : (
                <div className="text-gray-500">No reviews yet.</div>
            )}
        </div>
    );
}

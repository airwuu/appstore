"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function ReviewSection({ appId }: { appId: number }) {
    const { user } = useUser();
    const router = useRouter();
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmittingReview(true);
        try {
            const res = await fetch(`http://localhost:5000/api/apps/${appId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    stars: rating,
                    comment: reviewText
                })
            });

            if (res.ok) {
                setShowReviewForm(false);
                setReviewText("");
                router.refresh();
            } else {
                alert("Failed to post review.");
            }
        } catch (e) {
            console.error(e);
            alert("Error posting review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Reviews</h2>
                {user && !showReviewForm && (
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="text-blue-600 font-medium hover:underline"
                    >
                        Write a Review
                    </button>
                )}
            </div>

            {showReviewForm && (
                <form onSubmit={submitReview} className="bg-gray-50 p-6 rounded-xl mb-8 animate-in slide-in-from-top-4 fade-in">
                    <h3 className="font-bold mb-4">Rate this App</h3>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`text-2xl ${rating >= star ? 'text-amber-500' : 'text-gray-300'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write your review here..."
                        className="w-full p-3 rounded-lg border border-gray-300 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        rows={4}
                        required
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setShowReviewForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submittingReview}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submittingReview ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

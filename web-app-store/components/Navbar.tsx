"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser, User } from '@/context/UserContext';

export default function Navbar() {
    const { user, login, logout } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        // Fetch users for the dropdown
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error("Failed to fetch users", err));
    }, []);

    const handleLogin = (u: User) => {
        login(u);
        setIsDropdownOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="font-semibold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                            <span className="text-2xl">🍌</span> Banana Store
                        </Link>
                        <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-500">
                            <Link href="/" className="hover:text-blue-600 transition-colors">Discover</Link>
                            <Link href="/arcade" className="hover:text-blue-600 transition-colors">Arcade</Link>
                            <Link href="/create" className="hover:text-blue-600 transition-colors">Create</Link>
                            <Link href="/work" className="hover:text-blue-600 transition-colors">Work</Link>
                            <Link href="/play" className="hover:text-blue-600 transition-colors">Play</Link>
                            <Link href="/categories" className="hover:text-blue-600 transition-colors">Categories</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600"
                            >
                                {user ? (
                                    <>
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                        <span className="hidden sm:inline">{user.username}</span>
                                    </>
                                ) : (
                                    <span className="text-gray-500">Log In</span>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                                    {users.map(u => (
                                        <button
                                            key={u.user_id}
                                            onClick={() => handleLogin(u)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            {u.username}
                                        </button>
                                    ))}
                                    {user && (
                                        <>
                                            <hr className="my-1 border-gray-200" />
                                            <button
                                                onClick={() => {
                                                    logout();
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link href="/search" className="text-gray-500 hover:text-blue-600 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}

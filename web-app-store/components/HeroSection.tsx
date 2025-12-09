'use client';

import { App } from '@/utils/types';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
    featuredApps: App[];
}

export default function HeroSection({ featuredApps }: HeroSectionProps) {
    const slider = useRef<HTMLDivElement>(null);
    const isDown = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const hasMoved = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const router = useRouter();

    if (!featuredApps.length) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        isDown.current = true;
        hasMoved.current = false;
        setIsDragging(true);
        if (slider.current) {
            startX.current = e.pageX - slider.current.offsetLeft;
            scrollLeft.current = slider.current.scrollLeft;
        }
    };

    const handleMouseLeave = () => {
        isDown.current = false;
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        isDown.current = false;
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current) return;
        e.preventDefault();
        hasMoved.current = true; // Mark as dragged
        if (slider.current) {
            const x = e.pageX - slider.current.offsetLeft;
            const walk = (x - startX.current) * 2; // scroll-fast
            slider.current.scrollLeft = scrollLeft.current - walk;
        }
    };

    const handleCardClick = (id: number) => {
        if (!hasMoved.current) {
            router.push(`/apps/${id}`);
        }
    };

    return (
        <div className="relative overflow-hidden mb-8">
            <div
                ref={slider}
                className={`flex overflow-x-auto pb-8 px-4 sm:px-6 lg:px-8 space-x-4 no-scrollbar cursor-grab active:cursor-grabbing ${isDragging ? '' : 'snap-x snap-mandatory'}`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {featuredApps.map((app, idx) => (
                    <div
                        key={app.app_id}
                        onClick={() => handleCardClick(app.app_id)}
                        className="snap-center shrink-0 w-[85vw] sm:w-96 h-64 bg-white rounded-2xl shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02] duration-300 group select-none"
                    >
                        {/* Background gradient/image placeholder */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(idx)} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

                        <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                            <p className="text-xs uppercase font-bold tracking-wider mb-1 text-white/80">Featured</p>
                            <h2 className="text-2xl font-bold mb-1">{app.app_name}</h2>
                            <p className="text-sm text-white/90 mb-4 line-clamp-2">Experience the best in class.</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getGradient(idx: number) {
    const gradients = [
        'from-blue-500 to-purple-600',
        'from-pink-500 to-rose-500',
        'from-amber-400 to-orange-500',
        'from-emerald-400 to-teal-600'
    ];
    return gradients[idx % gradients.length];
}

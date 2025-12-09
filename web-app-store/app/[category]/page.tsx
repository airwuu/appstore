
import AppCard from "@/components/AppCard";
import { App } from "@/utils/types";

export const dynamic = 'force-dynamic';

// Map URL categories to DB tags
const CATEGORY_MAP: Record<string, string> = {
    play: 'game',
    work: 'productivity',
    arcade: 'game',
    create: 'photography',
    // Add more mappings if needed, or use the param directly if no mapping exists
};

// Helper to capitalize first letter
function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

async function getAppsByCategory(category: string): Promise<App[]> {
    // Use mapping if exists, else use exact string
    const tag = CATEGORY_MAP[category.toLowerCase()] || category;

    const res = await fetch(`http://localhost:5000/api/apps?category=${tag}&limit=50`, { cache: 'no-store' });

    if (!res.ok) {
        console.error("Failed to fetch apps for category:", category);
        return [];
    }

    return res.json();
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
    const { category } = await params; // Next.js 15+ params are async? Or just covering bases. Next.js 13/14 params are object.
    // Actually in Next.js 13/14 params is passed as prop directly, but let's handle it safely.
    // Wait, in latest Next.js params is a Promise in some configs? 
    // Let's assume standard Next.js 14 behavior where params is an object.
    // But strictly typing it: { params: { category: string } } 
    // However, `await params` is a pattern in newer Next.js. I'll stick to standard access but good to keep in mind.
    // Update: Next.js 15 makes params async. I should probably await it if I'm on 15, or just access if 14.
    // Given I saw `next.config.ts`, it might be new. Standard access is safer for now unless I get an error.

    // Actually, to be safe and cross-compatible with recent changes:
    const categoryName = category;
    const apps = await getAppsByCategory(categoryName);

    return (
        <div className="max-w-7xl mx-auto pb-12 pt-20"> {/* Added pt-20 for navbar offset */}
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{capitalize(categoryName)} Apps</h1>
                    <span className="text-gray-500 text-sm">{apps.length} results</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
                    {apps.map((app) => (
                        <AppCard key={app.app_id} app={app} />
                    ))}
                </div>

                {apps.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <p>No apps found for this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

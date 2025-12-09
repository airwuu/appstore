import AppCard from "@/components/AppCard";
import HeroSection from "@/components/HeroSection";
import { App } from "@/utils/types";

// Force dynamic rendering since we are fetching from local API
export const dynamic = 'force-dynamic';

async function getApps(): Promise<App[]> {
  const res = await fetch('http://localhost:5000/api/apps?limit=50', { cache: 'no-store' });

  if (!res.ok) {
    // Fallback or empty if DB fails
    console.error("Failed to fetch apps");
    return [];
  }

  return res.json();
}

export default async function Home() {
  const apps = await getApps();
  const featured = apps.slice(0, 4);
  const remaining = apps;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="pt-6">
        <HeroSection featuredApps={featured} />

        <div className="px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
            {remaining.map((app) => (
              <AppCard key={app.app_id} app={app} />
            ))}
          </div>
          {apps.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <p>No apps found. Is the backend running?</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

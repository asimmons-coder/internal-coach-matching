import { getSupabase } from '@/app/lib/supabase';
import coaches from '@/coaches.json';
import { Coach } from '@/app/types';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SharePageProps {
  params: Promise<{ slug: string }>;
}

async function getSharedRecommendation(slug: string) {
  const { data, error } = await getSupabase()
    .from('shared_recommendations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const recommendation = await getSharedRecommendation(slug);

  if (!recommendation) {
    notFound();
  }

  const coachIds = recommendation.coach_ids as string[];
  const selectedCoaches = (coaches as Coach[]).filter(c => coachIds.includes(c.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Your Coach Recommendations</h1>
          <p className="text-gray-500 mt-2">
            We&apos;ve selected {selectedCoaches.length} coach{selectedCoaches.length !== 1 ? 'es' : ''} who would be a great fit for your needs.
          </p>
        </div>
      </div>

      {/* Coaches */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="space-y-8">
          {selectedCoaches.map((coach) => (
            <div key={coach.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8">
                <div className="flex gap-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {coach.photo_url ? (
                      <Image
                        src={coach.photo_url}
                        alt={coach.name}
                        width={120}
                        height={120}
                        className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-100"
                        unoptimized
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 text-3xl font-semibold ring-4 ring-slate-100">
                        {coach.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900">{coach.name}</h2>
                    {coach.headline && (
                      <p className="text-gray-600 mt-1">{coach.headline}</p>
                    )}

                    {/* Credentials */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {coach.icf_level && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
                          {coach.icf_level}
                        </span>
                      )}
                      {coach.practitioner_type && (
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
                          {coach.practitioner_type}
                        </span>
                      )}
                      {coach.timezone && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          {coach.timezone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {coach.bio && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-gray-700 leading-relaxed">{coach.bio}</p>
                  </div>
                )}

                {/* Contact */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <a
                    href={`mailto:${coach.email}`}
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact {coach.first_name}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-400">
          <p>Powered by Boon</p>
        </div>
      </div>
    </div>
  );
}

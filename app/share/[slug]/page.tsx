import { getSupabase } from '@/app/lib/supabase';
import coaches from '@/coaches.json';
import { Coach } from '@/app/types';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface SharedCoach {
  id: string;
  name: string;
  rationale: string;
  key_strengths: string[];
}

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

  const sharedCoaches = (recommendation.coach_data || []) as SharedCoach[];
  const coachIds = sharedCoaches.map(c => c.id);
  const coachesFromDb = (coaches as Coach[]).filter(c => coachIds.includes(c.id));

  // Merge DB coach data with shared recommendation data
  const enrichedCoaches = sharedCoaches.map(shared => {
    const dbCoach = coachesFromDb.find(c => c.id === shared.id);
    return {
      ...shared,
      photo_url: dbCoach?.photo_url,
      headline: dbCoach?.headline,
      email: dbCoach?.email,
      first_name: dbCoach?.first_name,
      icf_level: dbCoach?.icf_level,
      timezone: dbCoach?.timezone,
    };
  });

  return (
    <div className="min-h-screen bg-[#F0F3F7]" style={{ fontFamily: "'Barlow', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-6 px-8">
        <div className="max-w-3xl mx-auto">
          <Image
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            width={120}
            height={40}
            className="h-8 w-auto"
            unoptimized
          />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white py-12 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-[#2E353D]">
            Your Coach Recommendations
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            We&apos;ve selected {enrichedCoaches.length} coach{enrichedCoaches.length !== 1 ? 'es' : ''} who would be a great fit for your needs.
          </p>
        </div>
      </div>

      {/* Coaches */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="space-y-6">
          {enrichedCoaches.map((coach) => (
            <div key={coach.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                        className="w-28 h-28 rounded-full object-cover object-top ring-4 ring-[#F0F3F7]"
                        unoptimized
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#466FF6] to-[#365ABD] flex items-center justify-center text-white text-3xl font-semibold ring-4 ring-[#F0F3F7]">
                        {coach.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#2E353D]">{coach.name}</h2>
                    {coach.headline && (
                      <p className="text-gray-600 mt-1">{coach.headline}</p>
                    )}

                    {/* Credentials - only show non-internal ones */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {coach.icf_level && (
                        <span className="px-3 py-1 bg-[#466FF6]/10 text-[#466FF6] text-sm rounded-full font-medium">
                          {coach.icf_level}
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

                {/* AI-generated Rationale */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-[#FF8D80]/10 rounded-xl p-5">
                    <p className="text-[#2E353D] leading-relaxed">{coach.rationale}</p>
                  </div>
                </div>

                {/* Key Strengths */}
                {coach.key_strengths && coach.key_strengths.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {coach.key_strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#2E353D]">
                          <span className="text-[#466FF6] mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact */}
                {coach.email && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <a
                      href={`mailto:${coach.email}`}
                      className="inline-flex items-center gap-2 bg-[#466FF6] hover:bg-[#365ABD] text-white px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact {coach.first_name || coach.name.split(' ')[0]}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Image
            src="https://storage.googleapis.com/boon-public-assets/Wordmark_Blue%20(8)%20(1).png"
            alt="Boon"
            width={80}
            height={28}
            className="h-6 w-auto mx-auto opacity-50"
            unoptimized
          />
          <p className="text-sm text-gray-400 mt-2">Leadership coaching for high-performing teams</p>
        </div>
      </div>
    </div>
  );
}

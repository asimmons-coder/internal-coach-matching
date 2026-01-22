'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CoachData {
  id: string;
  photo_url: string;
  headline: string | null;
  gender: string;
  seniority_score: number;
  icf_level: string | null;
  practitioner_type: string | null;
  timezone: string;
  email: string;
  bio: string;
  name: string;
}

interface Recommendation {
  name: string;
  match_score: number;
  rationale: string;
  key_strengths: string[];
  potential_concerns: string | null;
  coach: CoachData | null;
}

interface ParsedRequirements {
  seniority_level: string;
  industry: string | null;
  gender_preference: string | null;
  key_focus_areas: string[];
  other_notes: string | null;
}

interface MatchResult {
  parsed_requirements: ParsedRequirements;
  recommendations: Recommendation[];
}

export default function Home() {
  const [requestText, setRequestText] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);
  const [numMatches, setNumMatches] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [selectedCoachIds, setSelectedCoachIds] = useState<Set<string>>(new Set());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const handleSubmit = async () => {
    if (!requestText.trim()) {
      setError('Please enter a coaching request description.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestText, activeOnly, numMatches })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get recommendations');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  const toggleCoachSelection = (coachId: string) => {
    setSelectedCoachIds(prev => {
      const next = new Set(prev);
      if (next.has(coachId)) {
        next.delete(coachId);
      } else {
        next.add(coachId);
      }
      return next;
    });
    setShareUrl(null);
  };

  const handleGenerateLink = async () => {
    if (selectedCoachIds.size === 0) return;

    setSharing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachIds: Array.from(selectedCoachIds),
          requestSummary: result?.parsed_requirements ?
            `${result.parsed_requirements.seniority_level} - ${result.parsed_requirements.key_focus_areas?.join(', ')}` : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate link');
      }

      const { slug } = await response.json();
      setShareUrl(`${window.location.origin}/share/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate share link');
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-6 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold">Boon Coach Matcher</h1>
          <p className="text-slate-300 mt-1">Internal tool for ad-hoc coach recommendations</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe the coaching need
          </label>
          <textarea
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-4 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder={`Paste the request here...

Example: Looking for a coach for a VP of Finance who is high IQ but lower EQ. Struggles with time management and delegation which leads to lack of accountability. Strong leader with tons of experience but ruining his reputation with ball drops. Would like 2 options including a male coach.`}
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Active coaches only
              </label>
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="number"
                  value={numMatches}
                  onChange={(e) => setNumMatches(parseInt(e.target.value) || 4)}
                  min={2}
                  max={8}
                  className="w-16 border rounded px-2 py-1"
                />
                matches
              </label>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Finding...
                </>
              ) : (
                'Find Matches'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Pro tip: ⌘+Enter to submit</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Analyzing request and finding best matches...</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Parsed Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Parsed Requirements</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div><strong>Seniority:</strong> {result.parsed_requirements.seniority_level || 'Not specified'}</div>
                <div><strong>Industry:</strong> {result.parsed_requirements.industry || 'Not specified'}</div>
                <div><strong>Gender pref:</strong> {result.parsed_requirements.gender_preference || 'None'}</div>
                <div><strong>Focus areas:</strong> {result.parsed_requirements.key_focus_areas?.join(', ') || 'General'}</div>
              </div>
              {result.parsed_requirements.other_notes && (
                <div className="mt-2 text-sm text-blue-800">
                  <strong>Notes:</strong> {result.parsed_requirements.other_notes}
                </div>
              )}
            </div>

            {/* Selection Actions */}
            {result.recommendations.some(rec => rec.coach?.id) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedCoachIds.size === 0 ? (
                    'Select coaches to share with customer'
                  ) : (
                    <span className="font-medium text-gray-900">{selectedCoachIds.size} coach{selectedCoachIds.size !== 1 ? 'es' : ''} selected</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {shareUrl ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="text-sm border border-gray-300 rounded px-3 py-1.5 w-64 bg-gray-50"
                      />
                      <button
                        onClick={copyShareUrl}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateLink}
                      disabled={selectedCoachIds.size === 0 || sharing}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {sharing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Share Link'
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Coach Cards */}
            <div className="space-y-4">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-lg shadow-sm border-l-4 border border-gray-200 p-5 cursor-pointer transition-colors ${
                    rec.coach?.id && selectedCoachIds.has(rec.coach.id)
                      ? 'border-l-green-600 bg-green-50/30 ring-2 ring-green-200'
                      : 'border-l-blue-600'
                  }`}
                  onClick={() => rec.coach?.id && toggleCoachSelection(rec.coach.id)}
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <input
                        type="checkbox"
                        checked={rec.coach?.id ? selectedCoachIds.has(rec.coach.id) : false}
                        onChange={() => rec.coach?.id && toggleCoachSelection(rec.coach.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </div>
                    {rec.coach?.photo_url ? (
                      <Image
                        src={rec.coach.photo_url}
                        alt={rec.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        unoptimized
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-gray-500 text-xl font-semibold">
                        {rec.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{rec.name}</h3>
                          <p className="text-sm text-gray-600">{rec.coach?.headline || ''}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{rec.match_score}</div>
                          <div className="text-xs text-gray-500">match score</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {rec.coach?.gender || ''}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          Seniority: {rec.coach?.seniority_score || '?'}/8
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {rec.coach?.icf_level || ''}
                        </span>
                        {rec.coach?.practitioner_type && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {rec.coach.practitioner_type}
                          </span>
                        )}
                        {rec.coach?.timezone && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {rec.coach.timezone}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-gray-700">{rec.rationale}</p>

                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-900">Key strengths:</div>
                        <ul className="text-sm text-gray-600 mt-1">
                          {rec.key_strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>

                      {rec.potential_concerns && (
                        <div className="mt-2 text-sm text-amber-700 bg-amber-50 rounded p-2">
                          <strong>Note:</strong> {rec.potential_concerns}
                        </div>
                      )}

                      {rec.coach?.email && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <a
                            href={`mailto:${rec.coach.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {rec.coach.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

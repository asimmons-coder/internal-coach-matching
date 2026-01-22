import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/app/lib/supabase';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const { coachIds, requestSummary } = await request.json();

    if (!coachIds || !Array.isArray(coachIds) || coachIds.length === 0) {
      return NextResponse.json({ error: 'At least one coach must be selected' }, { status: 400 });
    }

    const slug = nanoid(10);

    const { error } = await getSupabase()
      .from('shared_recommendations')
      .insert({
        slug,
        coach_ids: coachIds,
        request_summary: requestSummary || null,
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save recommendation' }, { status: 500 });
    }

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share link' },
      { status: 500 }
    );
  }
}

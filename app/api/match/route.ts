import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import coaches from '@/coaches.json';
import { Coach, MatchResult } from '@/app/types';

const anthropic = new Anthropic();

function buildCoachContext(coachList: Coach[]): string {
  return coachList.map(c => {
    const industries = c.industries ? JSON.parse(c.industries).join(', ') : 'N/A';
    const companies = c.companies ? JSON.parse(c.companies).join(', ') : 'N/A';
    const products = [
      c.is_scale_coach && 'SCALE',
      c.is_grow_coach && 'GROW', 
      c.is_exec_coach && 'EXEC'
    ].filter(Boolean).join(', ') || 'None specified';
    
    return `**${c.name}** | ${c.gender} | Seniority: ${c.seniority_score}/8 | ${c.icf_level || 'N/A'} | ${c.timezone || 'N/A'}
Type: ${c.practitioner_type || 'Unknown'} | Industries: ${industries} | Companies: ${companies}
Products: ${products}
Specialties: ${c.special_services || 'N/A'}
Headline: ${c.headline || 'N/A'}
Bio excerpt: ${c.bio ? c.bio.substring(0, 600) + '...' : 'N/A'}
---`;
  }).join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { requestText, activeOnly, numMatches } = await request.json();

    if (!requestText || requestText.trim().length === 0) {
      return NextResponse.json({ error: 'Request text is required' }, { status: 400 });
    }

    // Filter coaches
    const filteredCoaches = (coaches as Coach[]).filter(c => {
      if (activeOnly && !c.is_active) return false;
      return c.bio && c.bio.length > 100;
    });

    const coachContext = buildCoachContext(filteredCoaches);

    const systemPrompt = `You are an expert coach matcher for Boon, a leadership coaching company. Your job is to analyze coaching requests and recommend the best-fit coaches from the database.

## COACH DATABASE
${coachContext}

## MATCHING RULES
1. **Seniority mapping:** 
   - ICs/Individual Contributors → junior coaches (score 0-3)
   - Managers → mid-level (score 3-5)
   - Directors/VPs/C-suite → senior coaches (score 5-8)

2. **Gender preferences:** Honor any stated preferences. If they want "a male coach option," include at least one male.

3. **Industry match:** If coachee is in Finance, Tech, Healthcare, etc., prefer coaches with that industry background (check practitioner_type = "Industry Practitioner" and industries field).

4. **Specialties:** If the request mentions specific needs (ADHD, burnout, EQ/emotional intelligence, delegation, etc.), match to coaches with those in their special_services or bio.

5. **Timezone:** Consider timezone if mentioned or implied.

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no code blocks) with this structure:
{
  "parsed_requirements": {
    "seniority_level": "string describing inferred seniority",
    "industry": "string or null",
    "gender_preference": "string or null", 
    "key_focus_areas": ["array", "of", "focus", "areas"],
    "other_notes": "any other relevant observations"
  },
  "recommendations": [
    {
      "name": "Coach Name",
      "match_score": 95,
      "rationale": "2-3 sentences explaining why this coach is a strong fit for THIS specific request",
      "key_strengths": ["strength 1", "strength 2", "strength 3"],
      "potential_concerns": "Any potential concerns or mismatches, or null"
    }
  ]
}

Return exactly ${numMatches || 4} coach recommendations, ordered by fit (best first).`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { 
          role: 'user', 
          content: `Please analyze this coaching request and recommend the ${numMatches || 4} best-fit coaches:\n\n${requestText}` 
        }
      ]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON, handling potential markdown wrapping
    let jsonStr = content.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const result: MatchResult = JSON.parse(jsonStr.trim());

    // Enrich recommendations with coach data
    const enrichedRecommendations = result.recommendations.map(rec => {
      const coach = filteredCoaches.find(c => c.name === rec.name);
      return {
        ...rec,
        coach: coach ? {
          id: coach.id,
          name: coach.name,
          photo_url: coach.photo_url,
          headline: coach.headline,
          gender: coach.gender,
          seniority_score: coach.seniority_score,
          icf_level: coach.icf_level,
          practitioner_type: coach.practitioner_type,
          timezone: coach.timezone,
          email: coach.email,
          bio: coach.bio
        } : null
      };
    });

    return NextResponse.json({
      ...result,
      recommendations: enrichedRecommendations
    });

  } catch (error) {
    console.error('Error in coach matching:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}

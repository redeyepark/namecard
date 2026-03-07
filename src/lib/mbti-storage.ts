import { getSupabase } from './supabase';
import type {
  MbtiQuestion,
  MbtiAnswer,
  MbtiProgress,
  MbtiQuestionWithStatus,
  MbtiAnswerWithQuestion,
  MbtiDimension,
} from '@/types/mbti';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate user level from answer count.
 * Lv.1: 0 answers, Lv.2: 4+, Lv.3: 8+, Lv.4: 12+, Lv.5: 16
 */
function calculateLevel(answerCount: number): number {
  if (answerCount >= 16) return 5;
  if (answerCount >= 12) return 4;
  if (answerCount >= 8) return 3;
  if (answerCount >= 4) return 2;
  return 1;
}

/**
 * Calculate MBTI type from answered questions.
 * For each dimension (EI, SN, TF, JP), count A vs B answers.
 * A = first letter (E, S, T, J), B = second letter (I, N, F, P).
 * Majority wins; ties go to the first letter (E, S, T, J).
 */
function calculateMbtiType(answers: MbtiAnswerWithQuestion[]): string {
  const dimensionMap: Record<MbtiDimension, { first: string; second: string }> = {
    EI: { first: 'E', second: 'I' },
    SN: { first: 'S', second: 'N' },
    TF: { first: 'T', second: 'F' },
    JP: { first: 'J', second: 'P' },
  };

  const counts: Record<MbtiDimension, { a: number; b: number }> = {
    EI: { a: 0, b: 0 },
    SN: { a: 0, b: 0 },
    TF: { a: 0, b: 0 },
    JP: { a: 0, b: 0 },
  };

  for (const ans of answers) {
    if (ans.answer === 'A') {
      counts[ans.dimension].a++;
    } else {
      counts[ans.dimension].b++;
    }
  }

  let result = '';
  for (const dim of ['EI', 'SN', 'TF', 'JP'] as MbtiDimension[]) {
    // A >= B means first letter wins (including ties)
    if (counts[dim].a >= counts[dim].b) {
      result += dimensionMap[dim].first;
    } else {
      result += dimensionMap[dim].second;
    }
  }

  return result;
}

/**
 * Map a snake_case mbti_questions DB row to a camelCase MbtiQuestion object.
 */
function mapQuestionRow(row: Record<string, unknown>): MbtiQuestion {
  return {
    id: row.id as string,
    dimension: row.dimension as MbtiDimension,
    orderNum: row.order_num as number,
    content: row.content as string,
    optionA: row.option_a as string,
    optionB: row.option_b as string,
  };
}

/**
 * Map a snake_case mbti_answers DB row to a camelCase MbtiAnswer object.
 */
function mapAnswerRow(row: Record<string, unknown>): MbtiAnswer {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    questionId: row.question_id as string,
    answer: row.answer as 'A' | 'B',
    createdAt: row.created_at as string,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get all active MBTI questions ordered by order_num.
 */
export async function getMbtiQuestions(): Promise<MbtiQuestion[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('mbti_questions')
    .select('*')
    .eq('is_active', true)
    .order('order_num', { ascending: true });

  if (error || !rows) {
    return [];
  }

  return rows.map(mapQuestionRow);
}

/**
 * Get user's MBTI answers.
 */
export async function getUserMbtiAnswers(userId: string): Promise<MbtiAnswer[]> {
  const supabase = getSupabase();

  const { data: rows, error } = await supabase
    .from('mbti_answers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !rows) {
    return [];
  }

  return rows.map(mapAnswerRow);
}

/**
 * Get user's MBTI progress (questions + answers + unlock status).
 * Questions are unlocked sequentially: the user can only answer the next unanswered question.
 */
export async function getMbtiProgress(userId: string): Promise<MbtiProgress> {
  const questions = await getMbtiQuestions();
  const answers = await getUserMbtiAnswers(userId);

  // Build a map of questionId -> answer
  const answerMap = new Map<string, 'A' | 'B'>();
  for (const ans of answers) {
    answerMap.set(ans.questionId, ans.answer);
  }

  const answeredCount = answerMap.size;
  const level = calculateLevel(answeredCount);

  // Determine MBTI type if all 16 answered
  let mbtiType: string | null = null;
  if (answeredCount >= 16) {
    // Fetch user profile mbti_type first
    const supabase = getSupabase();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('mbti_type')
      .eq('id', userId)
      .single();

    mbtiType = (profile?.mbti_type as string) || null;
  }

  // Build questions with status
  const questionsWithStatus: MbtiQuestionWithStatus[] = questions.map((q, index) => {
    const userAnswer = answerMap.get(q.id) || null;
    // A question is unlocked if:
    // - It has already been answered, OR
    // - It is the next unanswered question (index === answeredCount)
    const isUnlocked = userAnswer !== null || index === answeredCount;

    return {
      ...q,
      isUnlocked,
      userAnswer,
    };
  });

  return {
    questions: questionsWithStatus,
    answeredCount,
    totalCount: questions.length,
    level,
    mbtiType,
  };
}

/**
 * Submit an MBTI answer.
 * Validates that the question exists and is the next unlocked question.
 * Updates user_profiles.level and optionally mbti_type.
 */
export async function submitMbtiAnswer(
  userId: string,
  questionId: string,
  answer: 'A' | 'B'
): Promise<{ success: boolean; newLevel: number; mbtiType: string | null }> {
  const supabase = getSupabase();

  // 1. Verify question exists and is active
  const { data: question, error: questionError } = await supabase
    .from('mbti_questions')
    .select('id, order_num, dimension')
    .eq('id', questionId)
    .eq('is_active', true)
    .single();

  if (questionError || !question) {
    throw new Error('Question not found or is inactive');
  }

  // 2. Get user's current answers to validate ordering
  const { data: existingAnswers, error: answersError } = await supabase
    .from('mbti_answers')
    .select('question_id')
    .eq('user_id', userId);

  if (answersError) {
    throw new Error('Failed to fetch existing answers');
  }

  const answeredQuestionIds = new Set(
    (existingAnswers || []).map((a) => a.question_id as string)
  );

  // Check if already answered
  if (answeredQuestionIds.has(questionId)) {
    throw new Error('This question has already been answered');
  }

  // 3. Validate that this is the next unlocked question
  // Get all active questions ordered by order_num to find which one is next
  const { data: allQuestions, error: allQError } = await supabase
    .from('mbti_questions')
    .select('id, order_num, dimension')
    .eq('is_active', true)
    .order('order_num', { ascending: true });

  if (allQError || !allQuestions) {
    throw new Error('Failed to fetch questions');
  }

  // Find the next unanswered question
  let nextQuestionId: string | null = null;
  for (const q of allQuestions) {
    if (!answeredQuestionIds.has(q.id as string)) {
      nextQuestionId = q.id as string;
      break;
    }
  }

  if (nextQuestionId !== questionId) {
    throw new Error('You can only answer the next unlocked question');
  }

  // 4. Insert the answer (upsert to handle edge cases)
  const { error: insertError } = await supabase
    .from('mbti_answers')
    .upsert(
      {
        user_id: userId,
        question_id: questionId,
        answer,
      },
      { onConflict: 'user_id,question_id' }
    );

  if (insertError) {
    throw new Error(`Failed to submit answer: ${insertError.message}`);
  }

  // 5. Count total answers and calculate level
  const newAnsweredCount = answeredQuestionIds.size + 1;
  const newLevel = calculateLevel(newAnsweredCount);

  // 6. Calculate MBTI type if all questions answered
  let mbtiType: string | null = null;
  if (newAnsweredCount >= 16) {
    // Build answer list with dimensions for calculation
    const answersWithDimension: MbtiAnswerWithQuestion[] = [];

    // Map question IDs to dimensions
    const questionDimensionMap = new Map<string, MbtiDimension>();
    for (const q of allQuestions) {
      questionDimensionMap.set(q.id as string, q.dimension as MbtiDimension);
    }

    // Add existing answers
    if (existingAnswers) {
      // We need the actual answer values, so re-fetch with answer column
      const { data: fullAnswers } = await supabase
        .from('mbti_answers')
        .select('id, user_id, question_id, answer, created_at')
        .eq('user_id', userId);

      if (fullAnswers) {
        for (const a of fullAnswers) {
          const dim = questionDimensionMap.get(a.question_id as string);
          if (dim) {
            answersWithDimension.push({
              id: a.id as string,
              userId: a.user_id as string,
              questionId: a.question_id as string,
              answer: a.answer as 'A' | 'B',
              createdAt: a.created_at as string,
              dimension: dim,
            });
          }
        }
      }
    }

    // Add the current answer
    const currentDimension = questionDimensionMap.get(questionId);
    if (currentDimension) {
      answersWithDimension.push({
        id: '', // not needed for calculation
        userId,
        questionId,
        answer,
        createdAt: new Date().toISOString(),
        dimension: currentDimension,
      });
    }

    mbtiType = calculateMbtiType(answersWithDimension);
  }

  // 7. Update user_profiles.level and optionally mbti_type
  const profileUpdates: Record<string, unknown> = {
    level: newLevel,
    updated_at: new Date().toISOString(),
  };

  if (mbtiType) {
    profileUpdates.mbti_type = mbtiType;
  }

  await supabase
    .from('user_profiles')
    .update(profileUpdates)
    .eq('id', userId);

  return { success: true, newLevel, mbtiType };
}

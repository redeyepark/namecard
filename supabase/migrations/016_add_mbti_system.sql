-- 016_add_mbti_system.sql

-- 1. mbti_questions table
CREATE TABLE mbti_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dimension VARCHAR(2) NOT NULL CHECK (dimension IN ('EI', 'SN', 'TF', 'JP')),
  order_num INTEGER NOT NULL,
  content TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. mbti_answers table
CREATE TABLE mbti_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES mbti_questions(id) ON DELETE CASCADE,
  answer VARCHAR(1) NOT NULL CHECK (answer IN ('A', 'B')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- 3. Add columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mbti_type VARCHAR(4);

-- Indexes
CREATE UNIQUE INDEX idx_mbti_questions_order ON mbti_questions(order_num);
CREATE INDEX idx_mbti_questions_dimension ON mbti_questions(dimension);
CREATE INDEX idx_mbti_questions_active ON mbti_questions(is_active) WHERE is_active = true;
CREATE INDEX idx_mbti_answers_user ON mbti_answers(user_id);
CREATE INDEX idx_mbti_answers_question ON mbti_answers(question_id);
CREATE INDEX idx_user_profiles_mbti ON user_profiles(mbti_type) WHERE mbti_type IS NOT NULL;

-- RLS policies
ALTER TABLE mbti_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mbti_answers ENABLE ROW LEVEL SECURITY;

-- mbti_questions: everyone can read active questions
CREATE POLICY "mbti_questions_select" ON mbti_questions FOR SELECT
  USING (is_active = true);

-- mbti_answers: users can read only their own answers
CREATE POLICY "mbti_answers_select" ON mbti_answers FOR SELECT
  USING (auth.uid() = user_id);

-- mbti_answers: users can insert only their own answers
CREATE POLICY "mbti_answers_insert" ON mbti_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- mbti_answers: users can update only their own answers
CREATE POLICY "mbti_answers_update" ON mbti_answers FOR UPDATE
  USING (auth.uid() = user_id);

-- mbti_answers: users can delete only their own answers
CREATE POLICY "mbti_answers_delete" ON mbti_answers FOR DELETE
  USING (auth.uid() = user_id);

-- user_profiles level/mbti_type: already covered by existing RLS policies
-- (select: public readable, update: owner only from 008_add_community.sql)

-- Seed 16 MBTI questions
INSERT INTO mbti_questions (dimension, order_num, content, option_a, option_b) VALUES
-- EI dimension (외향/내향)
('EI', 1, '주말에 에너지를 충전하는 방법은?', '친구들과 만나서 놀기', '집에서 혼자 쉬기'),
('EI', 2, '새로운 사람을 만났을 때?', '먼저 말을 건다', '상대방이 먼저 말하길 기다린다'),
('EI', 3, '점심시간에 선호하는 것은?', '동료들과 함께 식사', '혼자 조용히 식사'),
('EI', 4, '회의에서 나는?', '적극적으로 의견을 말한다', '정리된 생각을 나중에 공유한다'),

-- SN dimension (감각/직관)
('SN', 5, '여행 계획을 세울 때?', '구체적인 일정과 장소를 정한다', '대략적인 방향만 정하고 즉흥적으로'),
('SN', 6, '문제를 해결할 때?', '검증된 방법을 따른다', '새로운 방법을 시도한다'),
('SN', 7, '이야기를 들을 때 주목하는 것은?', '구체적인 사실과 디테일', '전체적인 맥락과 의미'),
('SN', 8, '일할 때 더 중요한 것은?', '현실적으로 가능한 것', '미래의 가능성'),

-- TF dimension (사고/감정)
('TF', 9, '친구가 고민을 이야기할 때?', '해결책을 제안한다', '감정에 공감해준다'),
('TF', 10, '결정을 내릴 때 기준은?', '논리와 효율성', '사람들의 감정과 관계'),
('TF', 11, '피드백을 줄 때?', '솔직하고 직접적으로', '상대방 기분을 고려해서'),
('TF', 12, '갈등 상황에서?', '옳고 그름을 따진다', '조화와 화해를 추구한다'),

-- JP dimension (판단/인식)
('JP', 13, '프로젝트를 할 때?', '미리 계획을 세운다', '유연하게 진행한다'),
('JP', 14, '약속 시간에 대해?', '항상 정시 또는 일찍 도착', '시간에 크게 구애받지 않는다'),
('JP', 15, '책상이나 방 정리는?', '항상 깔끔하게 유지', '나만의 규칙으로 (좀 어질러도 OK)'),
('JP', 16, '결정을 내릴 때?', '빠르게 결정하고 실행', '여러 옵션을 열어두고 고민');

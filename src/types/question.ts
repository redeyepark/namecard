/**
 * Question & Thought Sharing Feature - Type Definitions
 * Defines interfaces for questions, thoughts, and related API responses
 */

/**
 * Base Question entity stored in database
 */
export interface Question {
  id: string;
  authorId: string;
  content: string;
  hashtags: string[];
  thoughtCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Question with author details and ownership information
 * Used for API responses when returning question data
 */
export interface QuestionWithAuthor extends Question {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isOwner: boolean;
}

/**
 * Base Thought entity stored in database
 */
export interface Thought {
  id: string;
  questionId: string;
  authorId: string;
  content: string;
  likeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Thought with author details, like status, and ownership information
 * Used for API responses when returning thought data
 */
export interface ThoughtWithAuthor extends Thought {
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  isLiked: boolean;
  isOwner: boolean;
}

/**
 * Request body for creating a new question
 */
export interface CreateQuestionRequest {
  content: string;
  hashtags?: string[];
}

/**
 * Request body for creating a new thought
 */
export interface CreateThoughtRequest {
  content: string;
}

/**
 * Paginated response for questions list
 */
export interface QuestionsListResponse {
  questions: QuestionWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Paginated response for thoughts list
 */
export interface ThoughtsListResponse {
  thoughts: ThoughtWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Response for thought like/unlike action
 */
export interface ThoughtLikeResponse {
  liked: boolean;
  likeCount: number;
}

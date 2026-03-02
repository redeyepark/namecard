-- Add coffee chat preferences JSONB column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS coffee_chat_preferences JSONB DEFAULT NULL;

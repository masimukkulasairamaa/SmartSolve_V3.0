ALTER TABLE challenge_translations
  ADD COLUMN IF NOT EXISTS translated_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_challenge_translations_target
  ON challenge_translations(challenge_id, target_language);

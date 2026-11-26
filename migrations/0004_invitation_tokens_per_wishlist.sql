-- Én aktiv invitasjonslenke per ønskeliste (navnefest, jul, …).
-- Den eksisterende lenken tilhørte navnefestlisten og flyttes dit, så
-- lenker som allerede er sendt ut fortsetter å virke.
CREATE TABLE invitation_tokens_v2 (
  wishlist_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT INTO invitation_tokens_v2 (wishlist_id, token_hash, created_at)
SELECT 'navnefest', token_hash, created_at FROM invitation_tokens WHERE id = 1;

DROP TABLE invitation_tokens;

ALTER TABLE invitation_tokens_v2 RENAME TO invitation_tokens;

-- Én aktiv invitasjonslenke for ønskelisten. Kun hash av den tilfeldige
-- tokenen lagres, slik at lenken ikke kan hentes ut igjen fra databasen.
CREATE TABLE invitation_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

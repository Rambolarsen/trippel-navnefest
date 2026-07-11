-- Reservasjoner og spleiseinteresser (MVP.md §11).
-- Ingen personopplysninger lagres – kun en hash av gjestens
-- tilfeldige reservasjonstoken (MVP.md §9).
CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  gift_id TEXT NOT NULL,
  reservation_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_reservations_gift_id
ON reservations(gift_id);

-- Én registrering per nettleser per gave
CREATE UNIQUE INDEX idx_unique_reservation
ON reservations(gift_id, reservation_token_hash);

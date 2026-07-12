-- Visningsnavn for spleisegaver (MVP.md §8): påkrevd når man melder
-- spleiseinteresse, alltid NULL for enkeltgaver. Frivillig avgitt av
-- gjesten selv og slettes sammen med reservasjonsraden – det bevisste
-- unntaket fra «ingen personopplysninger lagres» (MVP.md §9).
ALTER TABLE reservations ADD COLUMN display_name TEXT;

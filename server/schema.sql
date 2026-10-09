CREATE TABLE IF NOT EXISTS game_users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS game_sessions_user_idx ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS game_sessions_expiry_idx ON game_sessions(expires_at);

CREATE TABLE IF NOT EXISTS game_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  center_lon DOUBLE PRECISION NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS game_activities (
  id UUID PRIMARY KEY,
  client_activity_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES game_users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('walking', 'running', 'cycling', 'hiking')),
  zone_id TEXT NOT NULL REFERENCES game_zones(id),
  trail_id TEXT,
  distance_m INTEGER NOT NULL CHECK (distance_m > 0),
  duration_s INTEGER NOT NULL CHECK (duration_s > 0),
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded >= 0),
  route_sample_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, client_activity_id)
);
CREATE INDEX IF NOT EXISTS game_activities_user_date_idx ON game_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS game_activities_zone_date_idx ON game_activities(zone_id, created_at DESC);

INSERT INTO game_zones (id, name, center_lon, center_lat) VALUES
  ('funchal', 'Funchal', -16.9256, 32.6669),
  ('camara-de-lobos', 'Câmara de Lobos', -16.9718, 32.6488),
  ('ribeira-brava', 'Ribeira Brava', -17.0627, 32.6748),
  ('ponta-do-sol', 'Ponta do Sol', -17.1013, 32.6798),
  ('calheta', 'Calheta', -17.1771, 32.7167),
  ('porto-moniz', 'Porto Moniz', -17.1667, 32.8667),
  ('sao-vicente', 'São Vicente', -17.0434, 32.7967),
  ('santana', 'Santana', -16.8809, 32.8031),
  ('machico', 'Machico', -16.7650, 32.7180),
  ('santa-cruz', 'Santa Cruz', -16.7930, 32.6880)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, center_lon = EXCLUDED.center_lon, center_lat = EXCLUDED.center_lat;

CREATE TABLE IF NOT EXISTS history_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_pubkey TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_mint TEXT NOT NULL,
  details TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_pubkey ON history_logs (wallet_pubkey);

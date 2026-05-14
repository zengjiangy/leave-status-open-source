CREATE TABLE IF NOT EXISTS leave_links (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  owner_norm TEXT NOT NULL DEFAULT '',
  user_name TEXT NOT NULL DEFAULT '',
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL DEFAULT 0,
  deleted_at INTEGER NOT NULL DEFAULT 0,
  purge_at INTEGER NOT NULL DEFAULT 0,
  archive_at INTEGER NOT NULL DEFAULT 0,
  archived_at INTEGER NOT NULL DEFAULT 0,
  archive_reason TEXT NOT NULL DEFAULT '',
  restored_at INTEGER NOT NULL DEFAULT 0,
  source_key TEXT NOT NULL DEFAULT '',
  last_synced_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_updated
  ON leave_links(owner_norm, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_deleted
  ON leave_links(owner_norm, status, deleted_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_links_owner_status_archived
  ON leave_links(owner_norm, status, archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_links_status_archive_at
  ON leave_links(status, archive_at);

CREATE TABLE IF NOT EXISTS admin_accounts (
  username TEXT PRIMARY KEY,
  username_norm TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT '',
  editable INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT 0,
  updated_by TEXT NOT NULL DEFAULT '',
  deleted_at INTEGER NOT NULL DEFAULT 0,
  deleted_by TEXT NOT NULL DEFAULT '',
  last_synced_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_logins (
  username_norm TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  last_login_at INTEGER NOT NULL DEFAULT 0,
  last_access_ip TEXT NOT NULL DEFAULT '',
  last_access_user_agent TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_link_stats (
  username_norm TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  generated_link_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

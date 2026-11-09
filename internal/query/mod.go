package query

const (
	// Auto-responder rules
	CreateAutoResponderRulesTable = `
	CREATE TABLE IF NOT EXISTS auto_responder_rules (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		enabled BOOLEAN NOT NULL DEFAULT 1,
		match_type TEXT NOT NULL, -- "keyword", "exact", "contains", "all"
		keyword TEXT,             -- for keyword/contains/exact matching
		response_text TEXT NOT NULL,
		chat_jid TEXT,            -- optional: restrict to specific chat
		respond_to_self BOOLEAN NOT NULL DEFAULT 0,
		respond_to_groups BOOLEAN NOT NULL DEFAULT 1,
		respond_to_contacts BOOLEAN NOT NULL DEFAULT 1,
		cooldown_seconds INTEGER NOT NULL DEFAULT 300,
		created_at INTEGER NOT NULL,
		updated_at INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_auto_responder_enabled ON auto_responder_rules(enabled);
	CREATE INDEX IF NOT EXISTS idx_auto_responder_chat ON auto_responder_rules(chat_jid);
	`

	InsertAutoResponderRule = `
	INSERT INTO auto_responder_rules
	(name, enabled, match_type, keyword, response_text, chat_jid, respond_to_self, respond_to_groups, respond_to_contacts, cooldown_seconds, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	UpdateAutoResponderRule = `
	UPDATE auto_responder_rules
	SET name = ?, enabled = ?, match_type = ?, keyword = ?, response_text = ?,
	    chat_jid = ?, respond_to_self = ?, respond_to_groups = ?, respond_to_contacts = ?,
	    cooldown_seconds = ?, updated_at = ?
	WHERE id = ?
	`

	DeleteAutoResponderRule = `
	DELETE FROM auto_responder_rules WHERE id = ?
	`

	SelectAllAutoResponderRules = `
	SELECT id, name, enabled, match_type, keyword, response_text, chat_jid,
	       respond_to_self, respond_to_groups, respond_to_contacts, cooldown_seconds,
	       created_at, updated_at
	FROM auto_responder_rules
	ORDER BY created_at DESC
	`

	SelectEnabledAutoResponderRules = `
	SELECT id, name, match_type, keyword, response_text, chat_jid,
	       respond_to_self, respond_to_groups, respond_to_contacts, cooldown_seconds
	FROM auto_responder_rules
	WHERE enabled = 1
	`

	// Scheduled messages
	CreateScheduledMessagesTable = `
	CREATE TABLE IF NOT EXISTS scheduled_messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		chat_jid TEXT NOT NULL,
		message_type INTEGER NOT NULL DEFAULT 1, -- 1 = text, 2 = image, 3 = video, etc.
		text_content TEXT,
		media_path TEXT,
		mime_type TEXT,
		file_name TEXT,
		scheduled_at INTEGER NOT NULL,
		sent_at INTEGER DEFAULT 0,
		status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
		retry_count INTEGER DEFAULT 0,
		created_at INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_scheduled_pending ON scheduled_messages(status, scheduled_at);
	CREATE INDEX IF NOT EXISTS idx_scheduled_chat ON scheduled_messages(chat_jid);
	`

	InsertScheduledMessage = `
	INSERT INTO scheduled_messages
	(chat_jid, message_type, text_content, media_path, mime_type, file_name, scheduled_at, status, created_at)
	VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
	`

	UpdateScheduledMessage = `
	UPDATE scheduled_messages
	SET chat_jid = ?, message_type = ?, text_content = ?, media_path = ?,
	    mime_type = ?, file_name = ?, scheduled_at = ?, status = ?,
	    retry_count = retry_count + 1
	WHERE id = ?
	`

	DeleteScheduledMessage = `
	DELETE FROM scheduled_messages WHERE id = ?
	`

	SelectAllScheduledMessages = `
	SELECT id, chat_jid, message_type, text_content, media_path, mime_type,
	       file_name, scheduled_at, sent_at, status, retry_count, created_at
	FROM scheduled_messages
	ORDER BY scheduled_at ASC
	`

	SelectPendingScheduledMessages = `
	SELECT id, chat_jid, message_type, text_content, media_path, mime_type,
	       file_name, scheduled_at, status, retry_count
	FROM scheduled_messages
	WHERE status = 'pending' AND scheduled_at <= ?
	ORDER BY scheduled_at ASC
	`

	UpdateScheduledMessageStatus = `
	UPDATE scheduled_messages
	SET status = ?, sent_at = ?, retry_count = retry_count + 1
	WHERE id = ?
	`

	// Voice transcription cache
	CreateVoiceTranscriptionCacheTable = `
	CREATE TABLE IF NOT EXISTS voice_transcriptions (
		message_id TEXT PRIMARY KEY,
		chat_jid TEXT NOT NULL,
		text TEXT NOT NULL,
		language TEXT,
		created_at INTEGER NOT NULL
	);
	CREATE INDEX IF NOT EXISTS idx_voice_chat ON voice_transcriptions(chat_jid);
	`

	InsertVoiceTranscription = `
	INSERT OR REPLACE INTO voice_transcriptions
	(message_id, chat_jid, text, language, created_at)
	VALUES (?, ?, ?, ?, ?)
	`

	SelectVoiceTranscription = `
	SELECT text, language FROM voice_transcriptions WHERE message_id = ?
	`
)
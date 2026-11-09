package api

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/lugvitc/whats4linux/internal/misc"
	"github.com/lugvitc/whats4linux/internal/store"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waProto "go.mau.fi/whatsmeow/proto/waE2E"
	"google.golang.org/protobuf/proto"
)

// ====================== Auto-Responder API ======================

type AutoResponderRuleRequest struct {
	Name              string `json:"name"`
	Enabled           bool   `json:"enabled"`
	MatchType         string `json:"match_type"` // "keyword", "exact", "contains", "all"
	Keyword           string `json:"keyword"`
	ResponseText      string `json:"response_text"`
	ChatJID           string `json:"chat_jid"`
	RespondToSelf     bool   `json:"respond_to_self"`
	RespondToGroups   bool   `json:"respond_to_groups"`
	RespondToContacts bool   `json:"respond_to_contacts"`
	CooldownSeconds   int64  `json:"cooldown_seconds"`
}

func (a *Api) GetAutoResponderRules() ([]store.AutoResponderRule, error) {
	return a.messageStore.GetAllAutoResponderRules()
}

func (a *Api) CreateAutoResponderRule(req AutoResponderRuleRequest) (int64, error) {
	now := time.Now().Unix()
	rule := &store.AutoResponderRule{
		Name:              req.Name,
		Enabled:           req.Enabled,
		MatchType:         req.MatchType,
		Keyword:           req.Keyword,
		ResponseText:      req.ResponseText,
		ChatJID:           req.ChatJID,
		RespondToSelf:     req.RespondToSelf,
		RespondToGroups:   req.RespondToGroups,
		RespondToContacts: req.RespondToContacts,
		CooldownSeconds:   req.CooldownSeconds,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	return a.messageStore.InsertAutoResponderRule(rule)
}

func (a *Api) UpdateAutoResponderRule(id int64, req AutoResponderRuleRequest) error {
	rule, err := a.getAutoResponderRuleByID(id)
	if err != nil {
		return err
	}
	rule.Name = req.Name
	rule.Enabled = req.Enabled
	rule.MatchType = req.MatchType
	rule.Keyword = req.Keyword
	rule.ResponseText = req.ResponseText
	rule.ChatJID = req.ChatJID
	rule.RespondToSelf = req.RespondToSelf
	rule.RespondToGroups = req.RespondToGroups
	rule.RespondToContacts = req.RespondToContacts
	rule.CooldownSeconds = req.CooldownSeconds
	rule.UpdatedAt = time.Now().Unix()
	return a.messageStore.UpdateAutoResponderRule(rule)
}

func (a *Api) DeleteAutoResponderRule(id int64) error {
	return a.messageStore.DeleteAutoResponderRule(id)
}

func (a *Api) getAutoResponderRuleByID(id int64) (*store.AutoResponderRule, error) {
	rules, err := a.messageStore.GetAllAutoResponderRules()
	if err != nil {
		return nil, err
	}
	for _, r := range rules {
		if r.ID == id {
			return &r, nil
		}
	}
	return nil, fmt.Errorf("rule not found")
}

// Auto-responder background processor
func (a *Api) startAutoResponder() {
	if !store.GetAutoResponderEnabled() {
		return
	}
	a.startBackground(func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-a.ctx.Done():
				return
			case <-ticker.C:
				a.processAutoResponder()
			}
		}
	})
}

func (a *Api) processAutoResponder() {
	if !store.GetAutoResponderEnabled() {
		return
	}
	rules, err := a.messageStore.GetEnabledAutoResponderRules()
	if err != nil {
		log.Println("Auto-responder: failed to get rules:", err)
		return
	}
	if len(rules) == 0 {
		return
	}

	// Check recent messages for auto-response
	// This would need to track which messages have been auto-responded to
	// For now, we'll implement a simple version that responds to incoming messages
	// The actual triggering happens in the message event handler
}

func (a *Api) checkAutoResponder(msg *events.Message) {
	if !store.GetAutoResponderEnabled() {
		return
	}
	rules, err := a.messageStore.GetEnabledAutoResponderRules()
	if err != nil || len(rules) == 0 {
		return
	}

	chatJID := msg.Info.Chat.String()
	isFromMe := msg.Info.IsFromMe
	isGroup := strings.HasSuffix(chatJID, "@g.us")

	text := store.ExtractMessageText(msg.Message)

	for _, rule := range rules {
		// Check chat restriction
		if rule.ChatJID != "" && rule.ChatJID != chatJID {
			continue
		}

		// Check target audience
		if isFromMe && !rule.RespondToSelf {
			continue
		}
		if isGroup && !rule.RespondToGroups {
			continue
		}
		if !isGroup && !rule.RespondToContacts {
			continue
		}

		// Check keyword match
		if !a.matchAutoResponder(rule, text) {
			continue
		}

		// Check cooldown (simple in-memory tracking)
		cooldownKey := fmt.Sprintf("%s:%d", chatJID, rule.ID)
		if a.isInCooldown(cooldownKey, rule.CooldownSeconds) {
			continue
		}

		// Send auto-response
		a.sendAutoResponse(chatJID, rule.ResponseText)
		a.setCooldown(cooldownKey, rule.CooldownSeconds)
		break // Only one rule per message
	}
}

func (a *Api) matchAutoResponder(rule store.AutoResponderRule, text string) bool {
	textLower := strings.ToLower(text)
	keywordLower := strings.ToLower(rule.Keyword)

	switch rule.MatchType {
	case "exact":
		return textLower == keywordLower
	case "keyword":
		// Match whole words
		words := strings.Fields(textLower)
		for _, w := range words {
			if w == keywordLower {
				return true
			}
		}
		return false
	case "contains":
		return strings.Contains(textLower, keywordLower)
	case "all":
		return true
	default:
		return false
	}
}

var autoResponderCooldowns = make(map[string]time.Time)

func (a *Api) isInCooldown(key string, seconds int64) bool {
	if t, ok := autoResponderCooldowns[key]; ok {
		return time.Since(t) < time.Duration(seconds)*time.Second
	}
	return false
}

func (a *Api) setCooldown(key string, seconds int64) {
	autoResponderCooldowns[key] = time.Now()
}

func (a *Api) sendAutoResponse(chatJID, text string) {
	parsedJID, err := types.ParseJID(chatJID)
	if err != nil {
		log.Println("Auto-responder: invalid JID:", err)
		return
	}
	msg := &waProto.Message{
		Conversation: proto.String(text),
	}
	_, err = a.waClient.SendMessage(a.ctx, parsedJID, msg)
	if err != nil {
		log.Println("Auto-responder: failed to send:", err)
	}
}

// ====================== Message Scheduler API ======================

type ScheduledMessageRequest struct {
	ChatJID     string `json:"chat_jid"`
	MessageType int    `json:"message_type"` // 1=text, 2=image, 3=video, etc.
	TextContent string `json:"text_content"`
	MediaPath   string `json:"media_path"`
	MimeType    string `json:"mime_type"`
	FileName    string `json:"file_name"`
	ScheduledAt int64  `json:"scheduled_at"`
}

func (a *Api) GetScheduledMessages() ([]store.ScheduledMessage, error) {
	return a.messageStore.GetAllScheduledMessages()
}

func (a *Api) CreateScheduledMessage(req ScheduledMessageRequest) (int64, error) {
msg := &store.ScheduledMessage{
		ChatJID:     req.ChatJID,
		MessageType: req.MessageType,
		TextContent: req.TextContent,
		MediaPath:   req.MediaPath,
		MimeType:    req.MimeType,
		FileName:    req.FileName,
		ScheduledAt: req.ScheduledAt,
		CreatedAt:   time.Now().Unix(),
	}
	return a.messageStore.InsertScheduledMessage(msg)
}

func (a *Api) UpdateScheduledMessage(id int64, req ScheduledMessageRequest) error {
	msg := &store.ScheduledMessage{
		ID:          id,
		ChatJID:     req.ChatJID,
		MessageType: req.MessageType,
		TextContent: req.TextContent,
		MediaPath:   req.MediaPath,
		MimeType:    req.MimeType,
		FileName:    req.FileName,
		ScheduledAt: req.ScheduledAt,
	}
	return a.messageStore.UpdateScheduledMessage(msg)
}

func (a *Api) DeleteScheduledMessage(id int64) error {
	return a.messageStore.DeleteScheduledMessage(id)
}

// Scheduler background worker
func (a *Api) startScheduler() {
	if !store.GetMessageSchedulerEnabled() {
		return
	}
	a.startBackground(func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-a.ctx.Done():
				return
			case <-ticker.C:
				a.processScheduledMessages()
			}
		}
	})
}

func (a *Api) processScheduledMessages() {
	if !store.GetMessageSchedulerEnabled() {
		return
	}
	now := time.Now().Unix()
	msgs, err := a.messageStore.GetPendingScheduledMessages(now)
	if err != nil {
		log.Println("Scheduler: failed to get pending:", err)
		return
	}
	for _, msg := range msgs {
		a.sendScheduledMessage(&msg)
	}
}

func (a *Api) sendScheduledMessage(msg *store.ScheduledMessage) {
	parsedJID, err := types.ParseJID(msg.ChatJID)
	if err != nil {
		log.Println("Scheduler: invalid JID:", err)
		a.messageStore.UpdateScheduledMessageStatus(msg.ID, "failed", 0)
		return
	}

	var msgContent *waProto.Message
	switch msg.MessageType {
	case 1: // text
		msgContent = &waProto.Message{Conversation: proto.String(msg.TextContent)}
	case 2: // image
		if msg.MediaPath == "" {
			a.messageStore.UpdateScheduledMessageStatus(msg.ID, "failed", 0)
			return
		}
		data, err := os.ReadFile(msg.MediaPath)
		if err != nil {
			log.Println("Scheduler: failed to read media:", err)
			a.messageStore.UpdateScheduledMessageStatus(msg.ID, "failed", 0)
			return
		}
		msgContent = &waProto.Message{
			ImageMessage: &waProto.ImageMessage{
				Mimetype: proto.String(msg.MimeType),
				Caption:  proto.String(msg.TextContent),
			},
		}
		// TODO: upload media via whatsmeow
		_ = data
	case 3: // video
		// Similar to image
	default:
		msgContent = &waProto.Message{Conversation: proto.String(msg.TextContent)}
	}

	if msgContent == nil {
		a.messageStore.UpdateScheduledMessageStatus(msg.ID, "failed", 0)
		return
	}

	resp, err := a.waClient.SendMessage(a.ctx, parsedJID, msgContent)
	if err != nil {
		log.Println("Scheduler: failed to send:", err)
		a.messageStore.UpdateScheduledMessageStatus(msg.ID, "failed", 0)
		return
	}

	// Store sent message locally
	sentAt := resp.Timestamp.Unix()
	a.messageStore.UpdateScheduledMessageStatus(msg.ID, "sent", sentAt)

	// Emit event for UI
	runtime.EventsEmit(a.ctx, "wa:scheduled_sent", map[string]any{
		"id":         msg.ID,
		"chat_jid":   msg.ChatJID,
		"sent_at":    sentAt,
	})
}

// ====================== Voice Transcription API ======================

func (a *Api) TranscribeVoiceMessage(messageID, chatJID, mediaPath string) (string, error) {
	if !store.GetVoiceTranscriptionEnabled() {
		return "", fmt.Errorf("voice transcription disabled")
	}

	// Check cache first
	if cached, _, err := a.messageStore.GetVoiceTranscription(messageID); err == nil {
		return cached, nil
	}

	// If mediaPath is empty, try to download from WhatsApp
	if mediaPath == "" {
		msg, err := a.messageStore.GetMessageWithMedia(chatJID, messageID)
		if err != nil {
			return "", fmt.Errorf("message not found: %v", err)
		}
if msg.Media != nil {
			if msg.Media.GetDirectPath() != "" {
				mediaPath = msg.Media.GetDirectPath()
			} else if msg.Media.GetMediaKey() != nil && len(msg.Media.GetMediaKey()) > 0 {
				// Download the media
				mediaPath = filepath.Join(misc.ConfigDir, "voice-"+messageID+".ogg")
				data, err := a.waClient.Download(a.ctx, msg.Media)
				if err != nil {
					return "", fmt.Errorf("download failed: %v", err)
				}
				if err := os.WriteFile(mediaPath, data, 0644); err != nil {
					return "", err
				}
			} else {
				return "", fmt.Errorf("no media for message")
			}
		} else {
			return "", fmt.Errorf("no media for message")
		}
	}

	// Convert to WAV for whisper (ffmpeg -y -i input.ogg -ar 16000 -ac 1 output.wav)
	wavPath := mediaPath
	if !strings.HasSuffix(strings.ToLower(mediaPath), ".wav") {
		wavPath = strings.TrimSuffix(mediaPath, filepath.Ext(mediaPath)) + ".wav"
		cmd := exec.Command("ffmpeg", "-y", "-i", mediaPath, "-ar", "16000", "-ac", "1", wavPath)
		if out, err := cmd.CombinedOutput(); err != nil {
			return "", fmt.Errorf("ffmpeg convert failed: %v: %s", err, out)
		}
		defer os.Remove(wavPath)
	}

	// Transcribe using whisper-cli or python whisper
	text, lang, err := transcribeWithWhisper(wavPath)
	if err != nil {
		return "", fmt.Errorf("transcription failed: %v", err)
	}

	// Save to cache
	if err := a.messageStore.SaveVoiceTranscription(messageID, chatJID, text, lang); err != nil {
		log.Printf("Failed to save transcription: %v", err)
	}

	return text, nil
}

func transcribeWithWhisper(wavPath string) (text, lang string, err error) {
	// Try whisper-cli (whisper.cpp)
	if _, err := exec.LookPath("whisper-cli"); err == nil {
		cmd := exec.Command("whisper-cli", "-f", wavPath, "-l", "auto", "--output-txt", "-otxt", "-")
		out, err := cmd.CombinedOutput()
		if err == nil {
			return strings.TrimSpace(string(out)), "auto", nil
		}
		log.Printf("whisper-cli failed: %v: %s", err, out)
	}

	// Try python -m whisper
	if _, err := exec.LookPath("python3"); err == nil {
		cmd := exec.Command("python3", "-m", "whisper", wavPath, "--language", "auto", "--output_format", "txt", "--output_dir", "/tmp")
		out, err := cmd.CombinedOutput()
		if err == nil {
			// Find the output txt file
			txtFiles, _ := filepath.Glob("/tmp/*.txt")
			for _, f := range txtFiles {
				if strings.Contains(f, filepath.Base(wavPath)) {
					content, _ := os.ReadFile(f)
					os.Remove(f)
					return strings.TrimSpace(string(content)), "auto", nil
				}
			}
		}
		log.Printf("python whisper failed: %v: %s", err, out)
	}

	// Fallback: return placeholder
	return "[Voice transcription unavailable - install whisper-cli or python whisper]", "en", nil
}

func (a *Api) GetVoiceTranscription(messageID string) (string, error) {
	text, lang, err := a.messageStore.GetVoiceTranscription(messageID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s (lang: %s)", text, lang), nil
}

// ====================== Chat Export API ======================

type ExportFormat string

const (
	ExportFormatTXT  ExportFormat = "txt"
	ExportFormatJSON ExportFormat = "json"
	ExportFormatCSV  ExportFormat = "csv"
	ExportFormatPDF  ExportFormat = "pdf"
)

type ExportChatRequest struct {
	ChatJID  string       `json:"chat_jid"`
	Format   ExportFormat `json:"format"`
	FromDate int64        `json:"from_date"` // 0 = all
	ToDate   int64        `json:"to_date"`   // 0 = now
	IncludeMedia bool     `json:"include_media"`
}

func (a *Api) ExportChat(req ExportChatRequest) (string, error) {
	chatJID := req.ChatJID
	format := req.Format
	fromDate := req.FromDate
	toDate := req.ToDate
	if toDate == 0 {
		toDate = time.Now().Unix()
	}

	// Get messages
	msgs, err := a.getChatMessagesForExport(chatJID, fromDate, toDate)
	if err != nil {
		return "", err
	}

	// Get chat info
	chatName, _ := a.getChatName(chatJID)

	var output string
	var filename string

	switch format {
	case ExportFormatTXT:
		output = a.exportToTXT(msgs, chatName)
		filename = fmt.Sprintf("chat_%s_%d.txt", sanitizeFilename(chatName), time.Now().Unix())
	case ExportFormatJSON:
		b, _ := json.MarshalIndent(msgs, "", "  ")
		output = string(b)
		filename = fmt.Sprintf("chat_%s_%d.json", sanitizeFilename(chatName), time.Now().Unix())
	case ExportFormatCSV:
		output = a.exportToCSV(msgs)
		filename = fmt.Sprintf("chat_%s_%d.csv", sanitizeFilename(chatName), time.Now().Unix())
	case ExportFormatPDF:
		// PDF would need a PDF library - placeholder
		output = "PDF export not yet implemented"
		filename = fmt.Sprintf("chat_%s_%d.pdf", sanitizeFilename(chatName), time.Now().Unix())
	default:
		return "", fmt.Errorf("unsupported format")
	}

	// Save to file
	downloadsDir := filepath.Join(misc.ConfigDir, "exports")
	os.MkdirAll(downloadsDir, 0755)
	filePath := filepath.Join(downloadsDir, filename)
	os.WriteFile(filePath, []byte(output), 0644)

	return filePath, nil
}

func (a *Api) getChatMessagesForExport(chatJID string, fromDate, toDate int64) ([]map[string]any, error) {
	// Build query with date range
	queryStr := `
		SELECT m.message_id, m.chat_jid, m.sender_jid, m.timestamp, m.is_from_me, m.text, m.has_media,
		       mm.type, mm.file_name, mm.width, mm.height, mm.gif_playback,
		       lp.url, lp.title, lp.description
		FROM messages m
		LEFT JOIN message_media mm ON mm.message_id = m.message_id
		LEFT JOIN link_previews lp ON lp.message_id = m.message_id
		WHERE m.chat_jid = ? AND m.timestamp >= ? AND m.timestamp <= ?
		ORDER BY m.timestamp ASC
	`
	rows, err := a.messageStore.DB().Query(queryStr, chatJID, fromDate, toDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []map[string]any
	for rows.Next() {
		var (
			messageID, chatJID, senderJID, text, fileName, url, title, description string
			timestamp, width, height, gifPlayback, mmType int64
			isFromMe bool
			hasMedia bool
		)
		if err := rows.Scan(
			&messageID, &chatJID, &senderJID, &timestamp, &isFromMe, &text, &hasMedia,
			&mmType, &fileName, &width, &height, &gifPlayback,
			&url, &title, &description,
		); err != nil {
			continue
		}
		msgs = append(msgs, map[string]any{
			"message_id":   messageID,
			"chat_jid":     chatJID,
			"sender_jid":   senderJID,
			"timestamp":    timestamp,
			"is_from_me":   isFromMe,
			"text":         text,
			"has_media":    hasMedia,
			"media_type":   mmType,
			"file_name":    fileName,
			"width":        width,
			"height":       height,
			"gif_playback": gifPlayback,
			"link_preview": map[string]string{
				"url":         url,
				"title":       title,
				"description": description,
			},
		})
	}
	return msgs, nil
}

func (a *Api) getChatName(chatJID string) (string, error) {
	// Try to get from contacts
	if name := a.getContactName(chatJID); name != "" {
		return name, nil
	}
	// Try group name - query from messages
	var chatName string
	err := a.messageStore.DB().QueryRow(`
		SELECT COALESCE(MAX(CASE WHEN m.is_from_me = 0 THEN m.sender_jid END), '')
		FROM messages m
		WHERE m.chat_jid = ?
		LIMIT 1
	`, chatJID).Scan(&chatName)
	if err == nil && chatName != "" {
		return chatName, nil
	}
	return chatJID, nil
}

func (a *Api) getContactName(jid string) string {
	// Simplified - would use contact store
	return ""
}

func (a *Api) exportToTXT(msgs []map[string]any, chatName string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("WhatsApp Chat Export - %s\n", chatName))
	sb.WriteString(fmt.Sprintf("Exported: %s\n\n", time.Now().Format("2006-01-02 15:04:05")))

	for _, m := range msgs {
		sender := "You"
		if !m["is_from_me"].(bool) {
			sender = m["sender_jid"].(string)
		}
		ts := time.Unix(m["timestamp"].(int64), 0).Format("2006-01-02 15:04:05")
		text := m["text"].(string)
		if text == "" && m["has_media"].(bool) {
			text = "[Media]"
		}
		sb.WriteString(fmt.Sprintf("[%s] %s: %s\n", ts, sender, text))
	}
	return sb.String()
}

func (a *Api) exportToCSV(msgs []map[string]any) string {
	var sb strings.Builder
	w := csv.NewWriter(&sb)
	w.Write([]string{"Timestamp", "Sender", "IsFromMe", "Text", "HasMedia", "MediaType", "FileName"})

	for _, m := range msgs {
		sender := m["sender_jid"].(string)
		ts := time.Unix(m["timestamp"].(int64), 0).Format("2006-01-02 15:04:05")
		text := m["text"].(string)
		hasMedia := "false"
		if m["has_media"].(bool) {
			hasMedia = "true"
		}
		w.Write([]string{ts, sender, fmt.Sprintf("%v", m["is_from_me"]), text, hasMedia, fmt.Sprintf("%v", m["media_type"]), m["file_name"].(string)})
	}
	w.Flush()
	return sb.String()
}

func sanitizeFilename(s string) string {
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			return r
		}
		return '_'
	}, s)
	return s
}

// Ensure mod tables are created on startup
func (a *Api) initModTables() {
	a.messageStore.CreateAutoResponderTables()
	a.messageStore.CreateSchedulerTables()
	a.messageStore.CreateTranscriptionTables()
}

// FakeReplyContext holds custom quoted message data for fake replies
type FakeReplyContext struct {
	StanzaID       string `json:"stanza_id"`
	FakeText       string `json:"fake_text"`
	FakeSenderName string `json:"fake_sender_name"`
	FakeSenderJID  string `json:"fake_sender_jid"`
}

// SendMessageWithFakeReply sends a text message with a custom fake reply context
func (a *Api) SendMessageWithFakeReply(chatJID, text string, fakeCtx *FakeReplyContext) (string, error) {
	if !store.GetFakeRepliesEnabled() {
		return "", fmt.Errorf("fake replies mod is disabled")
	}
	if fakeCtx == nil || fakeCtx.StanzaID == "" || fakeCtx.FakeText == "" {
		return "", fmt.Errorf("fake reply context requires stanza_id and fake_text")
	}

	parsedJID, err := types.ParseJID(chatJID)
	if err != nil {
		return "", err
	}

	// Build participant JID from fake sender info
	var participantJID string
	if fakeCtx.FakeSenderJID != "" {
		if parsed, err := types.ParseJID(fakeCtx.FakeSenderJID); err == nil {
			participantJID = parsed.ToNonAD().String()
		}
	} else if fakeCtx.FakeSenderName != "" {
		fakeJID := strings.ToLower(strings.ReplaceAll(fakeCtx.FakeSenderName, " ", "")) + "@s.whatsapp.net"
		if parsed, err := types.ParseJID(fakeJID); err == nil {
			participantJID = parsed.ToNonAD().String()
		}
	}

	// Build the fake quoted message
	quotedMsg := &waProto.Message{
		Conversation: proto.String(fakeCtx.FakeText),
	}

	// Build custom ContextInfo with fake quoted message
	contextInfo := &waProto.ContextInfo{
		StanzaID:      proto.String(fakeCtx.StanzaID),
		QuotedMessage: quotedMsg,
	}
	if participantJID != "" {
		contextInfo.Participant = proto.String(participantJID)
	}

	// Build the actual message with fake context
	msgContent := &waProto.Message{
		ExtendedTextMessage: &waProto.ExtendedTextMessage{
			Text:        proto.String(text),
			ContextInfo: contextInfo,
		},
	}

	// Send the message
	resp, err := a.waClient.SendMessage(a.ctx, parsedJID, msgContent)
	if err != nil {
		return "", err
	}

	// Manually add to store and emit event for immediate UI update
	msgEvent := &events.Message{
		Info: types.MessageInfo{
			ID:        resp.ID,
			Timestamp: resp.Timestamp,
			MessageSource: types.MessageSource{
				Chat:     parsedJID,
				IsFromMe: true,
				Sender:   *a.waClient.Store.ID,
			},
		},
		Message: msgContent,
	}
	parsedHTML := a.processMessageText(msgContent)
	_ = a.messageStore.ProcessMessageEvent(a.ctx, a.waClient.Store.LIDs, msgEvent, parsedHTML)

	return resp.ID, nil
}
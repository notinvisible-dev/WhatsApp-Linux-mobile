package store

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"

	"github.com/lugvitc/whats4linux/internal/misc"
)

// Keys for settings that are read on hot backend paths. They are cached in
// atomics so those paths never touch the settings map (which is not safe for
// concurrent access).
const (
	notificationsKey       = "notifications_enabled"
	keepDeletedMessagesKey = "keepDeletedMessages"
	hideTypingIndicatorKey = "hideTypingIndicator"
	appearOfflineKey       = "appearOffline"
	readReceiptsKey        = "readReceipts"
	autoResponderKey       = "autoResponder"
	messageSchedulerKey    = "messageScheduler"
	voiceTranscriptionKey  = "voiceTranscription"
	fakeRepliesKey         = "fakeReplies"
)

var (
	notificationsEnabled   atomic.Bool
	keepDeletedMessages    atomic.Bool
	hideTypingIndicator    atomic.Bool
	appearOffline          atomic.Bool
	readReceipts           atomic.Bool
	autoResponderEnabled   atomic.Bool
	messageSchedulerEnabled atomic.Bool
	voiceTranscriptionEnabled atomic.Bool
	fakeRepliesEnabled     atomic.Bool
)

func init() {
	// Defaults until LoadSettings reads the persisted values.
	notificationsEnabled.Store(true)
	readReceipts.Store(true)
	autoResponderEnabled.Store(false)
	messageSchedulerEnabled.Store(false)
	voiceTranscriptionEnabled.Store(false)
	fakeRepliesEnabled.Store(false)
}

type settings struct {
	mu   sync.Mutex
	f    *os.File
	data map[string]any
}

var settingsInstance = &settings{
	data: make(map[string]any),
}

func LoadSettings() {
	var err error
	settingsInstance.f, err = os.OpenFile(filepath.Join(misc.ConfigDir, "app_settings.json"), os.O_RDWR|os.O_CREATE, 0644)
	if err != nil {
		panic(err)
	}

	decoder := json.NewDecoder(settingsInstance.f)
	_ = decoder.Decode(&settingsInstance.data)
	syncCachedSettings(settingsInstance.data)
}

func GetSettings() map[string]any {
	return settingsInstance.data
}

func SaveSettings(data map[string]any) error {
	settingsInstance.mu.Lock()
	defer settingsInstance.mu.Unlock()

	// The frontend saves its own settings snapshot, which doesn't include
	// backend-owned keys — carry them over so a generic save can't clobber
	// them (that reset the notification switch back to its default).
	for _, key := range []string{
		notificationsKey,
		keepDeletedMessagesKey,
		hideTypingIndicatorKey,
		appearOfflineKey,
		readReceiptsKey,
		autoResponderKey,
		messageSchedulerKey,
		voiceTranscriptionKey,
		fakeRepliesKey,
	} {
		if _, ok := data[key]; !ok {
			if cur, ok := settingsInstance.data[key]; ok {
				data[key] = cur
			}
		}
	}
	settingsInstance.data = data
	// Keep the cached switches in sync in case the whole settings map was
	// replaced by the frontend.
	syncCachedSettings(data)

	return settingsInstance.writeLocked()
}

// GetNotificationsEnabled reports the global notification switch. Safe for
// concurrent use; defaults to true when the setting was never persisted.
func GetNotificationsEnabled() bool {
	return notificationsEnabled.Load()
}

// SetNotificationsEnabled persists the global notification switch to
// app_settings.json and updates the cached value.
func SetNotificationsEnabled(enabled bool) error {
	notificationsEnabled.Store(enabled)

	settingsInstance.mu.Lock()
	defer settingsInstance.mu.Unlock()

	// Copy-on-write so concurrent GetSettings readers never observe a map
	// mutation mid-flight.
	newData := make(map[string]any, len(settingsInstance.data)+1)
	for k, v := range settingsInstance.data {
		newData[k] = v
	}
	newData[notificationsKey] = enabled
	settingsInstance.data = newData

	return settingsInstance.writeLocked()
}

// syncCachedSettings refreshes every cached setting from a settings map.
func syncCachedSettings(data map[string]any) {
	notificationsEnabled.Store(boolFrom(data, notificationsKey, true))
	keepDeletedMessages.Store(boolFrom(data, keepDeletedMessagesKey, false))
	hideTypingIndicator.Store(boolFrom(data, hideTypingIndicatorKey, false))
	appearOffline.Store(boolFrom(data, appearOfflineKey, false))
	readReceipts.Store(boolFrom(data, readReceiptsKey, true))
	autoResponderEnabled.Store(boolFrom(data, autoResponderKey, false))
	messageSchedulerEnabled.Store(boolFrom(data, messageSchedulerKey, false))
	voiceTranscriptionEnabled.Store(boolFrom(data, voiceTranscriptionKey, false))
	fakeRepliesEnabled.Store(boolFrom(data, fakeRepliesKey, false))
}

// boolFrom extracts a bool from a settings map, falling back to def when the
// key is unset or of an unexpected type.
func boolFrom(data map[string]any, key string, def bool) bool {
	if v, ok := data[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return def
}

// GetKeepDeletedMessages reports whether revoked messages should be kept
// instead of being replaced by the "This message was deleted" marker.
func GetKeepDeletedMessages() bool {
	return keepDeletedMessages.Load()
}

// GetHideTypingIndicator reports whether typing/paused presence should be
// suppressed.
func GetHideTypingIndicator() bool {
	return hideTypingIndicator.Load()
}

// GetAppearOffline reports whether online presence should not be broadcast.
func GetAppearOffline() bool {
	return appearOffline.Load()
}

// GetReadReceipts reports whether read receipts should be sent.
func GetReadReceipts() bool {
	return readReceipts.Load()
}

// GetAutoResponderEnabled reports whether the auto-responder is active.
func GetAutoResponderEnabled() bool {
	return autoResponderEnabled.Load()
}

// GetMessageSchedulerEnabled reports whether the message scheduler is active.
func GetMessageSchedulerEnabled() bool {
	return messageSchedulerEnabled.Load()
}

// GetVoiceTranscriptionEnabled reports whether voice transcription is active.
func GetVoiceTranscriptionEnabled() bool {
	return voiceTranscriptionEnabled.Load()
}

// GetFakeRepliesEnabled reports whether fake replies mod is active.
func GetFakeRepliesEnabled() bool {
	return fakeRepliesEnabled.Load()
}

// writeLocked persists the current settings map to disk. The caller must hold
// settingsInstance.mu.
func (s *settings) writeLocked() error {
	if s.f == nil {
		return errors.New("settings store is not initialised")
	}

	// Truncate the file before writing
	err := s.f.Truncate(0)
	if err != nil {
		return err
	}

	// Reset the file offset to the beginning
	_, err = s.f.Seek(0, 0)
	if err != nil {
		return err
	}

	encoder := json.NewEncoder(s.f)
	return encoder.Encode(s.data)
}

func CloseSettings() error {
	settingsInstance.mu.Lock()
	defer settingsInstance.mu.Unlock()

	if settingsInstance.f == nil {
		return nil
	}

	err := settingsInstance.f.Close()
	settingsInstance.f = nil
	return err
}

import { useState, useEffect } from "react"
import { GetScheduledMessages, CreateScheduledMessage, UpdateScheduledMessage, DeleteScheduledMessage } from "@wailsjs/go/api/Api"
import { store } from "@wailsjs/go/models"
import { useAppSettingsStore } from "@/store/useAppSettingsStore"
import SettingButtonDesc from "@/components/settings/SettingButtonDesc"

type ScheduledMessage = store.ScheduledMessage

interface SchedulerFormData {
  chatJID: string
  messageText: string
  scheduledAt: string
  recurring: boolean
  recurringPattern?: string
}

export function SchedulerManager() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMsg, setEditingMsg] = useState<ScheduledMessage | null>(null)
  const [formData, setFormData] = useState<SchedulerFormData>({
    chatJID: "",
    messageText: "",
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    recurring: false,
    recurringPattern: "",
  })
  const [error, setError] = useState<string | null>(null)
  const { messageScheduler, updateSetting } = useAppSettingsStore()

  const loadMessages = async () => {
    try {
      const data = await GetScheduledMessages()
      setMessages(data)
    } catch (err) {
      setError("Failed to load scheduled messages")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const handleSubmit = async () => {
    setError(null)
    try {
      const scheduledAt = new Date(formData.scheduledAt).getTime()
      if (editingMsg) {
        await UpdateScheduledMessage(editingMsg.ID, {
          ...formData,
          scheduledAt,
        } as any)
      } else {
        await CreateScheduledMessage({
          ...formData,
          scheduledAt,
        } as any)
      }
      setEditingMsg(null)
      setFormData({
        chatJID: "",
        messageText: "",
        scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        recurring: false,
        recurringPattern: "",
      })
      loadMessages()
    } catch (err: any) {
      setError(err?.message || "Failed to save")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this scheduled message?")) return
    try {
      await DeleteScheduledMessage(id)
      loadMessages()
    } catch (err) {
      setError("Failed to delete")
    }
  }

  const startEdit = (msg: ScheduledMessage) => {
    setEditingMsg(msg)
    setFormData({
      chatJID: msg.ChatJID,
      messageText: msg.MessageText,
      scheduledAt: new Date(msg.ScheduledAt).toISOString().slice(0, 16),
      recurring: msg.Recurring,
      recurringPattern: msg.RecurringPattern || "",
    })
  }

  const cancelEdit = () => {
    setEditingMsg(null)
    setFormData({
      chatJID: "",
      messageText: "",
      scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      recurring: false,
      recurringPattern: "",
    })
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-light-text dark:text-dark-text">Scheduled Messages</h3>
        <SettingButtonDesc
          title={messageScheduler ? "Enabled" : "Disabled"}
          description="Toggle message scheduler globally"
          onToggle={() => updateSetting("messageScheduler", !messageScheduler)}
          isEnabled={messageScheduler}
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {editingMsg ? (
        <div className="bg-white dark:bg-dark-secondary rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Edit Scheduled Message</h4>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chat JID</label>
              <input
                value={formData.chatJID}
                onChange={e => setFormData({ ...formData, chatJID: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1234567890@s.whatsapp.net"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <textarea
                value={formData.messageText}
                onChange={e => setFormData({ ...formData, messageText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Message to send"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send At</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                  className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                />
                Recurring
              </label>
            </div>
            {formData.recurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pattern (cron-like)</label>
                <input
                  value={formData.recurringPattern}
                  onChange={e => setFormData({ ...formData, recurringPattern: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. 0 9 * * 1-5 (weekdays 9am)"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={cancelEdit} className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                {editingMsg ? "Update" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFormData({ chatJID: "", messageText: "", scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16), recurring: false, recurringPattern: "" })}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-left flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Schedule New Message
        </button>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No scheduled messages. Click "Schedule New Message" to create one.</div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.ID}
              className={`rounded-xl p-3 border ${msg.Sent ? "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50" : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-light-text dark:text-dark-text">
                      {msg.Sent ? "✓ Sent" : "⏰ Pending"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${msg.Sent ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}`}>
                      {msg.Recurring ? "Recurring" : "Once"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(msg.ScheduledAt)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    To: {msg.ChatJID}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {msg.MessageText.slice(0, 100)}{msg.MessageText.length > 100 ? "..." : ""}
                  </div>
                  {msg.RecurringPattern && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pattern: {msg.RecurringPattern}</div>
                  )}
                </div>
                {!msg.Sent && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(msg)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button
                      onClick={() => handleDelete(msg.ID)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
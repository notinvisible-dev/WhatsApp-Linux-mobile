import { useState, useEffect } from "react"
import { GetAutoResponderRules, CreateAutoResponderRule, UpdateAutoResponderRule, DeleteAutoResponderRule } from "@wailsjs/go/api/Api"
import { store } from "@wailsjs/go/models"
import { useAppSettingsStore } from "@/store/useAppSettingsStore"
import SettingButtonDesc from "@/components/settings/SettingButtonDesc"

type AutoResponderRule = store.AutoResponderRule

interface RuleFormData {
  name: string
  enabled: boolean
  matchType: "keyword" | "exact" | "contains" | "all"
  keyword: string
  responseText: string
  chatJID: string
}

const MATCH_TYPES = [
  { value: "keyword", label: "Keyword" },
  { value: "exact", label: "Exact match" },
  { value: "contains", label: "Contains" },
  { value: "all", label: "All messages" },
] as const

export function AutoResponderManager() {
  const [rules, setRules] = useState<AutoResponderRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<AutoResponderRule | null>(null)
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    enabled: true,
    matchType: "keyword",
    keyword: "",
    responseText: "",
    chatJID: "",
  })
  const [error, setError] = useState<string | null>(null)
  const { autoResponder, updateSetting } = useAppSettingsStore()

  const loadRules = async () => {
    try {
      const data = await GetAutoResponderRules()
      setRules(data)
    } catch (err) {
      setError("Failed to load rules")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleSubmit = async () => {
    setError(null)
    try {
      if (editingRule) {
        await UpdateAutoResponderRule(editingRule.ID, formData as any)
      } else {
        await CreateAutoResponderRule(formData as any)
      }
      setEditingRule(null)
      setFormData({ name: "", enabled: true, matchType: "keyword", keyword: "", responseText: "", chatJID: "" })
      loadRules()
    } catch (err: any) {
      setError(err?.message || "Failed to save rule")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this rule?")) return
    try {
      await DeleteAutoResponderRule(id)
      loadRules()
    } catch (err) {
      setError("Failed to delete rule")
    }
  }

  const startEdit = (rule: AutoResponderRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.Name,
      enabled: rule.Enabled,
      matchType: rule.MatchType as any,
      keyword: rule.Keyword,
      responseText: rule.ResponseText,
      chatJID: rule.ChatJID,
    })
  }

  const cancelEdit = () => {
    setEditingRule(null)
    setFormData({ name: "", enabled: true, matchType: "keyword", keyword: "", responseText: "", chatJID: "" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-light-text dark:text-dark-text">Auto-Responder Rules</h3>
        <SettingButtonDesc
          title={autoResponder ? "Enabled" : "Disabled"}
          description="Toggle auto-responder globally"
          onToggle={() => updateSetting("autoResponder", !autoResponder)}
          isEnabled={autoResponder}
        />
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      {editingRule ? (
        <div className="bg-white dark:bg-dark-secondary rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3">Edit Rule</h4>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Rule name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match Type</label>
              <select
                value={formData.matchType}
                onChange={e => setFormData({ ...formData, matchType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {MATCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keyword / Pattern</label>
              <input
                value={formData.keyword}
                onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Keyword to match"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Response Text</label>
              <textarea
                value={formData.responseText}
                onChange={e => setFormData({ ...formData, responseText: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Auto-reply text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chat JID (optional)</label>
              <input
                value={formData.chatJID}
                onChange={e => setFormData({ ...formData, chatJID: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Leave empty for all chats"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                  className="rounded border-gray-300 text-green-500 focus:ring-green-500"
                />
                Enabled
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={cancelEdit} className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                {editingRule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFormData({ name: "", enabled: true, matchType: "keyword", keyword: "", responseText: "", chatJID: "" })}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-left flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Add New Rule
        </button>
      )}

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No rules yet. Click "Add New Rule" to create one.</div>
        ) : (
          rules.map(rule => (
            <div
              key={rule.ID}
              className={`rounded-xl p-3 border ${rule.Enabled ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-light-text dark:text-dark-text">{rule.Name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${rule.Enabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {rule.Enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-medium">{rule.MatchType}:</span> {rule.Keyword || "(all messages)"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    Reply: {rule.ResponseText}
                  </div>
                  {rule.ChatJID && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Chat: {rule.ChatJID}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(rule)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(rule.ID)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from "react"
import {
  GetCustomCSS,
  SetCustomCSS,
  GetCustomJS,
  SetCustomJS,
  Reinitialize,
} from "../../../wailsjs/go/api/Api"
import { useAppSettingsStore } from "../../store/useAppSettingsStore"
import SettingButtonDesc from "../../components/settings/SettingButtonDesc"

import ComponentColorSelector from "../../components/settings/ComponentColorSelector"
import EaseVisualizer from "../../components/settings/ComponentEaseSelector"
import { AutoResponderManager } from "../../components/mods/AutoResponderManager"
import { SchedulerManager } from "../../components/mods/SchedulerManager"

const AdvancedScreen = () => {
  const [customCSS, setCustomCSS] = useState("")
  const [customJS, setCustomJS] = useState("")
  const [showAutoResponder, setShowAutoResponder] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)

  const {
    keepDeletedMessages,
    hideTypingIndicator,
    appearOffline,
    autoResponder,
    messageScheduler,
    voiceTranscription,
    fakeReplies,
    updateSetting,
  } = useAppSettingsStore()

  useEffect(() => {
    GetCustomCSS().then(setCustomCSS)
    GetCustomJS().then(setCustomJS)
  }, [])

  const applyCustomCode = (code: string, id: string, tag: "style" | "script") => {
    const oldElement = document.getElementById(id)
    if (oldElement) oldElement.remove()

    if (code) {
      const element = document.createElement(tag)
      element.id = id
      element.innerHTML = code
      document[tag === "style" ? "head" : "body"].appendChild(element)
    }
  }

  const handleSaveCSS = async () => {
    await SetCustomCSS(customCSS)
    applyCustomCode(customCSS, "custom-css", "style")
    alert("Custom CSS saved and applied!")
  }

  const handleSaveJS = async () => {
    await SetCustomJS(customJS)
    applyCustomCode(customJS, "custom-js", "script")
    alert("Custom JS saved and applied!")
  }

  const handleReloadCustom = async () => {
    const [css, js] = await Promise.all([GetCustomCSS(), GetCustomJS()])
    setCustomCSS(css)
    setCustomJS(js)
    applyCustomCode(css, "custom-css", "style")
    applyCustomCode(js, "custom-js", "script")
    alert("Custom CSS and JS reloaded from disk!")
  }

  const handleReinitialize = async () => {
    await Reinitialize()
    alert("Reinitialized!")
  }

  return (
    <>
      {/* Mods Section */}
      <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium mb-2 text-light-text dark:text-dark-text">Mods</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Experimental tweaks. Use at your own risk.
        </p>
        <SettingButtonDesc
          title="Keep deleted messages"
          description="Don't replace revoked messages with 'This message was deleted'. Lets you read deleted messages."
          onToggle={() => updateSetting("keepDeletedMessages", !keepDeletedMessages)}
          isEnabled={keepDeletedMessages}
        />
        <SettingButtonDesc
          title="Hide typing indicator"
          description="Don't send 'composing' or 'paused' presence to contacts."
          onToggle={() => updateSetting("hideTypingIndicator", !hideTypingIndicator)}
          isEnabled={hideTypingIndicator}
        />
        <SettingButtonDesc
          title="Appear offline"
          description="Don't broadcast online/offline presence. You'll appear offline to contacts."
          onToggle={() => updateSetting("appearOffline", !appearOffline)}
          isEnabled={appearOffline}
        />
        <SettingButtonDesc
          title="Auto-responder (keyword)"
          description="Auto-reply to messages matching keywords. Configure rules in the Mods panel."
          onToggle={() => updateSetting("autoResponder", !autoResponder)}
          isEnabled={autoResponder}
        />
        <SettingButtonDesc
          title="Message scheduler"
          description="Schedule messages to send later. Add scheduled messages in the Mods panel."
          onToggle={() => updateSetting("messageScheduler", !messageScheduler)}
          isEnabled={messageScheduler}
        />
        <SettingButtonDesc
          title="Voice transcription"
          description="Transcribe voice messages to text. Tap a voice message to see transcript."
          onToggle={() => updateSetting("voiceTranscription", !voiceTranscription)}
          isEnabled={voiceTranscription}
        />
        <SettingButtonDesc
          title="Fake replies"
          description="Reply to non-existent messages. When replying, pick a contact and craft a fake quoted message."
          onToggle={() => updateSetting("fakeReplies", !fakeReplies)}
          isEnabled={fakeReplies}
        />
      </div>

      {autoResponder && (
        <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text">Auto-Responder Rules</h3>
            <button
              onClick={() => setShowAutoResponder(!showAutoResponder)}
              className="text-sm text-green-500 hover:underline"
            >
              {showAutoResponder ? "Hide Rules" : "Manage Rules"}
            </button>
          </div>
          {showAutoResponder && <AutoResponderManager />}
        </div>
      )}

      {messageScheduler && (
        <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-light-text dark:text-dark-text">Message Scheduler</h3>
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="text-sm text-green-500 hover:underline"
            >
              {showScheduler ? "Hide Scheduler" : "Manage Scheduled Messages"}
            </button>
          </div>
          {showScheduler && <SchedulerManager />}
        </div>
      )}

      <ComponentColorSelector />
      <EaseVisualizer />
      <CodeEditor
        title="Custom CSS"
        value={customCSS}
        onChange={setCustomCSS}
        onSave={handleSaveCSS}
        placeholder="/* Enter custom CSS here */"
      />

      <CodeEditor
        title="Custom JS"
        value={customJS}
        onChange={setCustomJS}
        onSave={handleSaveJS}
        placeholder="// Enter custom JS here"
      />

      <Section
        title="Reload Customizations"
        description="Reload custom CSS and JS from disk. Useful if you edited the files externally."
        buttonText="Reload CSS & JS"
        onClick={handleReloadCustom}
        buttonColor="blue"
      />

      <Section
        title="Session Management"
        description="Re-initialize the WhatsApp connection. Use this if you're experiencing sync issues."
        buttonText="Re-initialize Connection"
        onClick={handleReinitialize}
        buttonColor="gray"
      />
    </>
  )
}

function CodeEditor({ title, value, onChange, onSave, placeholder }: any) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2 text-light-text dark:text-dark-text">{title}</h3>
      <textarea
        className="w-full h-40 p-3 bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-green-500"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        onClick={onSave}
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        Save {title}
      </button>
    </div>
  )
}

function Section({
  title,
  description,
  buttonText,
  onClick,
  buttonColor,
}: {
  title: string
  description: string
  buttonText: string
  onClick: () => void
  buttonColor: "blue" | "gray"
}) {
  const colors = {
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    gray: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white",
  }

  return (
    <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 className="text-lg font-medium mb-2 text-light-text dark:text-dark-text">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded transition-colors ${colors[buttonColor]}`}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default AdvancedScreen

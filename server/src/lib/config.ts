import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(__dirname, '../../arttrack-config.json')

export interface AppConfig {
  gmailClientId?: string
  gmailClientSecret?: string
  gmailAccessToken?: string
  gmailRefreshToken?: string
  gmailConnected?: boolean
  gmailEmail?: string
  setupComplete?: boolean
  setupSkipped?: boolean
  facebookPageId?: string
  facebookAccessToken?: string
  facebookPageName?: string
  facebookConnected?: boolean
}

export function readConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function writeConfig(patch: Partial<AppConfig>): AppConfig {
  const current = readConfig()
  const updated = { ...current, ...patch }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

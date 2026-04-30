import { google } from 'googleapis'
import { readConfig, writeConfig } from './config'

const REDIRECT_URI = 'http://localhost:3001/api/gmail/callback'
const CLIENT_REDIRECT = 'http://localhost:5173/setup'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
]

// Keywords that suggest a commission inquiry
const INQUIRY_KEYWORDS = [
  'commission', 'portrait', 'painting', 'artwork', 'custom', 'illustration',
  'pet portrait', 'how much', 'quote', 'price', 'order', 'inquiry', 'interested',
  'available', 'piece', 'drawing', 'watercolor', 'acrylic', 'digital art',
  'can you paint', 'would you be', 'looking for',
]

export function getRedirectUris() {
  return { REDIRECT_URI, CLIENT_REDIRECT }
}

export function createOAuthClient() {
  const config = readConfig()
  const oauth2 = new google.auth.OAuth2(
    config.gmailClientId,
    config.gmailClientSecret,
    REDIRECT_URI
  )
  if (config.gmailAccessToken) {
    oauth2.setCredentials({
      access_token: config.gmailAccessToken,
      refresh_token: config.gmailRefreshToken,
    })
    // Auto-save refreshed tokens
    oauth2.on('tokens', (tokens) => {
      if (tokens.access_token) {
        writeConfig({ gmailAccessToken: tokens.access_token })
      }
    })
  }
  return oauth2
}

export function getAuthUrl(): string {
  const config = readConfig()
  const oauth2 = new google.auth.OAuth2(
    config.gmailClientId,
    config.gmailClientSecret,
    REDIRECT_URI
  )
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export function isInquiry(subject: string, body: string): boolean {
  const text = `${subject} ${body}`.toLowerCase()
  return INQUIRY_KEYWORDS.some((k) => text.includes(k))
}

function decodeBase64(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractBody(payload: any): string {
  if (!payload) return ''
  // Plain text preferred
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }
  return ''
}

export interface FetchedEmail {
  gmailId: string
  subject: string
  from: string
  body: string
  snippet: string
  receivedAt: Date
  isInquiry: boolean
}

export async function fetchRecentEmails(maxResults = 30): Promise<FetchedEmail[]> {
  const oauth2 = createOAuthClient()
  const gmail = google.gmail({ version: 'v1', auth: oauth2 })

  const listRes = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'in:inbox newer_than:30d',
  })

  const messages = listRes.data.messages || []
  const results: FetchedEmail[] = []

  for (const msg of messages) {
    if (!msg.id) continue
    try {
      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      })
      const headers = full.data.payload?.headers || []
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const dateStr = getHeader('Date')
      const body = extractBody(full.data.payload)
      const snippet = full.data.snippet || ''

      results.push({
        gmailId: msg.id,
        subject,
        from,
        body,
        snippet,
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
        isInquiry: isInquiry(subject, body),
      })
    } catch {
      // Skip emails that fail to fetch
    }
  }

  return results
}

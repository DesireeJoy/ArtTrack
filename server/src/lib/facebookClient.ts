export const INQUIRY_KEYWORDS = [
  'commission', 'portrait', 'painting', 'artwork', 'custom', 'illustration',
  'pet portrait', 'how much', 'quote', 'price', 'order', 'inquiry',
  'interested', 'available', 'piece', 'drawing', 'watercolor', 'acrylic',
  'digital art', 'can you paint', 'would you be', 'looking for',
]

export function isInquiry(text: string): boolean {
  const lower = text.toLowerCase()
  return INQUIRY_KEYWORDS.some((kw) => lower.includes(kw))
}

export interface FBMessage {
  id: string
  message?: string
  from: { id: string; name: string; email?: string }
  created_time: string
}

interface FBConversation {
  id: string
  participants?: { data: Array<{ id: string; name: string; email?: string }> }
  messages?: { data: FBMessage[] }
}

export async function fetchRecentMessages(
  pageId: string,
  accessToken: string,
  maxResults = 50,
): Promise<FBMessage[]> {
  const fields = 'id,participants,messages.limit(10){id,message,from,created_time}'
  const url =
    `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/conversations` +
    `?fields=${encodeURIComponent(fields)}&limit=25&access_token=${accessToken}`

  const res = await fetch(url)
  const data = (await res.json()) as {
    data?: FBConversation[]
    error?: { message: string }
  }

  if (data.error) throw new Error(`Facebook API: ${data.error.message}`)
  if (!res.ok) throw new Error(`Facebook API error: ${res.status}`)
  if (!data.data) return []

  const messages: FBMessage[] = []
  for (const conv of data.data) {
    if (!conv.messages?.data) continue
    for (const msg of conv.messages.data) {
      if (msg.from?.id === pageId) continue   // skip our own outgoing replies
      if (!msg.message?.trim()) continue       // skip stickers / attachments with no text
      messages.push(msg)
    }
  }

  // newest first
  messages.sort(
    (a, b) =>
      new Date(b.created_time).getTime() - new Date(a.created_time).getTime(),
  )
  return messages.slice(0, maxResults)
}

export async function getPageInfo(
  pageId: string,
  accessToken: string,
): Promise<{ name: string; id: string }> {
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=name,id&access_token=${accessToken}`
  const res = await fetch(url)
  const data = (await res.json()) as { name?: string; id?: string; error?: { message: string } }
  if (data.error) throw new Error(data.error.message)
  if (!res.ok) throw new Error(`Facebook API error: ${res.status}`)
  return { name: data.name ?? pageId, id: data.id ?? pageId }
}

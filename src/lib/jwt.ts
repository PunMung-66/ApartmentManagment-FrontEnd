// Decode JWT token without verification (safe because we verify on backend)
// This extracts the claims that were signed by the backend
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export function getTokenRole(token: string): string | null {
  const decoded = decodeJWT(token)
  return decoded?.role as string | null
}

export function getTokenUserId(token: string): string | null {
  const decoded = decodeJWT(token)
  return decoded?.user_id as string | null
}

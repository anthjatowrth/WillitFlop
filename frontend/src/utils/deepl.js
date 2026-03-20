const API_URL = import.meta.env.VITE_API_URL

/**
 * Translate an array of strings to French via the backend proxy.
 * Falls back to the original strings on error.
 *
 * @param {string[]} texts
 * @returns {Promise<string[]>}
 */
export async function translateToFR(texts) {
  if (!texts.length) return texts

  try {
    const res = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    })

    if (!res.ok) return texts

    const data = await res.json()
    return data.translations
  } catch {
    return texts
  }
}

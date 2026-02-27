export function formatDateSmart(input: string | Date | null | undefined, format: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  if (!input) return ''

  // Si déjà un objet Date
  if (input instanceof Date) {
    return input.toLocaleDateString('fr-FR', format)
  }

  const str = String(input)

  // Cas 1 : format YYYY-MM-DD strict
  const isSimpleDate = /^\d{4}-\d{2}-\d{2}$/.test(str)

  let date: Date

  if (isSimpleDate) {
    const [y, m, d] = str.split('-').map(Number)
    date = new Date(y, m - 1, d) // local time (safe)
  } else {
    // Cas 2 : timestamp (ISO, timestamptz, etc.)
    date = new Date(str)
  }

  if (isNaN(date.getTime())) return ''

  return date.toLocaleDateString('fr-FR', format)
}
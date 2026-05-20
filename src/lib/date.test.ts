import { describe, it, expect } from 'vitest'
import { formatDateSmart } from './date'

describe('formatDateSmart', () => {
  // ─── Valeurs nulles / undefined ────────────────────────────────────────────

  it('retourne une chaîne vide pour null', () => {
    expect(formatDateSmart(null)).toBe('')
  })

  it('retourne une chaîne vide pour undefined', () => {
    expect(formatDateSmart(undefined)).toBe('')
  })

  it('retourne une chaîne vide pour une chaîne vide', () => {
    expect(formatDateSmart('')).toBe('')
  })

  // ─── Format YYYY-MM-DD ────────────────────────────────────────────────────

  it('formate une date YYYY-MM-DD en français', () => {
    const result = formatDateSmart('2025-03-15')
    expect(result).toBe('15 mars 2025')
  })

  it('formate le 1er janvier correctement', () => {
    const result = formatDateSmart('2025-01-01')
    expect(result).toBe('1 janvier 2025')
  })

  it('formate le 31 décembre correctement', () => {
    const result = formatDateSmart('2025-12-31')
    expect(result).toBe('31 décembre 2025')
  })

  // ─── Objet Date ───────────────────────────────────────────────────────────

  it('formate un objet Date', () => {
    // new Date(year, monthIndex, day) — monthIndex est 0-basé
    const date = new Date(2025, 5, 20) // 20 juin 2025
    const result = formatDateSmart(date)
    expect(result).toBe('20 juin 2025')
  })

  // ─── Timestamp ISO ────────────────────────────────────────────────────────

  it('formate un timestamp ISO (timestamptz)', () => {
    const result = formatDateSmart('2025-07-04T14:30:00.000Z')
    // Le jour exact peut varier selon le fuseau, on vérifie que ça contient "juillet 2025"
    expect(result).toContain('2025')
    expect(result).toContain('juillet')
  })

  // ─── Chaîne invalide ──────────────────────────────────────────────────────

  it('retourne une chaîne vide pour une chaîne invalide', () => {
    expect(formatDateSmart('pas-une-date')).toBe('')
  })

  it('retourne une chaîne vide pour "abc"', () => {
    expect(formatDateSmart('abc')).toBe('')
  })

  // ─── Format personnalisé ──────────────────────────────────────────────────

  it('accepte un format personnalisé', () => {
    const result = formatDateSmart('2025-03-15', { weekday: 'long', day: 'numeric', month: 'long' })
    expect(result).toContain('samedi')
    expect(result).toContain('15')
    expect(result).toContain('mars')
  })

  it('format court (numérique)', () => {
    const result = formatDateSmart('2025-03-15', { day: '2-digit', month: '2-digit', year: 'numeric' })
    expect(result).toBe('15/03/2025')
  })
})

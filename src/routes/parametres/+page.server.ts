import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const user = await getUser()

  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: any) => [s.key, s.value])
  )

  return { settings: settingsMap }
}

export const actions: Actions = {

  changerNom: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const formData = await request.formData()
    const name = formData.get('name')?.toString().trim()

    if (!name || name.length < 2) return fail(400, { changerNom: { error: 'Le nom doit contenir au moins 2 caractères' } })

    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)

    if (error) return fail(500, { changerNom: { error: 'Erreur lors de la mise à jour' } })

    return { changerNom: { success: true } }
  },

  changerMotDePasse: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const formData = await request.formData()
    const password = formData.get('password')?.toString()
    const confirm = formData.get('confirm')?.toString()

    if (!password || password.length < 8) {
      return fail(400, { changerMotDePasse: { error: 'Le mot de passe doit contenir au moins 8 caractères' } })
    }
    if (password !== confirm) {
      return fail(400, { changerMotDePasse: { error: 'Les mots de passe ne correspondent pas' } })
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) return fail(500, { changerMotDePasse: { error: 'Erreur lors du changement de mot de passe' } })

    return { changerMotDePasse: { success: true } }
  },

  mettreAJourSettings: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'secretaire_generale') {
      return fail(403, { error: 'Non autorisé' })
    }

    const formData = await request.formData()
    const key = formData.get('key')?.toString()
    const value = formData.get('value')?.toString()

    if (!key || !value) return fail(400, { settings: { error: 'Données invalides' } })

    try {
      JSON.parse(value)
    } catch {
      return fail(400, { settings: { error: 'Format JSON invalide' } })
    }

    const { error } = await supabase
      .from('settings')
      .update({ value: JSON.parse(value), updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('key', key)

    if (error) return fail(500, { settings: { error: 'Erreur lors de la mise à jour' } })

    return { settings: { success: true } }
  },

  mettreAJourAllSettings: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'secretaire_generale') {
      return fail(403, { error: 'Non autorisé' })
    }

    const formData = await request.formData()
    const settingsJson = formData.get('settings')?.toString()

    if (!settingsJson) return fail(400, { allSettings: { error: 'Données invalides' } })

    let settings: Record<string, unknown>
    try {
      settings = JSON.parse(settingsJson)
    } catch {
      return fail(400, { allSettings: { error: 'Format JSON invalide' } })
    }

    const now = new Date().toISOString()
    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        supabase
          .from('settings')
          .update({ value, updated_at: now, updated_by: user.id })
          .eq('key', key)
      )
    )

    const failed = results.filter((r: { error: unknown }) => r.error)
    if (failed.length > 0) {
      return fail(500, { allSettings: { error: 'Erreur lors de la mise à jour' } })
    }

    return { allSettings: { success: true } }
  },
}
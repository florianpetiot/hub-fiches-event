import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { PUBLIC_SITE_URL } from '$env/static/public'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')

  const { data: clubs } = await supabase
  .from('profiles')
  .select('id, name, email, created_at, role_id, roles!inner(name)')
  .eq('roles.name', 'club')
  .order('name')

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: any) => [s.key, s.value])
  )

  return { settings: settingsMap, clubs: clubs ?? [] }
}

export const actions: Actions = {

  // PERSONAL SETTINGS
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

  // CLUBS SETTINGS
  creerClub: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name, label)')
      .eq('id', user.id)
      .single()

    if (profile?.roles.name !== 'direction') return fail(403)

    const formData = await request.formData()
    const email = formData.get('email')?.toString().trim()
    const name = formData.get('name')?.toString().trim()

    if (!email || !name) return fail(400, { creerClub: { error: 'Tous les champs sont obligatoires' } })

    const { supabaseAdmin } = await import('$lib/supabase-admin')

    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
      data: { name, role: 'club' }
    })

    if (inviteError) return fail(500, { creerClub: { error: inviteError.message } })

    const { data: role } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'club')
      .single()

    await supabaseAdmin
      .from('profiles')
      .update({ role_id: role!.id, name })
      .eq('id', newUser.user.id)

    return { creerClub: { success: true } }
  },


  supprimerClub: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name, label)')
      .eq('id', user.id)
      .single()

    if (profile?.roles.name !== 'direction') return fail(403)

    const formData = await request.formData()
    const id = formData.get('id')?.toString()

    const { supabaseAdmin } = await import('$lib/supabase-admin')

    // Supprimer l'utilisateur auth (cascade supprime le profil)
    await supabaseAdmin.auth.admin.deleteUser(id!)

    return { supprimerClub: { success: true } }
  },

  // EVENT SETTINGS
  mettreAJourSettings: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name, label)')
      .eq('id', user.id)
      .single()

    if (profile?.roles.name !== 'direction') {
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
      .select('roles(name, label)')
      .eq('id', user.id)
      .single()

    if (profile?.roles.name !== 'direction') {
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
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
      JSON.parse(value) // vérifier que c'est du JSON valide
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

  creerCompte: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401, { error: 'Non autorisé' })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!['admin', 'secretaire_generale'].includes(profile?.role)) {
      return fail(403, { error: 'Non autorisé' })
    }

    const formData = await request.formData()
    const email = formData.get('email')?.toString().trim()
    const name = formData.get('name')?.toString().trim()
    const role = formData.get('role')?.toString()

    if (!email || !name || !role) {
      return fail(400, { creerCompte: { error: 'Tous les champs sont obligatoires' } })
    }

    if (!['admin', 'club'].includes(role)) {
      return fail(400, { creerCompte: { error: 'Rôle invalide' } })
    }

    // Inviter l'utilisateur via Supabase Admin
    const { supabaseAdmin } = await import('$lib/supabase-admin')
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name, role }
    })

    if (inviteError) return fail(500, { creerCompte: { error: inviteError.message } })

    // Mettre à jour le profil avec le bon rôle et nom
    await supabaseAdmin
      .from('profiles')
      .update({ role, name })
      .eq('id', newUser.user.id)

    // Si club, créer l'entrée dans clubs
    if (role === 'club') {
      await supabaseAdmin
        .from('clubs')
        .insert({ profile_id: newUser.user.id, name })
    }

    return { creerCompte: { success: true } }
  }
}
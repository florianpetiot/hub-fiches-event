import { fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { PUBLIC_SITE_URL } from '$env/static/public'

export const load: PageServerLoad = async ({ locals: { supabase, getUser } }) => {
  const [
    { data: settings },
    { data: clubs },
    { data: roles },
    { data: admins },
    { data: workflowRaw }
  ] = await Promise.all([
    supabase.from('settings').select('key, value'),
    
    supabase.from('profiles').select('id, name, email, created_at, role_id, roles!inner(name)')
      .eq('roles.name', 'club').order('name'),
      
    supabase.from('roles').select('*').order('created_at'),
    
    supabase.from('profiles').select('*, roles!inner(name, label)')
      .neq('roles.name', 'club').order('name'),
      
    supabase.from('workflow_etapes').select('*, roles!inner(name, label)').order('ordre')
  ]);
  const workflow = workflowRaw?.filter((w: any) => w.roles?.name !== 'direction') ?? [];
  const settingsMap = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]));
  return { 
    settings: settingsMap, 
    clubs: clubs ?? [], 
    roles: roles ?? [], 
    admins: admins ?? [], 
    workflow 
  };
}

const reordonnerWorkflow = async (supabase: any) => {
  const { data: etapes, error: etapesError } = await supabase
    .from('workflow_etapes')
    .select('id, roles(name)')
    .order('ordre')

  if (etapesError) return etapesError.message ?? 'Erreur supabase'

  const etapesSansDirection = etapes?.filter((e: any) => e.roles?.name !== 'direction') ?? []
  const directionEtape = etapes?.find((e: any) => e.roles?.name === 'direction')

  for (let i = 0; i < etapesSansDirection.length; i++) {
    const { error } = await supabase
      .from('workflow_etapes')
      .update({ ordre: i + 1 })
      .eq('id', etapesSansDirection[i].id)

    if (error) return error.message ?? 'Erreur supabase'
  }

  if (directionEtape) {
    const { error } = await supabase
      .from('workflow_etapes')
      .update({ ordre: etapesSansDirection.length + 1 })
      .eq('id', directionEtape.id)

    if (error) return error.message ?? 'Erreur supabase'
  }

  return null
}

const supprimerEtapeWorkflowParId = async (
  supabase: any,
  id: string,
  options?: { verifierDirection?: boolean; reordonner?: boolean }
) => {
  const verifierDirection = options?.verifierDirection ?? true
  const doitReordonner = options?.reordonner ?? true

  if (verifierDirection) {
    const { data: etape, error: etapeError } = await supabase
      .from('workflow_etapes')
      .select('roles(name)')
      .eq('id', id)
      .single()

    if (etapeError) return etapeError.message ?? 'Erreur supabase'
    if (etape?.roles?.name === 'direction') return "L'étape Direction ne peut pas être supprimée"
  }

  const { error: signaturesError } = await supabase
    .from('signatures')
    .delete()
    .eq('workflow_etape_id', id)
    .eq('status', 'en_attente')

  if (signaturesError) return signaturesError.message ?? 'Erreur supabase'

  const { error: deleteEtapeError } = await supabase
    .from('workflow_etapes')
    .delete()
    .eq('id', id)

  if (deleteEtapeError) return deleteEtapeError.message ?? 'Erreur supabase'

  if (doitReordonner) {
    return await reordonnerWorkflow(supabase)
  }

  return null
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

    if (!id) return fail(400, { supprimerClub: { error: 'ID manquant' } })
    
    // PROTECTION : S'assurer que la cible a bien le rôle club
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', id)
      .single()
    if (targetProfile?.roles?.name !== 'club') {
      return fail(403, { supprimerClub: { error: 'La cible n\'est pas un club valide.' } })
    }
    const { supabaseAdmin } = await import('$lib/supabase-admin')
    await supabaseAdmin.auth.admin.deleteUser(id)
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


  // ADMIN SETTINGS
  creerAdmin: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
    if (profile?.roles?.name !== 'direction') return fail(403, { creerAdmin: { error: 'Non autorisé' } })

    const formData = await request.formData()
    const email = formData.get('email')?.toString().trim()
    const name = formData.get('name')?.toString().trim()
    const role_id = formData.get('role_id')?.toString()

    if (!email || !name || !role_id) return fail(400, { creerAdmin: { error: 'Tous les champs sont obligatoires' } })

    const { supabaseAdmin } = await import('$lib/supabase-admin')
    const { data: newUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
      data: { name, role_id }
    })

    if (inviteError) return fail(500, { creerAdmin: { error: inviteError.message } })

    await supabaseAdmin.from('profiles').update({ role_id, name }).eq('id', newUser.user.id)

    return { creerAdmin: { success: true } }
  },


  changerRoleAdmin: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const { data: isDirection } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
    if (isDirection?.roles?.name !== 'direction') return fail(403, { changerRoleAdmin: { error: 'Non autorisé' } })

    const formData = await request.formData()
    const profile_id = formData.get('profile_id')?.toString()
    const role_id = formData.get('role_id')?.toString()


    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', profile_id)
      .single()

    if (profile?.roles?.name === 'direction') {
      return fail(403, { changerRoleAdmin: { error: 'Impossible de modifier le rôle d\'un compte Direction' } })
    }

    const { data: newRole } = await supabase
      .from('roles')
      .select('name')
      .eq('id', role_id)
      .single()

    if (newRole?.name === 'direction') {
      return fail(403, { changerRoleAdmin: { error: 'Impossible d\'assigner le rôle Direction' } })
    }

    await supabase.from('profiles').update({ role_id }).eq('id', profile_id)

    // Si l'ancien rôle n'est plus utilisé, nettoyer ses étapes de workflow
    if (profile?.role_id && profile.role_id !== role_id) {
      const { count: oldRoleUsageCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', profile.role_id)

      if (oldRoleUsageCount === 0) {
        const { data: etapesOldRole } = await supabase
          .from('workflow_etapes')
          .select('id')
          .eq('role_id', profile.role_id)

        if (etapesOldRole && etapesOldRole.length > 0) {
          for (const etape of etapesOldRole) {
            const err = await supprimerEtapeWorkflowParId(supabase, etape.id, { verifierDirection: false, reordonner: false })
            if (err) {
              return fail(500, { changerRoleAdmin: { error: err } })
            }
          }

          const reorderErr = await reordonnerWorkflow(supabase)
          if (reorderErr) return fail(500, { changerRoleAdmin: { error: reorderErr } })
        }
      }
    }

    return { changerRoleAdmin: { success: true } }
  },


  supprimerAdmin: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const formData = await request.formData()
    const id = formData.get('id')?.toString()

    if (!id) return fail(400, { supprimerAdmin: { error: 'ID manquant' } })

    if (id === user.id) {
      return fail(403, { supprimerAdmin: { error: 'Impossible de supprimer votre propre compte' } })
    }

    const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
    if (profile?.roles?.name !== 'direction') return fail(403, { supabaseAdmin: { error: 'Non autorisé' } })


    // Récupérer le rôle de l'admin à supprimer
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role_id')
      .eq('id', id)
      .single()

    if (profileData) {
      // Compter combien de comptes ont ce même rôle (en excluant celui qu'on supprime)
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role_id', profileData.role_id)
        .neq('id', id)

      // Si plus personne n'a ce rôle après suppression → nettoyer
      if (count === 0) {
        const { data: etapes } = await supabase
          .from('workflow_etapes')
          .select('id')
          .eq('role_id', profileData.role_id)

        if (etapes && etapes.length > 0) {
          for (const etape of etapes) {
            const err = await supprimerEtapeWorkflowParId(supabase, etape.id, { verifierDirection: false, reordonner: false })
            if (err) {
              return fail(500, { supprimerAdmin: { error: err } })
            }
          }

          const reorderErr = await reordonnerWorkflow(supabase)
          if (reorderErr) return fail(500, { supprimerAdmin: { error: reorderErr } })
        }
      }
    }

    const { supabaseAdmin } = await import('$lib/supabase-admin')
    await supabaseAdmin.auth.admin.deleteUser(id!)
    return { supprimerAdmin: { success: true } }
  },


  creerRole: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
    if (profile?.roles?.name !== 'direction') return fail(403, { creerAdmin: { error: 'Non autorisé' } })


    const formData = await request.formData()
    const label = formData.get('label')?.toString().trim()

    if (!label) return fail(400, { creerRole: { error: 'Le nom est obligatoire' } })

    const name = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')

    const { error } = await supabase.from('roles').insert({ name, label, is_system: false })
    if (error) return fail(500, { creerRole: { error: error.message } })

    return { creerRole: { success: true } }
  },

  supprimerRole: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const { data: profile } = await supabase.from('profiles').select('roles(name)').eq('id', user.id).single()
    if (profile?.roles?.name !== 'direction') return fail(403, { creerAdmin: { error: 'Non autorisé' } })

    const formData = await request.formData()
    const id = formData.get('id')?.toString()

    // Vérifier qu'aucun compte n'utilise encore ce rôle
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)

    if (count && count > 0) {
      return fail(400, { supprimerRole: { error: `${count} compte(s) utilisent encore ce rôle` } })
    }

    const { data: role } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single()

    if (role?.is_system) {
      return fail(403, { supprimerRole: { error: 'Impossible de supprimer un rôle système' } })
    }

    // Interdire la suppression si le rôle est utilisé dans le workflow
    const { count: workflowCount } = await supabase
      .from('workflow_etapes')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id)

    if (workflowCount && workflowCount > 0) {
      return fail(400, { supprimerRole: { error: "Ce rôle est utilisé dans le workflow. Supprimez d'abord les étapes associées." } })
    }

    await supabase
      .from('roles')
      .delete()
      .eq('id', id)
    return { supprimerRole: { success: true } }
  },

  ajouterEtapeWorkflow: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const formData = await request.formData()
    const role_id = formData.get('role_id')?.toString()

    if (!role_id) {
      return fail(400, { workflow: { error: 'Rôle invalide' } })
    }

    // Interdire l'ajout d'un rôle qui n'est attribué à aucun compte
    const { count: roleUsageCount, error: roleUsageError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', role_id)

    if (roleUsageError) {
      return fail(500, { workflow: { error: roleUsageError.message ?? 'Erreur supabase' } })
    }

    if (!roleUsageCount || roleUsageCount <= 0) {
      return fail(400, { workflow: { error: "Impossible d'ajouter un rôle qui n'est utilisé par aucun compte" } })
    }

    // Récupérer toutes les étapes sauf direction
    const { data: etapes } = await supabase
      .from('workflow_etapes')
      .select('ordre, roles(name)')
      .order('ordre', { ascending: false })
    const etapesSansDirection = etapes?.filter((e: any) => e.roles?.name !== 'direction') ?? []

    const lastOrdre = etapesSansDirection[0]?.ordre ?? 0
    const nouvelOrdre = lastOrdre + 1

    // Décaler la direction pour lui laisser la place
    const { data: directionRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'direction')
      .single()
    
    if (!directionRole) return fail(500, { workflow: { error: 'Rôle direction introuvable' } })
    
    await supabase
      .from('workflow_etapes')
      .update({ ordre: nouvelOrdre + 1 })
      .eq('role_id', directionRole.id)

    const { error } = await supabase.from('workflow_etapes').insert({ role_id, ordre: nouvelOrdre })
    if (error) return fail(500, { workflow: { error: error.message } })

    return { workflow: { success: true } }
  },

  supprimerEtapeWorkflow: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const formData = await request.formData()
    const id = formData.get('id')?.toString()

    if (!id) {
      return fail(400, { workflow: { error: 'Étape invalide' } })
    }

    const err = await supprimerEtapeWorkflowParId(supabase, id)
    if (err === "L'étape Direction ne peut pas être supprimée") {
      return fail(403, { workflow: { error: err } })
    }
    if (err) {
      return fail(500, { workflow: { error: err } })
    }

    return { workflow: { success: true } }
  },

  monterEtapeWorkflow: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const formData = await request.formData()
    const id = formData.get('id')?.toString()
    const ordre = parseInt(formData.get('ordre')?.toString() ?? '0')
    try {
      if (ordre <= 1) {
        return { workflow: { success: true } }
      }

      const { data: etapePrecedente, error: epError } = await supabase
        .from('workflow_etapes')
        .select('id')
        .eq('ordre', ordre - 1)
        .single()

      if (epError) {
        
        return fail(500, { workflow: { error: epError.message ?? 'Erreur supabase' } })
      }
      if (!etapePrecedente) {
        return { workflow: { success: true } }
      }

      // Passer par un ordre temporaire négatif pour éviter le conflit unique
      const { error: tmpError } = await supabase
        .from('workflow_etapes')
        .update({ ordre: -1 })
        .eq('id', id)

      if (tmpError) {
        return fail(500, { workflow: { error: tmpError.message ?? 'Erreur supabase' } })
      }

      // Déplacer l'étape précédente vers l'ordre du current (swap)
      const { error: up1Error } = await supabase
        .from('workflow_etapes')
        .update({ ordre: ordre })
        .eq('id', etapePrecedente.id)

      if (up1Error) {
        return fail(500, { workflow: { error: up1Error.message ?? 'Erreur supabase' } })
      }

      // Finaliser : donner au courant l'ordre précédent
      const { error: up2Error } = await supabase
        .from('workflow_etapes')
        .update({ ordre: ordre - 1 })
        .eq('id', id)

      if (up2Error) {
        return fail(500, { workflow: { error: up2Error.message ?? 'Erreur supabase' } })
      }
      
      return { workflow: { success: true } }
    } catch {
      return fail(500, { workflow: { error: 'Erreur interne' } })
    }
  },

  descendreEtapeWorkflow: async ({ locals: { supabase, getUser }, request }) => {
    const user = await getUser()
    if (!user) return fail(401)

    const formData = await request.formData()
    const id = formData.get('id')?.toString()
    const ordre = parseInt(formData.get('ordre')?.toString() ?? '0')
    try {
      const { data: etapeSuivante, error: esError } = await supabase
        .from('workflow_etapes')
        .select('id, roles(name)')
        .eq('ordre', ordre + 1)
        .single()
      if (esError) {
        return fail(500, { workflow: { error: esError.message ?? 'Erreur supabase' } })
      }

      // Empêcher de descendre en dessous de la direction
      if (!etapeSuivante || etapeSuivante.roles?.name === 'direction') {
        return { workflow: { success: true } }
      }

      const { error: tmpError } = await supabase
        .from('workflow_etapes')
        .update({ ordre: -1 })
        .eq('id', id)
      if (tmpError) {
        return fail(500, { workflow: { error: tmpError.message ?? 'Erreur supabase' } })
      }

      // Déplacer l'étape suivante vers l'ordre courant (swap)
      const { error: up1Error } = await supabase
        .from('workflow_etapes')
        .update({ ordre })
        .eq('id', etapeSuivante.id)
      if (up1Error) {
        return fail(500, { workflow: { error: up1Error.message ?? 'Erreur supabase' } })
      }

      // Finaliser : donner à l'étape courante l'ordre suivant
      const { error: up2Error } = await supabase
        .from('workflow_etapes')
        .update({ ordre: ordre + 1 })
        .eq('id', id)
      if (up2Error) {
        return fail(500, { workflow: { error: up2Error.message ?? 'Erreur supabase' } })
      }
      
      return { workflow: { success: true } }
    } catch {
      return fail(500, { workflow: { error: 'Erreur interne' } })
    }
  }
}
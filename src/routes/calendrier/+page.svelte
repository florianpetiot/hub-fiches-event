<script lang="ts">
	import { formatDateSmart } from '$lib/date.js';

  let { data } = $props()

  // Mois affiché (piloté par le calendrier)
  let currentDate = $state(new Date())
  let currentYear = $derived(currentDate.getFullYear())
  let currentMonth = $derived(currentDate.getMonth())

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Navigation mois
  function prevMonth() {
    currentDate = new Date(currentYear, currentMonth - 1, 1)
  }
  function nextMonth() {
    currentDate = new Date(currentYear, currentMonth + 1, 1)
  }
  function goToToday() {
    currentDate = new Date()
    selectedDate = null
  }

  // Grille du mois (42 jours, commence le lundi)
  let days = $derived.by(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)

    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const result: { date: Date; currentMonth: boolean }[] = []

    // Jours du mois précédent
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i)
      result.push({ date: d, currentMonth: false })
    }

    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      result.push({ date: new Date(currentYear, currentMonth, i), currentMonth: true })
    }

    // Jours du mois suivant pour compléter 6 semaines
    const remaining = 42 - result.length
    for (let i = 1; i <= remaining; i++) {
      result.push({ date: new Date(currentYear, currentMonth + 1, i), currentMonth: false })
    }

    return result
  })

  let allForms = $derived([
    ...(data.myForms ?? []).map((f: any) => ({ ...f, isMine: true })),
    ...(data.otherForms ?? []).map((f: any) => ({ ...f, isMine: false }))
  ].sort((a, b) => a.event_date.localeCompare(b.event_date)))

  // Index des événements par date (optimisation)
  let eventsByDate = $derived.by(() => {
    const map = new Map<string, typeof allForms>()
    for (const f of allForms) {
      const key = f.event_date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(f)
    }
    return map
  })

  function eventsForDate(date: Date) {
    const dateStr = formatDateKey(date)
    return eventsByDate.get(dateStr) ?? []
  }

  // Vue active sur mobile : 'calendar' | 'list'
  let mobileView = $state<'calendar' | 'list'>('calendar')

  // Date sélectionnée (clic sur un jour du calendrier)
  let selectedDate = $state<string | null>(null)

  // Filtrage : si une date est sélectionnée => événements de ce jour,
  // sinon => tous les événements du mois affiché
  let filteredForms = $derived.by(() => {
    if (selectedDate) {
      return allForms.filter((f: any) => f.event_date === selectedDate)
    }
    // Montrer les événements du mois courant
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const nextM = currentMonth + 2 > 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`
    return allForms.filter((f: any) => f.event_date >= monthStart && f.event_date < nextM)
  })

  // Couleurs par statut
  const statusColor: Record<string, string> = {
    brouillon: 'bg-dark-blue-accent',
    soumise: 'bg-dark-yellow-accent',
    en_revision: 'bg-dark-orange-accent',
    validee: 'bg-dark-green-accent',
    refusee: 'bg-dark-red-accent',
  }

  const statusLabel: Record<string, string> = {
    brouillon: 'Brouillon',
    soumise: 'Soumise',
    en_revision: 'En révision',
    validee: 'Validée',
    refusee: 'Refusée',
  }

  const statusBadge: Record<string, string> = {
    brouillon: 'bg-dark-blue-bg text-dark-blue-accent border-dark-blue-accent',
    soumise: 'bg-dark-yellow-bg text-dark-yellow-accent border-dark-yellow-accent',
    en_revision: 'bg-dark-orange-bg text-dark-orange-accent border-dark-orange-accent',
    validee: 'bg-dark-green-bg text-dark-green-accent border-dark-green-accent',
    refusee: 'bg-dark-red-bg text-dark-red-accent border-dark-red-accent',
  }

  // Utilitaires pour travailler avec des dates locales (YYYY-MM-DD)
  function formatDateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const today = new Date()
  const todayStr = formatDateKey(today)

  // Nombre d'événements ce mois
  let monthEventCount = $derived(filteredForms.length)
</script>

<!-- Header sticky -->
<div class="sticky top-0 z-20 bg-dark-terciary/95 backdrop-blur-sm border-b border-dark-primary py-4 mb-4 md:mx-5 xl:mb-8">
  <div class="flex items-center justify-between max-w-350 mx-auto">
    <h1 class="text-2xl font-bold text-text-main">Calendrier</h1>
    <button type="button" onclick={goToToday}
      class="text-sm px-3 py-1.5 rounded-lg bg-dark-secondary border border-dark-primary text-text-muted hover:text-text-main active:text-text-main hover:border-text-main active:border-text-main transition-colors hover:cursor-pointer">
      Aujourd'hui
    </button>
  </div>
</div>

<!-- Sélecteur de vue (masqué en grand écran) -->
<div class="xl:hidden flex mt-3 mb-4 md:mx-5 rounded-xl overflow-hidden border border-dark-primary bg-dark-secondary">
  <button type="button"
    onclick={() => mobileView = 'calendar'}
    class="flex-1 py-2.5 text-sm font-medium transition-colors
      {mobileView === 'calendar' ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main active:text-text-main'}">
    📅 Calendrier
  </button>
  <button type="button"
    onclick={() => mobileView = 'list'}
    class="flex-1 py-2.5 text-sm font-medium transition-colors
      {mobileView === 'list' ? 'bg-dark-primary text-text-main' : 'text-text-muted hover:text-text-main active:text-text-main'}">
    ☰ Liste
  </button>
</div>

<div class="flex flex-col xl:flex-row gap-8 pb-8 max-w-350 md:mx-5 mx-auto mt-2">

  <!-- CALENDRIER MENSUEL (gauche) -->
  <div class="{mobileView === 'list' ? 'hidden xl:block' : ''} w-full xl:w-105 shrink-0">

    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-5 bg-dark-secondary rounded-xl px-4 py-3 border border-dark-primary">
      <button aria-label="previous-month" type="button" onclick={prevMonth}
        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-primary active:bg-dark-primary text-text-muted hover:text-text-main active:text-text-main transition-colors text-lg hover:cursor-pointer">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button class="text-text-main font-bold text-lg tracking-wide" onclick={() => selectedDate = null}>
        {monthNames[currentMonth]} {currentYear}
      </button>
      <button aria-label="next-month" type="button" onclick={nextMonth}
        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-primary active:bg-dark-primary text-text-muted hover:text-text-main active:text-text-main transition-colors text-lg hover:cursor-pointer">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Jours de la semaine -->
    <div class="grid grid-cols-7 mb-1">
      {#each dayNames as day}
        <div class="text-center text-xs font-semibold text-text-muted uppercase tracking-wider py-2">{day}</div>
      {/each}
    </div>

    <!-- Grille des jours -->
    <div class="grid grid-cols-7 gap-1">
      {#each days as { date, currentMonth: isCurrent }}
        {@const dateStr = formatDateKey(date)}
        {@const events = eventsForDate(date)}
        {@const isToday = dateStr === todayStr}
        {@const isSelected = dateStr === selectedDate}

        <button type="button"
          onclick={() => { selectedDate = selectedDate === dateStr ? null : dateStr; mobileView = 'list' }}
          class="relative flex flex-col items-center justify-start pt-2 pb-1.5 rounded-xl transition-all duration-150 h-14 hover:cursor-pointer
            {isSelected
              ? 'bg-accent-selection shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
              : isToday
                ? 'bg-dark-secondary ring-1 ring-blue-500/50'
                : isCurrent
                  ? 'hover:bg-dark-secondary/80 active:bg-dark-secondary/80'
                  : 'hover:bg-dark-secondary/40 active:bg-dark-secondary/40'}
            {!isCurrent ? 'opacity-70' : ''}">

          <span class="text-sm leading-none font-medium
            {isSelected ? 'text-white' : isToday ? 'text-blue-400 font-bold' : isCurrent ? 'text-text-main' : 'text-text-muted'}">
            {date.getDate()}
          </span>

          <!-- Points de couleur (événements du jour) -->
          <div class="flex gap-0.75 mt-1.5 items-center justify-center min-h-2">
            {#if events.length > 0}
              {#each events.slice(0, 4) as event}
                <span class="w-1.5 h-1.5 rounded-full {isSelected ? 'bg-white/70' : statusColor[event.status] ?? 'bg-gray-400'}"
                  title="{event.title}"></span>
              {/each}
              {#if events.length > 4}
                <span class="text-[9px] leading-none {isSelected ? 'text-white/70' : 'text-text-muted'}">+{events.length - 4}</span>
              {/if}
            {/if}
          </div>
        </button>
      {/each}
    </div>

    <!-- Légende -->
    <div class="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-dark-primary pt-4">
      {#each Object.entries(statusLabel) as [status, label]}
        {#if !(status === 'brouillon' && !data.isClub)}
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full {statusColor[status]}"></span>
            <span class="text-xs text-text-muted">{label}</span>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  <!-- LISTE DES ÉVÉNEMENTS (droite) -->
  <div class="{mobileView === 'calendar' ? 'hidden xl:block' : ''} flex-1 min-w-0">

    <!-- Header liste -->
    <div class="flex items-center justify-between mb-4 bg-dark-secondary rounded-xl px-4 py-3 border border-dark-primary">
      <div class="flex-1 min-w-0">
        <h3 class="text-text-main font-bold text-base">
          {#if selectedDate}
            Événements du {formatDateSmart(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
          {:else}
            {monthNames[currentMonth]} {currentYear}
          {/if}
        </h3>
        <p class="text-text-muted text-xs mt-0.5">
          {monthEventCount} événement{monthEventCount !== 1 ? 's' : ''}
          {#if selectedDate}
            — <button type="button" onclick={() => selectedDate = null}
              class="text-blue-link hover:text-blue-link/80 active:text-blue-link/80 transition-colors hover:cursor-pointer">voir tout le mois</button>
          {/if}
        </p>
      </div>
      <!-- Boutons navigation mois (mobile uniquement) -->
      <div class="xl:hidden ml-3 shrink-0 flex gap-2">
        <button aria-label="previous" type="button" onclick={() => {
          if (selectedDate !== null) {
        const [y, m, d] = selectedDate.split('-').map(Number)
        const prev = new Date(y, m - 1, d - 1)
        selectedDate = formatDateKey(prev)
          } else {
        prevMonth()
          }
        }}
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-terciary border border-dark-primary text-text-muted hover:text-text-main active:text-text-main transition-colors">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button aria-label="next" type="button" onclick={() => {
          if (selectedDate !== null) {
        const [y, m, d] = selectedDate.split('-').map(Number)
        const next = new Date(y, m - 1, d + 1)
        selectedDate = formatDateKey(next)
          } else {
        nextMonth()
          }
        }}
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-terciary border border-dark-primary text-text-muted hover:text-text-main active:text-text-main transition-colors text-lg">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Liste scrollable -->
    <div class="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
      {#if filteredForms.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="text-4xl mb-3 opacity-30">📅</div>
          <p class="text-text-muted text-sm">Aucun événement {selectedDate ? 'ce jour' : 'ce mois'}.</p>
        </div>
      {/if}

      {#each filteredForms as form}
        <!-- cliquable : mes fiches ou staff -->
        {#if form.isMine || !data.isClub}
        <a href="/fiche-event/{form.id}/resume"
          class="group flex items-center gap-4 bg-dark-secondary rounded-xl px-4 py-3.5 border border-dark-primary hover:border-blue-400 active:border-blue-400 transition-all duration-150 hover:bg-dark-secondary/80 active:bg-dark-secondary/80">

          <!-- Date badge compact -->
          <div class="shrink-0 w-12 h-12 rounded-lg bg-dark-terciary border border-dark-primary flex flex-col items-center justify-center">
            <span class="text-text-main text-sm font-bold leading-tight">{formatDateSmart(form.event_date, { day: 'numeric' })}</span>
            <span class="text-text-muted text-[10px] uppercase leading-tight">{formatDateSmart(form.event_date, { month: 'short' })}</span>
          </div>

          <!-- Infos événement -->
          <div class="flex-1 min-w-0">
            <p class="text-text-main font-medium truncate group-hover:text-blue-400 group-active:text-blue-400 transition-colors">{form.title}</p>
            <p class="text-text-muted text-xs mt-0.5">{form.profiles?.name ?? '—'}</p>
          </div>

          <!-- Badge statut -->
          <span class="shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium {statusBadge[form.status]}">
            {statusLabel[form.status]}
          </span>
        </a>
        {:else}
        <!-- non cliquable : fiche des autres clubs -->
        <div class="flex items-center gap-4 bg-dark-secondary rounded-xl px-4 py-3.5 border border-dark-primary">
          <div class="shrink-0 w-12 h-12 rounded-lg bg-dark-terciary border border-dark-primary flex flex-col items-center justify-center">
            <span class="text-text-main text-sm font-bold leading-tight">{formatDateSmart(form.event_date, { day: 'numeric' })}</span>
            <span class="text-text-muted text-[10px] uppercase leading-tight">{formatDateSmart(form.event_date, { month: 'short' })}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-text-main font-medium truncate">{form.title}</p>
            <p class="text-text-muted text-xs mt-0.5">{form.profiles?.name ?? '—'}</p>
          </div>
          <span class="shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium {statusBadge[form.status]}">
            {statusLabel[form.status]}
          </span>
        </div>
        {/if}
      {/each}
    </div>
  </div>

</div>
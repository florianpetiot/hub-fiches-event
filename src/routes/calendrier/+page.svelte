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

  // Index des événements par date (optimisation)
  let eventsByDate = $derived.by(() => {
    const map = new Map<string, typeof data.forms>()
    for (const f of data.forms) {
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
      return data.forms.filter((f: any) => f.event_date === selectedDate)
    }
    // Montrer les événements du mois courant
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
    const nextM = currentMonth + 2 > 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}-01`
    return data.forms.filter((f: any) => f.event_date >= monthStart && f.event_date < nextM)
  })

  // Couleurs par statut
  const statusColor: Record<string, string> = {
    brouillon: 'bg-dark-primary',
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
    brouillon: 'bg-dark-primary/20 text-gray-300 border-dark-primary',
    soumise: 'bg-dark-yellow-accent/20 text-yellow-300 border-dark-yellow-accent',
    en_revision: 'bg-dark-orange-accent/20 text-orange-300 border-dark-orange-accent',
    validee: 'bg-dark-green-accent/20 text-green-300 border-dark-green-accent',
    refusee: 'bg-dark-red-accent/20 text-red-300 border-dark-red-accent',
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
<div class="sticky top-0 z-20 bg-dark-terciary/95 backdrop-blur-sm border-b border-dark-primary py-4 px-6 mb-4 xl:mb-8">
  <div class="flex items-center justify-between max-w-350 mx-auto">
    <h1 class="text-2xl font-bold text-white">Calendrier</h1>
    <button type="button" onclick={goToToday}
      class="text-sm px-3 py-1.5 rounded-lg bg-dark-secondary border border-dark-primary text-gray-300 hover:text-white active:text-white hover:border-gray-500 active:border-gray-500 transition-colors">
      Aujourd'hui
    </button>
  </div>
</div>

<!-- Sélecteur de vue (masqué en grand écran) -->
<div class="xl:hidden flex mx-6 mt-3 mb-4 rounded-xl overflow-hidden border border-dark-primary bg-dark-secondary">
  <button type="button"
    onclick={() => mobileView = 'calendar'}
    class="flex-1 py-2.5 text-sm font-medium transition-colors
      {mobileView === 'calendar' ? 'bg-dark-primary text-white' : 'text-gray-400 hover:text-white active:text-white'}">
    📅 Calendrier
  </button>
  <button type="button"
    onclick={() => mobileView = 'list'}
    class="flex-1 py-2.5 text-sm font-medium transition-colors
      {mobileView === 'list' ? 'bg-dark-primary text-white' : 'text-gray-400 hover:text-white active:text-white'}">
    ☰ Liste
  </button>
</div>

<div class="flex flex-col xl:flex-row gap-8 px-6 pb-8 max-w-350 mx-auto mt-2">

  <!-- CALENDRIER MENSUEL (gauche) -->
  <div class="{mobileView === 'list' ? 'hidden xl:block' : ''} w-full xl:w-105 shrink-0">

    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-5 bg-dark-secondary rounded-xl px-4 py-3 border border-dark-primary">
      <button aria-label="previous-month" type="button" onclick={prevMonth}
        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-primary active:bg-dark-primary text-gray-400 hover:text-white active:text-white transition-colors text-lg">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button class="text-white font-bold text-lg tracking-wide" onclick={() => selectedDate = null}>
        {monthNames[currentMonth]} {currentYear}
      </button>
      <button aria-label="next-month" type="button" onclick={nextMonth}
        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-dark-primary active:bg-dark-primary text-gray-400 hover:text-white active:text-white transition-colors text-lg">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Jours de la semaine -->
    <div class="grid grid-cols-7 mb-1">
      {#each dayNames as day}
        <div class="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">{day}</div>
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
          class="relative flex flex-col items-center justify-start pt-2 pb-1.5 rounded-xl transition-all duration-150 h-14
            {isSelected
              ? 'bg-blue-600 shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
              : isToday
                ? 'bg-dark-secondary ring-1 ring-blue-500/50'
                : isCurrent
                  ? 'hover:bg-dark-secondary/80 active:bg-dark-secondary/80'
                  : 'hover:bg-dark-secondary/40 active:bg-dark-secondary/40'}
            {!isCurrent ? 'opacity-70' : ''}">

          <span class="text-sm leading-none font-medium
            {isSelected ? 'text-white' : isToday ? 'text-blue-400 font-bold' : isCurrent ? 'text-gray-200' : 'text-gray-500'}">
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
                <span class="text-[9px] leading-none {isSelected ? 'text-white/70' : 'text-gray-400'}">+{events.length - 4}</span>
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
            <span class="text-xs text-gray-400">{label}</span>
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
        <h3 class="text-white font-bold text-base">
          {#if selectedDate}
            Événements du {formatDateSmart(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
          {:else}
            {monthNames[currentMonth]} {currentYear}
          {/if}
        </h3>
        <p class="text-gray-500 text-xs mt-0.5">
          {monthEventCount} événement{monthEventCount !== 1 ? 's' : ''}
          {#if selectedDate}
            — <button type="button" onclick={() => selectedDate = null}
              class="text-blue-400 hover:text-blue-300 active:text-blue-300 transition-colors">voir tout le mois</button>
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
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-terciary border border-dark-primary text-gray-400 hover:text-white active:text-white transition-colors">
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
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-terciary border border-dark-primary text-gray-400 hover:text-white active:text-white transition-colors text-lg">
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
          <p class="text-gray-500 text-sm">Aucun événement {selectedDate ? 'ce jour' : 'ce mois'}.</p>
        </div>
      {/if}

      {#each filteredForms as form}
        <a href="/fiche-event/{form.id}/resume"
          class="group flex items-center gap-4 bg-dark-secondary rounded-xl px-4 py-3.5 border border-dark-primary hover:border-gray-600 active:border-gray-600 transition-all duration-150 hover:bg-dark-secondary/80 active:bg-dark-secondary/80">

          <!-- Date badge compact -->
          <div class="shrink-0 w-12 h-12 rounded-lg bg-dark-terciary border border-dark-primary flex flex-col items-center justify-center">
            <span class="text-white text-sm font-bold leading-tight">{formatDateSmart(form.event_date, { day: 'numeric' })}</span>
            <span class="text-gray-500 text-[10px] uppercase leading-tight">{formatDateSmart(form.event_date, { month: 'short' })}</span>
          </div>

          <!-- Infos événement -->
          <div class="flex-1 min-w-0">
            <p class="text-white font-medium truncate group-hover:text-blue-300 group-active:text-blue-300 transition-colors">{form.title}</p>
            <p class="text-gray-500 text-xs mt-0.5">{form.profiles?.name ?? '—'}</p>
          </div>

          <!-- Badge statut -->
          <span class="shrink-0 text-[11px] px-2.5 py-1 rounded-lg border font-medium {statusBadge[form.status]}">
            {statusLabel[form.status]}
          </span>

          <!-- Indicateur couleur latéral -->
          <div class="shrink-0 w-1 h-8 rounded-full {statusColor[form.status] ?? 'bg-gray-500'}"></div>
        </a>
      {/each}
    </div>
  </div>

</div>
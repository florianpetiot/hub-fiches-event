// Store réactif Svelte 5 pour le titre et la date de l'événement
function createEventDetails() {
  let title = $state('');
  let eventDate = $state('');

  return {
    get title() { return title; },
    set title(v: string) { title = v; },
    get eventDate() { return eventDate; },
    set eventDate(v: string) { eventDate = v; },
  };
}

export const eventDetails = createEventDetails();

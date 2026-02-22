import { writable } from 'svelte/store';

// Store pour le titre et la date de l'événement
export const eventDetails = writable({
  title: '',
  eventDate: ''
});
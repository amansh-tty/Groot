// Optional explicit preview contract. Runs only in the isolated browser preview.
import controls from './controls.json';
export default {
  controls,
  screens: [
    {
      id: 'patient',
      label: 'Patient search',
    },
    {
      id: 'slots',
      label: 'Available slots',
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
    },
  ],
  states: [
    {
      id: 'default',
      label: 'Default',
    },
    {
      id: 'urgent',
      label: 'Urgent',
    },
    {
      id: 'no-provider-available',
      label: 'No Provider Available',
    },
    {
      id: 'loading',
      label: 'Loading',
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
    },
    {
      id: 'error',
      label: 'Error',
    },
  ],
  viewport: 'desktop',
};

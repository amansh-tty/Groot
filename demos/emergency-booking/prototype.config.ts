// Optional explicit preview contract. Runs only in the isolated browser preview.
export default {
  screens: [
    {
      id: 'patient',
      label: 'Patient search',
    },
    {
      id: 'urgency',
      label: 'Urgency details',
    },
    {
      id: 'type',
      label: 'Appointment type',
    },
    {
      id: 'provider',
      label: 'Provider',
    },
    {
      id: 'slots',
      label: 'Available slots',
    },
    {
      id: 'operatory',
      label: 'Operatory',
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

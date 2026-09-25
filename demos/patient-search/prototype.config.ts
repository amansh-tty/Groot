// Optional explicit preview contract. Runs only in the isolated browser preview.
export default {
  screens: [
    {
      id: 'search',
      label: 'Patient search',
    },
  ],
  states: [
    {
      id: 'default',
      label: 'Default',
    },
    {
      id: 'searching',
      label: 'Searching',
    },
    {
      id: 'results',
      label: 'Results',
    },
    {
      id: 'no-results',
      label: 'No Results',
    },
    {
      id: 'error',
      label: 'Error',
    },
  ],
  viewport: 'mobile',
};

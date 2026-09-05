export const notify = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('app-notification', { detail: { message, type } }));
};

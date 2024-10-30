export function getQRState(
  start: string,
  end: string,
  enabled: boolean
): { checked: boolean; disabled: boolean; preStart: boolean } {
  let state = { checked: enabled, disabled: false, preStart: false };
  let now = new Date();
  let startDate = new Date(start);
  let endDate = new Date(end);
  if (now > endDate && end != null) {
    state.checked = false;
    state.disabled = true;
  }
  if (now < startDate && start != null) {
    state.disabled = true;
    state.preStart = true;
  }
  return state;
}

export function qrClasses(state: {
  checked: boolean;
  disabled: boolean;
  preStart: boolean;
}) {
  const { checked, disabled, preStart } = state;
  let bgClass = "dark:bg-neutral-700 bg-gray-200";
  if (preStart || (!disabled && !checked)) {
    bgClass =
      "pattern-diagonal-lines pattern-transparent pattern-bg-gray-200 dark:pattern-bg-neutral-700 pattern-size-16 pattern-opacity-100";
  } else if (disabled) {
    bgClass = "bg-red-100 opacity-100 dark:bg-red-400/50";
  }
  return `${bgClass} drop-shadow-lg p-4 rounded mb-4`;
}

export function capitalizeFirstLetter(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
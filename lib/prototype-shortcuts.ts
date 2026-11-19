export function isTextInputTarget(target: EventTarget | null): boolean {
  return target instanceof Element
    && Boolean(target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']"));
}

export function canUsePrototypeShortcut(event: KeyboardEvent): boolean {
  return !event.defaultPrevented && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey
    && !isTextInputTarget(event.target);
}

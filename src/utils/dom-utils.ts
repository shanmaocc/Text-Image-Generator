/**
 * DOM utility helpers for the Text-Image-Generator extension
 */

const EXTENSION_ROOT_ID = 'text-image-generator-extension-container';

/**
 * Get the extension's root container element
 * @returns jQuery element for the extension root
 */
export function getExtensionRoot(): JQuery<HTMLElement> {
    return $(`#${EXTENSION_ROOT_ID}`);
}

/**
 * Find an element within the extension's root container
 * @param selector jQuery selector
 * @returns jQuery element
 */
export function findInRoot(selector: string): JQuery<HTMLElement> {
    return getExtensionRoot().find(selector);
}

/**
 * Bind an event handler within the extension's root (delegated)
 * @param event Event name (e.g., 'click', 'change')
 * @param selector Target selector
 * @param handler Event handler function
 */
export function onInRoot(
    event: string,
    selector: string,
    handler: (this: HTMLElement, event: JQuery.TriggeredEvent) => void
): void {
    getExtensionRoot().on(event, selector, handler);
}

export function scrollIntoView(element: HTMLElement|null) {
  if (element) {
    setTimeout(() => element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    }), 50);
  }
}
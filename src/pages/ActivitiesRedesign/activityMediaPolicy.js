export function shouldAutoplayActivityMedia({
  isMobile = false,
  isVisible = false,
  reduceMotion = false
} = {}) {
  return Boolean(isMobile && isVisible && !reduceMotion);
}

export const onRequest = async (ctx: any) => {
  // Desactivamos el reto de Basic Auth para evitar el prompt nativo del navegador
  // y delegamos la validación a la UX de la página (overlay + /verify).
  // Si deseas reactivar Basic Auth en el futuro, restaura la lógica previa.
  return ctx.next();
};

// Comparación tiempo-constante (XOR) para strings
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}



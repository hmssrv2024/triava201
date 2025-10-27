export async function calculatorTool(args) {
  const { expression } = args || {};
  if (!expression || !/^[\d\s+\-*/().]+$/.test(expression)) {
    return { error: "Expresi\u00f3n inv\u00e1lida" };
  }
  try {
    // Eval\u00faa la expresi\u00f3n de forma segura usando Function
    // En entornos reales considera usar una librer\u00eda de matem\u00e1ticas dedicada
    const result = Function("\"use strict\"; return (" + expression + ");")();
    if (Number.isFinite(result)) return { result };
    return { error: "No se pudo calcular" };
  } catch {
    return { error: "Error al calcular" };
  }
}

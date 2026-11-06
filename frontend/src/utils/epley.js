// Fórmula de Epley para estimar la fuerza máxima (1RM) a partir de peso y repeticiones
export function estimate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export const MUSCLES = ["Pecho", "Espalda", "Pierna", "Hombro", "Bicep", "Tricep"];
export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

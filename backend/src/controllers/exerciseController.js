// Integración con la API externa de ejercicios (wger.de - catálogo público)
// Documentación: https://wger.de/en/software/api

// Mapeo de músculo (en español, como lo usa la rutina) a un término de
// búsqueda en inglés, porque el catálogo público de wger indexa mejor en ese idioma.
const MUSCLE_SEARCH_TERM = {
  Pecho: "bench press",
  Espalda: "row",
  Pierna: "squat",
  Hombro: "shoulder press",
  Bicep: "curl",
  Tricep: "triceps",
};

// Catálogo local de respaldo, usado si la API externa no responde
const FALLBACK_SUGGESTIONS = {
  Pecho: ["Press de banca", "Press inclinado con mancuerna", "Aperturas en polea", "Fondos en paralelas"],
  Espalda: ["Remo con barra", "Jalón al pecho", "Remo en polea baja", "Peso muerto"],
  Pierna: ["Sentadilla", "Prensa de piernas", "Zancadas", "Curl femoral"],
  Hombro: ["Press militar", "Elevaciones laterales", "Pájaros", "Press Arnold"],
  Bicep: ["Curl con barra", "Curl martillo", "Curl concentrado"],
  Tricep: ["Extensión en polea", "Press francés", "Fondos de tríceps"],
};

async function suggestions(req, res) {
  const muscle = String(req.query.muscle || "").trim();

  const term = MUSCLE_SEARCH_TERM[muscle] || muscle;

  try {
    const url = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(term)}&language=en&format=json`;
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });

    if (!response.ok) throw new Error(`wger respondió ${response.status}`);

    const data = await response.json();
    const names = (data.suggestions || [])
      .map((s) => s.data?.name || s.value)
      .filter(Boolean)
      .slice(0, 8);

    if (names.length === 0) throw new Error("Sin resultados de la API externa");

    return res.json({ source: "wger.de", muscle, suggestions: names });
  } catch (err) {
    console.warn(`[wger] API externa no disponible (${err.message}); usando catálogo local.`);
    // Si la API externa falla o no hay resultados, se responde con el catálogo local
    return res.json({
      source: "local-fallback",
      muscle,
      suggestions: FALLBACK_SUGGESTIONS[muscle] || [],
      note: "La API externa no respondió; se muestran sugerencias locales.",
    });
  }
}

module.exports = { suggestions };

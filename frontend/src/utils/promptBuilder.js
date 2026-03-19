const genreMap = {
  "Action":            "action game",
  "RPG":               "role-playing game",
  "Stratégie":         "strategy game",
  "Simulation":        "simulation game",
  "Horreur":           "horror game",
  "Aventure":          "adventure game",
  "Platformer":        "platformer game",
  "Puzzle":            "puzzle game",
  "Sports & Course":   "sports and racing game",
  "Visual Novel":      "visual novel",
};

const universMap = {
  "Fantaisie":          "fantasy world",
  "Science-fiction":    "science fiction universe",
  "Contemporain":       "contemporary modern setting",
  "Post-apocalyptique": "post-apocalyptic wasteland",
  "Historique":         "historical setting",
  "Cyberpunk":          "cyberpunk city",
  "Horreur Gothique":   "gothic horror atmosphere",
  "Monde Enfantin":     "colorful whimsical children world",
};

const perspectiveMap = {
  "Vue du dessus":             "top-down view",
  "Défilement latéral (2D)":   "side-scrolling 2D",
  "Première personne (FPS)":   "first-person perspective",
  "Troisième personne":        "third-person perspective",
  "Isométrique":               "isometric perspective",
  "Point & click":             "point and click",
};

const styleMap = {
  "Pixel art rétro":   "retro pixel art, 16-bit aesthetic",
  "Cartoon coloré":    "colorful cartoon style",
  "Sombre & réaliste": "dark realistic style, photorealistic",
  "Aquarelle":         "watercolor illustration style",
  "Low poly 3D":       "low poly 3D art",
  "Minimaliste":       "minimalist flat design",
};

const modeMap = {
  "Solo":                        "single hero character prominently featured, lone protagonist",
  "Coopératif multijoueur":      "two heroes side by side, cooperative duo, companions",
  "Compétitif multijoueur":      "multiple rival characters facing each other, competitive clash, crowd of fighters",
  "Solo avec éléments en ligne": "lone protagonist with faint silhouettes of other players in the background",
};

const mechaniqueMap = {
  "Combat":                 "dynamic combat scene, weapons drawn, action pose, explosive energy",
  "Exploration":            "vast open landscape stretching to the horizon, sense of discovery and scale",
  "Gestion":                "aerial overview of a bustling city or complex system, organized chaos",
  "Narratif":               "emotional close-up of characters, cinematic storytelling, dramatic expressions",
  "Construction":           "grand architectural structure being built, scaffolding, blueprints, creation",
  "Infiltration":           "shadowy figure in stealth, dark environment, single ray of light, tension",
  "Résolution d'énigmes":   "intricate glowing puzzle mechanisms, mysterious symbols, mental challenge",
  "Craft & Collection":     "rich inventory of items and materials spread out, abundance, crafting table",
};

const dureeMap = {
  "Court (< 5h)":                               "clean simple composition, focused single scene",
  "Moyen (5–20h)":                              "balanced composition, moderate detail",
  "Long (20–50h)":                              "rich detailed composition, layered environment",
  "Très long (50h+)":                           "epic sprawling composition, incredibly detailed world, monumental scale",
  "Rejouabilité infinie (roguelike / sandbox)": "endless procedural world, infinite depth, recursive patterns",
};

const plateformeMap = {
  "PC":        "widescreen PC game cover format",
  "Console":   "console game box art format, bold typography space",
  "Mobile":    "vertical portrait format, bold simple shapes optimized for small screen",
  "Navigateur":"flat web graphic style, browser game aesthetic",
};

export function buildImagePrompt({ genres, tags, description, iconicElement, game_name }) {
  const allTags = tags || [];

  const stylePart       = allTags.map(t => styleMap[t]).filter(Boolean).join(", ");
  const perspectivePart = allTags.map(t => perspectiveMap[t]).filter(Boolean).join(", ");
  const modePart        = allTags.map(t => modeMap[t]).filter(Boolean).join(", ");
  const mechaniquePart  = allTags.map(t => mechaniqueMap[t]).filter(Boolean).join(", ");
  const universPart     = allTags.map(t => universMap[t]).filter(Boolean).join(", ");
  const genrePart       = (genres || []).map(g => genreMap[g] || g).join(", ");
  const dureePart       = allTags.map(t => dureeMap[t]).filter(Boolean).join(", ");
  const plateformePart  = allTags.map(t => plateformeMap[t]).filter(Boolean).join(", ");

  const descriptionPart   = description && description.trim()   ? `concept du jeu : ${description.trim()}`     : null;
  const iconicElementPart = iconicElement && iconicElement.trim() ? `élément iconique : ${iconicElement.trim()}` : null;

  const gameNamePart = game_name && game_name.trim()
    ? `titre du jeu "${game_name.trim()}" écrit en grande police stylisée bien visible sur la couverture`
    : null;

  const parts = [
    "illustration de couverture officielle de jeu vidéo, packaging professionnel, format portrait, espace titre en haut",
    stylePart,
    perspectivePart,
    modePart,
    mechaniquePart,
    universPart,
    genrePart,
    dureePart,
    plateformePart,
    descriptionPart,
    iconicElementPart,
    gameNamePart,
    "éclairage dramatique, composition cinématographique, très détaillé, illustration professionnelle, sans logo",
  ].filter(Boolean);

  return parts.join(", ");
}

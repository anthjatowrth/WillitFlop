const genreMap = {
  'Action / Combat':       'action combat game, weapons drawn, explosive energy',
  'Exploration / Aventure':'exploration adventure game, vast open landscape',
  'Stratégie / Gestion':   'strategy and management game, aerial overview, organized complexity',
  'RPG':                   'role-playing game, epic hero journey',
  'Plateforme / Puzzle':   'platformer puzzle game, jumping across levels, intricate mechanisms',
  'Simulation':            'simulation game, detailed systems, management UI',
  'Horreur / Thriller':    'horror thriller game, dark tension, shadowy atmosphere',
  'Narratif / Visual Novel':'narrative visual novel, cinematic characters, emotional story',
}

const universeMap = {
  'Dark / Mature':          'dark mature atmosphere, gritty shadows',
  'Cozy / Wholesome':       'cozy wholesome warm atmosphere, soft light',
  'Sci-fi / Futuristic':    'science fiction futuristic setting, neon lights, space technology',
  'Fantasy / Medieval':     'fantasy medieval world, magic, castles, ancient forests',
  'Cyberpunk / Steampunk':  'cyberpunk steampunk city, industrial gears, neon rain',
  'Post-Apocalyptique':     'post-apocalyptic wasteland, ruins, desolation',
  'Humour / Parodie':       'humorous parody tone, colorful exaggerated characters',
  'Horreur / Psychologique':'psychological horror atmosphere, surreal distorted reality',
  'Historique':             'historical setting, period-accurate details, ancient architecture',
  'Anime / Coloré':         'anime colorful vibrant style, bold outlines, expressive characters',
}

const mechanicsMap = {
  'Roguelike / Roguelite':  'procedurally generated dungeon, rogue-like permadeath, infinite depth',
  'Open World':             'vast open world sprawling landscape, sense of freedom and scale',
  'Story Rich / Narratif':  'cinematic storytelling, rich narrative, emotional dramatic close-up',
  'Craft / Survie':         'crafting survival, building gathering resources, wilderness',
  'Tour par tour':          'turn-based strategy, tactical grid, thoughtful decisions',
  'Action rapide':          'fast-paced action, dynamic combat scene, action pose',
  'Puzzle / Logique':       'intricate glowing puzzle mechanisms, mysterious symbols, mental challenge',
  'Deckbuilding':           'card game deckbuilding, cards spread out, strategic hand',
  'Souls-like':             'dark challenging souls-like combat, imposing boss, oppressive atmosphere',
  'Sandbox':                'sandbox freedom, endless creative world, player-built structures',
  'Tower Defense':          'tower defense strategic map, defensive formations',
  'Metroidvania':           'metroidvania interconnected world, hidden passages, power-ups',
}

const visualStyleMap = {
  'Pixel Art / Rétro':      'retro pixel art, 16-bit aesthetic, pixelated sprites',
  'Cell Shading / Cartoon': 'cel-shaded cartoon style, bold outlines, vibrant colors',
  '3D Réaliste':            'photorealistic 3D, detailed textures, high fidelity rendering',
  'Low Poly 3D':            'low poly 3D art, geometric shapes, clean polygons',
  'Aquarelle / Illustré':   'watercolor illustration style, painted textures, artistic brushwork',
  'Minimaliste / Flat':     'minimalist flat design, clean shapes, simple color palette',
}

const perspectiveMap = {
  'Première personne (FPS)': 'first-person perspective, immersive POV, hands visible in foreground',
  'Troisième personne (TPS)': 'third-person perspective, character fully visible from behind',
  'Vue isométrique':          'isometric perspective, diagonal overhead view, grid-based world',
  'Défilement latéral (2D)':  'side-scrolling 2D, horizontal platformer view',
  'Vue du dessus':            "top-down bird's eye view, overhead perspective",
  'Point & Click':            'point and click adventure, richly detailed illustrated background',
}

const categoriesMap = {
  'Solo uniquement':  'lone protagonist single player, solitary hero',
  'Co-op local':      'local cooperative duo, friends playing together side by side',
  'Co-op en ligne':   'online cooperative multiplayer team, allies united',
  'PvP compétitif':   'competitive PvP rival players facing each other, tournament clash',
  'Workshop / Mods':  'modding community, user-created content, creative workshop',
}

/**
 * Construit un prompt Pollinations/Flux depuis les réponses brutes du formulaire.
 *
 * @param {object} params
 * @param {string}   params.genre       - genre principal (clé du formulaire)
 * @param {string[]} params.universe    - ambiances sélectionnées
 * @param {string[]} params.mechanics   - mécaniques sélectionnées
 * @param {string[]} params.categories  - modes de jeu sélectionnés
 * @param {string}   params.description - description libre du jeu
 * @param {string}   params.game_name   - nom du jeu (optionnel)
 */
export function buildImagePrompt({ genre, universe, mechanics, visualStyle, perspective, categories, description, game_name }) {
  const genrePart        = genreMap[genre] || genre || null
  const universePart     = (universe || []).map(u => universeMap[u] || u).filter(Boolean).join(', ') || null
  const mechanicsPart    = (mechanics || []).slice(0, 3).map(m => mechanicsMap[m] || m).filter(Boolean).join(', ') || null
  const visualStylePart  = visualStyleMap[visualStyle] || null
  const perspectivePart  = perspectiveMap[perspective] || null
  const categoriesPart   = (categories || []).map(c => categoriesMap[c] || c).filter(Boolean).join(', ') || null

  const descriptionPart = description && description.trim()
    ? `concept du jeu : ${description.trim()}`
    : null

  const gameNamePart = game_name && game_name.trim()
    ? `titre du jeu "${game_name.trim()}" écrit en grande police stylisée bien visible sur la couverture`
    : null

  const parts = [
    'illustration de couverture officielle de jeu vidéo, packaging professionnel, format portrait, espace titre en haut',
    genrePart,
    universePart,
    visualStylePart,
    perspectivePart,
    mechanicsPart,
    categoriesPart,
    descriptionPart,
    gameNamePart,
    'éclairage dramatique, composition cinématographique, très détaillé, illustration professionnelle, sans logo',
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * URLs publiques des assets stockés dans Supabase Storage (bucket "game-assets").
 * Centralise tous les chemins d'images pour éviter les imports locaux.
 */

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const BUCKET = 'game-assets'

const url = (filename) =>
  `${BASE}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`

export const ASSETS = {
  // Genres
  action:        url('action.webp'),
  aventure:      url('aventure.webp'),
  strategy:      url('strategy.webp'),
  rpg:           url('rpg.webp'),
  platformer:    url('platformer.webp'),
  simulation:    url('simulation.webp'),
  horreur:       url('horreur.webp'),
  narratif:      url('narratif.webp'),

  // Ambiance
  dark:          url('dark.webp'),
  cozy:          url('cozy.webp'),
  scifi:         url('scifi.webp'),
  fantasy:       url('fantasy.webp'),
  cyberpunk:     url('cyberpunk.webp'),
  postapo:       url('postapo.webp'),
  humour:        url('humour.webp'),
  horreurpsy:    url('horreurpsy.webp'),
  historique:    url('historique.webp'),
  anime:         url('anime.webp'),

  // Caméra / perspective
  fps:           url('fps.webp'),
  thirdPerson:   url('third-person.webp'),
  isometric:     url('isometric.webp'),
  defilement:    url('defilementlateral.webp'),
  topDown:       url('top_vuedessus.webp'),
  pointClick:    url('pointnclick.webp'),

  // Style visuel
  pixelArt:      url('pixelart.webp'),
  cellShading:   url('cellshading.webp'),
  realistic3D:   url('3Drealistic.webp'),
  lowPoly:       url('lowpoly.webp'),
  aquarelle:     url('aquarelle.webp'),
  minimalist:    url('minimalistflat.webp'),

  // Mécaniques
  roguelike:     url('Roguelike.webp'),
  openWorld:     url('open_world.webp'),
  storyRich:     url('story_rich.webp'),
  craftSurvie:   url('Craft_survie.webp'),
  tourParTour:   url('tour_par_tour.webp'),
  actionRapide:  url('Action_rapide.webp'),
  puzzle:        url('puzzle.webp'),
  deckbuilding:  url('Deckbuilding.webp'),
  soulsLike:     url('Souls-like.webp'),
  sandbox:       url('Sandbox.webp'),
  towerDefense:  url('tower_defense.webp'),
  metroidvania:  url('metroidvania.webp'),

  // Catégories multijoueur
  soloGamer:     url('sologamer.webp'),
  coopLocal:     url('coop local.webp'),
  pveOnline:     url('pve online.webp'),
  pvpOnline:     url('pvp online.webp'),
  modGame:       url('modgame.webp'),

  // DevSlider
  garageDev:     url('garagedev.webp'),
  indiestudio:   url('indiestudio.webp'),
  AAstudio:      url('AAstudio.webp'),
  polishedGem:   url('polishedgem.webp'),

  // Divers
  loading:       url('loading.gif'),
}

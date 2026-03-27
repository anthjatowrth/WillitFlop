/**
 * Script d'upload des assets vers Supabase Storage
 *
 * Prérequis :
 *   1. Créer un bucket PUBLIC "game-assets" dans le dashboard Supabase
 *      (Storage → New bucket → "game-assets" → cocher "Public")
 *   2. Récupérer la Service Role Key depuis Settings → API dans Supabase
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=<ta_clé> node frontend/scripts/upload-assets.mjs
 *
 *   Ou avec la anon key (si RLS le permet) :
 *   node frontend/scripts/upload-assets.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Lecture du .env frontend
const envPath = join(__dirname, '../.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.substring(0, idx).trim(), line.substring(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
// Préférer la Service Role Key pour les uploads, sinon fallback sur anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
const BUCKET = 'game-assets'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erreur : VITE_SUPABASE_URL ou SUPABASE_KEY manquant.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const MIME_TYPES = {
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
}

const assetsDir = join(__dirname, '../src/assets')
const files = readdirSync(assetsDir).filter(f => MIME_TYPES[extname(f).toLowerCase()])

console.log(`\nUpload de ${files.length} fichiers vers le bucket "${BUCKET}"...\n`)

let success = 0
let errors = 0

for (const file of files) {
  const buffer = readFileSync(join(assetsDir, file))
  const contentType = MIME_TYPES[extname(file).toLowerCase()]

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(file, buffer, { upsert: true, contentType })

  if (error) {
    console.error(`✗ ${file} — ${error.message}`)
    errors++
  } else {
    console.log(`✓ ${file}`)
    success++
  }
}

console.log(`\nTerminé : ${success} uploadés, ${errors} erreurs.`)
if (errors > 0) {
  console.log('\nSi tu as des erreurs de permission, utilise la Service Role Key :')
  console.log('  SUPABASE_SERVICE_ROLE_KEY=<ta_clé> node frontend/scripts/upload-assets.mjs')
}

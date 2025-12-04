#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import { parse } from 'csv-parse/sync'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const argMap = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.replace('--', '').split('=')
    acc[key] = value ?? true
  }
  return acc
}, {})

const csvPath = argMap.file
  ? path.resolve(process.cwd(), argMap.file)
  : path.resolve(__dirname, '../data/restaurants_template.csv')

const credentialsPath =
  argMap.credentials ||
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  path.resolve(__dirname, '../serviceAccount.json')

if (!fs.existsSync(csvPath)) {
  console.error(`[bulk-crud] CSV 파일을 찾을 수 없습니다: ${csvPath}`)
  process.exit(1)
}

if (!fs.existsSync(credentialsPath)) {
  console.error(
    `[bulk-crud] Firebase 서비스 계정 JSON을 찾을 수 없습니다: ${credentialsPath}. --credentials=경로 또는 FIREBASE_SERVICE_ACCOUNT 환경변수를 설정해주세요.`,
  )
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})
const db = admin.firestore()

const csvText = fs.readFileSync(csvPath, 'utf8')
const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true })

const numericFields = new Set([
  'deliveryFee',
  'minOrderPrice',
  'deliveryRangeKm',
  'latitude',
  'longitude',
])
const listFields = new Set(['tags', 'services', 'sideImages', 'categories'])

const slugify = (input) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const toList = (value) => {
  if (!value) return undefined
  return value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
}

const loadMenuSections = (row, baseDir) => {
  if (row.menu_sections_json) {
    try {
      return JSON.parse(row.menu_sections_json)
    } catch (err) {
      throw new Error(`menu_sections_json 파싱 실패: ${err.message}`)
    }
  }
  if (row.menu_sections_file) {
    const filePath = path.resolve(baseDir, row.menu_sections_file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`menu_sections_file을 찾을 수 없습니다: ${filePath}`)
    }
    const fileText = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(fileText)
  }
  return undefined
}

const deleteMenuSections = async (docRef) => {
  const snap = await docRef.collection('menus').get()
  const batch = db.batch()
  snap.forEach((doc) => batch.delete(doc.ref))
  if (!snap.empty) {
    await batch.commit()
  }
}

const writeMenuSections = async (docRef, sections = []) => {
  if (!sections.length) return
  await deleteMenuSections(docRef)
  const batch = db.batch()
  sections.forEach((section, index) => {
    const sectionRef = docRef.collection('menus').doc(section.id || `section-${index + 1}`)
    const payload = {
      title: section.title ?? `섹션 ${index + 1}`,
      order: typeof section.order === 'number' ? section.order : index + 1,
      items: Array.isArray(section.items) ? section.items : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    batch.set(sectionRef, payload, { merge: true })
  })
  await batch.commit()
}

const applyRow = async (row, baseDir, dryRun = false) => {
  if (!row.name) {
    console.warn('[SKIP] name 컬럼이 비어 있습니다.')
    return
  }

  const action = (row.action || 'upsert').toLowerCase()
  const docId = row.id?.trim() || slugify(row.name)
  const docRef = db.collection('restaurants').doc(docId)

  if (action === 'delete') {
    console.log(`[DELETE] restaurants/${docId}`)
    if (!dryRun) {
      await deleteMenuSections(docRef)
      await docRef.delete()
    }
    return
  }

  const menuSections = row.menu_sections_json || row.menu_sections_file ? loadMenuSections(row, baseDir) : undefined

  const payload = {}
  for (const [key, rawValue] of Object.entries(row)) {
    if (['action', 'id', 'menu_sections_json', 'menu_sections_file'].includes(key)) continue
    if (rawValue === undefined || rawValue === null || rawValue === '') continue

    if (numericFields.has(key)) {
      const num = toNumber(rawValue)
      if (num !== undefined) payload[key] = num
      continue
    }

    if (listFields.has(key)) {
      const list = toList(rawValue)
      if (list) payload[key] = list
      continue
    }

    if (key.endsWith('_json')) {
      try {
        payload[key.replace(/_json$/, '')] = JSON.parse(rawValue)
      } catch (err) {
        console.warn(`[WARN] ${key} JSON 파싱 실패: ${err.message}`)
      }
      continue
    }

    payload[key] = rawValue
  }

  console.log(`[${action.toUpperCase()}] restaurants/${docId}`)
  if (dryRun) return

  if (action === 'create') {
    await docRef.create(payload)
  } else {
    await docRef.set(payload, { merge: true })
  }

  if (menuSections?.length) {
    await writeMenuSections(docRef, menuSections)
  }
}

const dryRun = Boolean(argMap['dry-run'])

const baseDir = path.dirname(csvPath)

const run = async () => {
  for (const row of records) {
    try {
      await applyRow(row, baseDir, dryRun)
    } catch (err) {
      console.error(`[ERROR] ${row.name ?? '(이름 없음)'} - ${err.message}`)
    }
  }
  if (dryRun) {
    console.log('--- DRY RUN: Firestore에는 적용되지 않았습니다. ---')
  } else {
    console.log('--- 완료되었습니다. ---')
  }
  process.exit(0)
}

run()

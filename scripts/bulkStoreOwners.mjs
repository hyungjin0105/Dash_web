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
  : path.resolve(__dirname, '../data/store_owner_template.csv')

const credentialsPath =
  argMap.credentials ||
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  path.resolve(__dirname, '../serviceAccount.json')

if (!fs.existsSync(csvPath)) {
  console.error(`[store-owner-crud] CSV 파일을 찾을 수 없습니다: ${csvPath}`)
  process.exit(1)
}

if (!fs.existsSync(credentialsPath)) {
  console.error(
    `[store-owner-crud] Firebase 서비스 계정 JSON을 찾을 수 없습니다: ${credentialsPath}. --credentials=경로 또는 FIREBASE_SERVICE_ACCOUNT 환경변수를 설정해주세요.`,
  )
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const csvText = fs.readFileSync(csvPath, 'utf8')
const records = parse(csvText, { columns: true, skip_empty_lines: true, trim: true })

const toList = (value) => {
  if (!value) return []
  return value
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
}

const applyRow = async (row, dryRun = false) => {
  const ownerId = row.ownerId?.trim()
  if (!ownerId) {
    console.warn('[SKIP] ownerId 컬럼이 비어 있습니다.')
    return
  }
  const action = (row.action || 'upsert').toLowerCase()
  const docRef = db.collection('storeOwners').doc(ownerId)

  if (action === 'delete') {
    console.log(`[DELETE] storeOwners/${ownerId}`)
    if (!dryRun) {
      await docRef.delete()
    }
    return
  }

  const payload = {
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    role: row.role ?? 'Store Owner',
    onboardingStatus: row.onboardingStatus ?? 'pending',
    activeStoreId: row.activeStoreId ?? '',
    stores: toList(row.stores),
    notes: row.notes ?? '',
    createdAt: row.createdAt ?? new Date().toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  console.log(`[${action.toUpperCase()}] storeOwners/${ownerId}`)
  if (dryRun) return

  if (action === 'create') {
    await docRef.create(payload)
  } else {
    await docRef.set(payload, { merge: true })
  }
}

const dryRun = Boolean(argMap['dry-run'])

const run = async () => {
  for (const row of records) {
    try {
      await applyRow(row, dryRun)
    } catch (err) {
      console.error(`[ERROR] ${row.ownerId ?? '(ownerId 없음)'} - ${err.message}`)
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

#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const categoriesFile = path.resolve(__dirname, '../src/data/categories.ts')
const credentialsPath =
  process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT || path.resolve(__dirname, '../serviceAccount.json')

if (!fs.existsSync(credentialsPath)) {
  console.error('서비스 계정 JSON을 찾을 수 없습니다.')
  process.exit(1)
}

const fileText = fs.readFileSync(categoriesFile, 'utf8')
const match = fileText.match(/\[(.*?)\]/s)
if (!match) {
  console.error('카테고리 목록을 파싱할 수 없습니다.')
  process.exit(1)
}
const raw = match[1]
const options = raw
  .split(',')
  .map((item) => item.replace(/['"\s]/g, ''))
  .filter(Boolean)

const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

await db.collection('metadata').doc('categories').set({ options, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
console.log('카테고리 목록을 metadata/categories 에 동기화했습니다.')
process.exit(0)

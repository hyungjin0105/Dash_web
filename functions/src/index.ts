import * as functions from 'firebase-functions'
import fetch from 'node-fetch'

const NAVER_ID = process.env.NAVER_MAP_CLIENT_ID
const NAVER_SECRET = process.env.NAVER_MAP_CLIENT_SECRET
const NAVER_SEARCH_ID = process.env.NAVER_SEARCH_CLIENT_ID
const NAVER_SEARCH_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET

const assertCreds = () => {
  if (!NAVER_ID || !NAVER_SECRET) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      '네이버 자격 정보가 설정되지 않았습니다. functions:config:set NAVER_MAP_CLIENT_ID=... NAVER_MAP_CLIENT_SECRET=... 로 설정하세요.',
    )
  }
}

const forward = async (url: string) => {
  assertCreds()
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': NAVER_ID!,
      'X-NCP-APIGW-API-KEY': NAVER_SECRET!,
    },
  })
  if (!res.ok) {
    throw new functions.https.HttpsError('unknown', `Naver API 호출 실패: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

const forwardSearch = async (url: string) => {
  if (!NAVER_SEARCH_ID || !NAVER_SEARCH_SECRET) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      '검색 API 자격 정보가 설정되지 않았습니다. functions:config:set NAVER_SEARCH_CLIENT_ID=... NAVER_SEARCH_CLIENT_SECRET=... 으로 설정하세요.',
    )
  }
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_SEARCH_ID!,
      'X-Naver-Client-Secret': NAVER_SEARCH_SECRET!,
    },
  })
  if (!res.ok) {
    throw new functions.https.HttpsError('unknown', `Naver Search API 호출 실패: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const naverProxy = functions.https.onRequest(async (req, res) => {
  try {
    const path = req.path.replace('/api/naver', '')

    if (path === '/geocode') {
      const query = req.query.query as string
      if (!query) {
        res.status(400).send({ error: 'query 파라미터가 필요합니다.' })
        return
      }
      const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
        query,
      )}`
      const data = await forward(url)
      res.set('Access-Control-Allow-Origin', '*')
      res.send(data)
      return
    }

    if (path === '/reverse-geocode') {
      const coords = req.query.coords as string
      if (!coords) {
        res.status(400).send({ error: 'coords 파라미터가 필요합니다.' })
        return
      }
      const url = `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${coords}&orders=addr,legalcode&output=json`
      const data = await forward(url)
      res.set('Access-Control-Allow-Origin', '*')
      res.send(data)
      return
    }

    if (path === '/directions') {
      const start = req.query.start as string
      const goal = req.query.goal as string
      const option = (req.query.option as string) ?? 'trafast'
      if (!start || !goal) {
        res.status(400).send({ error: 'start, goal 파라미터가 필요합니다.' })
        return
      }
      const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&option=${option}`
      const data = await forward(url)
      res.set('Access-Control-Allow-Origin', '*')
      res.send(data)
      return
    }

    if (path === '/search/local') {
      const query = req.query.query as string
      const display = (req.query.display as string) ?? '5'
      if (!query) {
        res.status(400).send({ error: 'query 파라미터가 필요합니다.' })
        return
      }
      const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query,
      )}&display=${display}`
      const data = await forwardSearch(url)
      res.set('Access-Control-Allow-Origin', '*')
      res.send(data)
      return
    }

    res.status(404).send({ error: '알 수 없는 경로' })
  } catch (err) {
    functions.logger.error(err)
    res.status(500).send({ error: 'Naver 프록시 호출 실패' })
  }
})

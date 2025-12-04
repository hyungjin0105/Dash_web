import { naverMapClientSecret, naverMapKeyId } from '../config/naver'

const proxyBase = import.meta.env.VITE_NAVER_PROXY_BASE ?? '/api/naver'
const hasDirectCreds = Boolean(naverMapKeyId && naverMapClientSecret)

const buildProxyUrl = (path: string, params: Record<string, string>) => {
  const url = new URL(path, window.location.origin)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  // Replace origin with proxy base if provided
  const base = proxyBase.startsWith('http') ? proxyBase : `${proxyBase}`
  const pathPart = url.pathname + url.search
  return `${base}${pathPart}`
}

const directHeaders: HeadersInit = {
  'X-NCP-APIGW-API-KEY-ID': naverMapKeyId,
  'X-NCP-APIGW-API-KEY': naverMapClientSecret,
}

const parseResponse = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `네이버 API 호출 실패 (${response.status}): ${
        text ? text.slice(0, 200) : response.statusText
      }`,
    )
  }
  return response.json()
}

const maybeProxyFetch = async (path: string, params: Record<string, string>) => {
  const proxyUrl = buildProxyUrl(path, params)
  const response = await fetch(proxyUrl)
  return parseResponse(response)
}

const directFetch = async (url: URL) => {
  if (!hasDirectCreds) {
    throw new Error('네이버 API 자격 정보가 없습니다.')
  }
  const response = await fetch(url.toString(), { headers: directHeaders })
  return parseResponse(response)
}

const preferProxy = async (path: string, params: Record<string, string>, directUrl: URL) => {
  // Try proxy first
  try {
    return await maybeProxyFetch(path, params)
  } catch (err) {
    console.warn('[Naver] Proxy 호출 실패, 직접 호출 시도', err)
    if (!hasDirectCreds) {
      throw err
    }
    return directFetch(directUrl)
  }
}

export const geocodeAddress = async (query: string) => {
  const directUrl = new URL('https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode')
  directUrl.searchParams.set('query', query)
  return preferProxy('/geocode', { query }, directUrl)
}

export const reverseGeocode = async (lat: number, lng: number) => {
  const directUrl = new URL('https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc')
  directUrl.searchParams.set('coords', `${lng},${lat}`)
  directUrl.searchParams.set('orders', 'addr,legalcode')
  directUrl.searchParams.set('output', 'json')
  return preferProxy('/reverse-geocode', { coords: `${lng},${lat}` }, directUrl)
}

export interface DirectionSummary {
  distanceMeters: number
  durationSeconds: number
  tollFare: number
}

export const fetchDrivingDirections = async (params: {
  start: { lat: number; lng: number }
  goal: { lat: number; lng: number }
  option?: 'trafast' | 'tracomfort' | 'traoptimal'
}) => {
  const { start, goal, option = 'trafast' } = params
  const directUrl = new URL('https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving')
  directUrl.searchParams.set('start', `${start.lng},${start.lat}`)
  directUrl.searchParams.set('goal', `${goal.lng},${goal.lat}`)
  directUrl.searchParams.set('option', option)

  const data = await preferProxy(
    '/directions',
    {
      start: `${start.lng},${start.lat}`,
      goal: `${goal.lng},${goal.lat}`,
      option,
    },
    directUrl,
  )

  const summary = data?.route?.[option]?.[0]?.summary
  if (!summary) {
    throw new Error('경로 요약 정보를 찾을 수 없습니다.')
  }

  const result: DirectionSummary = {
    distanceMeters: summary.distance ?? 0,
    durationSeconds: summary.duration ?? 0,
    tollFare: summary.tollFare ?? 0,
  }

  return result
}

export const searchPlaces = async (query: string, limit = 5) => {
  return maybeProxyFetch('/search/local', { query, display: String(limit) })
}

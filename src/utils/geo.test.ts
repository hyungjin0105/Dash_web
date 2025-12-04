import { describe, expect, it } from 'vitest'
import { haversineDistanceKm } from './geo'

describe('haversineDistanceKm', () => {
  it('returns ~0 for identical coordinates', () => {
    expect(haversineDistanceKm(37.0, 127.0, 37.0, 127.0)).toBeCloseTo(0, 5)
  })

  it('returns reasonable distance between Seoul and Busan', () => {
    const seoul = { lat: 37.5665, lng: 126.978 }
    const busan = { lat: 35.1796, lng: 129.0756 }
    const distance = haversineDistanceKm(seoul.lat, seoul.lng, busan.lat, busan.lng)
    expect(distance).toBeGreaterThan(320)
    expect(distance).toBeLessThan(450)
  })
})

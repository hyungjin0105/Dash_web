import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { FormEvent } from 'react'
import { createRestaurant, updateRestaurant } from '../../services/restaurants'
import { geocodeAddress, searchPlaces } from '../../services/naver'
import type { RestaurantFormValues } from '../../types/restaurants'
import { ImageUploadField } from './ImageUploadField'
import { LocationPicker } from './LocationPicker'
import { CATEGORY_OPTIONS } from '../../data/categories'

const initialValues: RestaurantFormValues = {
  name: '',
  tags: '',
  categories: '',
  primaryCategory: '',
  heroImage: '',
  sideImages: '',
  logoImage: '',
  services: '',
  area: '',
  deliveryEta: '',
  deliveryFee: '',
  minOrderPrice: '',
  deliveryRangeKm: '',
  address: '',
  latitude: '',
  longitude: '',
  operatingHours: '',
  discountInfo: '',
  phoneNumber: '',
  highlight: '',
  notices: '',
}

export const RestaurantForm = ({
  editTarget,
  onComplete,
}: {
  editTarget: import('../../types/restaurants').RestaurantRecord | null
  onComplete: () => void
}) => {
  const [values, setValues] = useState<RestaurantFormValues>(initialValues)
  const [message, setMessage] = useState<string | null>(null)
  const [lookupMessage, setLookupMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: string; lng: string }>>(
    [],
  )
  const [placeResults, setPlaceResults] = useState<
    Array<{ title: string; address: string; roadAddress?: string }>
  >([])
  const queryClient = useQueryClient()
  const selectedCategories = values.categories
    ? values.categories.split('|').map((item) => item.trim()).filter(Boolean)
    : []

  const handleCategoryToggle = (category: string) => {
    setValues((prev) => {
      const current = prev.categories
        ? prev.categories.split('|').map((item) => item.trim()).filter(Boolean)
        : []
      const exists = current.includes(category)
      const next = exists ? current.filter((item) => item !== category) : [...current, category]
      return {
        ...prev,
        categories: next.join('|'),
        primaryCategory: prev.primaryCategory || (next[0] ?? ''),
      }
    })
  }

  useEffect(() => {
    if (editTarget) {
      setEditingId(editTarget.id ?? null)
      setValues({
        name: editTarget.name ?? '',
        tags: (editTarget.tags ?? []).join(', '),
        categories: (editTarget.categories ?? []).join('|'),
        primaryCategory: editTarget.primaryCategory ?? '',
        heroImage: editTarget.heroImage ?? '',
        sideImages: Array.isArray(editTarget.sideImages) ? editTarget.sideImages.join(', ') : '',
        logoImage: editTarget.logoImage ?? '',
        services: (editTarget.services ?? []).join(', '),
        area: editTarget.area ?? '',
        deliveryEta: editTarget.deliveryEta ?? '',
        deliveryFee: String(editTarget.deliveryFee ?? ''),
        minOrderPrice: String(editTarget.minOrderPrice ?? ''),
        deliveryRangeKm: String(editTarget.deliveryRangeKm ?? ''),
        address: editTarget.address ?? '',
        latitude: editTarget.latitude ? String(editTarget.latitude) : '',
        longitude: editTarget.longitude ? String(editTarget.longitude) : '',
        operatingHours: editTarget.operatingHours ?? '',
        discountInfo: editTarget.discountInfo ?? '',
        phoneNumber: editTarget.phoneNumber ?? '',
        highlight: editTarget.highlight ?? '',
        notices: '',
      })
    } else {
      setEditingId(null)
      setValues(initialValues)
    }
  }, [editTarget])

  const handleLocationChange = (lat: number, lng: number) => {
    setValues((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }))
  }

  const handleAddressLookup = async (customQuery?: string) => {
    setLookupMessage(null)
    const targetQuery = customQuery ?? values.address
    if (!targetQuery) {
      setLookupMessage('주소를 먼저 입력해주세요.')
      return
    }
    try {
      const result = await geocodeAddress(targetQuery)
      const addresses: Array<any> = result?.addresses ?? []
      if (addresses.length === 0) {
        setLookupMessage('주소를 찾지 못했습니다. 상세 주소를 입력해주세요.')
        return
      }
      const first = addresses[0]
      const lat = parseFloat(first.y)
      const lng = parseFloat(first.x)
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setLookupMessage('좌표를 계산하지 못했습니다.')
        return
      }
      setSuggestions(
        addresses.slice(0, 5).map((addr) => ({
          label: addr.roadAddress || addr.jibunAddress || addr.address || '',
          lat: addr.y,
          lng: addr.x,
        })),
      )
      setValues((prev) => ({
        ...prev,
        address: first.roadAddress || first.jibunAddress || targetQuery,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }))
      setLookupMessage('지도를 해당 위치로 이동했습니다.')
    } catch (error) {
      setLookupMessage(error instanceof Error ? error.message : '주소 검색 중 오류가 발생했습니다.')
    }
  }

  const handleCombinedSearch = async () => {
    const query = values.address.trim()
    if (!query) {
      setLookupMessage('검색할 상호명이나 주소를 입력해주세요.')
      return
    }
    const hasPlaces = await handlePlaceSearch(query)
    if (!hasPlaces) {
      if (!/\d/.test(query)) {
        setLookupMessage('주소 형식이 아니어서 좌표 변환을 건너뜁니다. 검색 결과를 선택해주세요.')
        return
      }
      await handleAddressLookup(query)
    }
  }

  const mutation = useMutation({
    mutationFn: async (payload: RestaurantFormValues) => {
      if (editingId) {
        await updateRestaurant(editingId, payload)
      } else {
        await createRestaurant(payload)
      }
    },
    onSuccess: () => {
      setMessage(editingId ? '매장 정보가 업데이트되었습니다.' : '매장 정보가 저장되었습니다.')
      setValues(initialValues)
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['restaurants'] })
      onComplete()
    },
    onError: () => {
      setMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    },
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    mutation.mutate(values)
  }

  const stripHtml = (input: string) => input.replace(/<[^>]+>/g, '')

  const handlePlaceSearch = async (customQuery?: string) => {
    setLookupMessage(null)
    setPlaceResults([])
    const query = (customQuery ?? values.address).trim()
    if (!query) {
      setLookupMessage('검색할 상호명이나 주소를 입력해주세요.')
      return false
    }
    try {
      const result = await searchPlaces(query)
      const items: Array<any> = result?.items ?? []
      if (items.length === 0) {
        setLookupMessage('검색 결과가 없습니다.')
        return false
      }
      setPlaceResults(
        items.slice(0, 5).map((item) => ({
          title: stripHtml(item.title ?? ''),
          address: item.address ?? '',
          roadAddress: item.roadAddress ?? '',
        })),
      )
      setLookupMessage('검색 결과를 확인하고 선택해주세요.')
      return true
    } catch (error) {
      setLookupMessage(
        error instanceof Error ? error.message : '장소 검색 중 오류가 발생했습니다.',
      )
      return false
    }
  }

  const handlePlaceSelect = async (place: {
    title: string
    address: string
    roadAddress?: string
  }) => {
    const nextAddress = place.roadAddress || place.address || place.title
    setValues((prev) => ({ ...prev, address: nextAddress }))
    await handleAddressLookup(nextAddress)
    setPlaceResults([])
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <h3>매장 등록</h3>
        <p className="helper">필수 정보부터 차근차근 입력하면 자동으로 저장됩니다.</p>
      </div>

      <fieldset className="form-section">
        <legend>1. 기본 정보</legend>
        <div className="form__grid">
          <label>
            상호명
            <input
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="예: 실로 김밥"
              required
            />
          </label>
          <label>
            지역/상권
            <input
              name="area"
              value={values.area}
              onChange={handleChange}
              placeholder="예: 서울시 강남구"
            />
          </label>
          <label>
            연락처
            <input
              name="phoneNumber"
              value={values.phoneNumber}
              onChange={handleChange}
              placeholder="010-0000-0000"
            />
          </label>
          <label>
            태그 (쉼표 구분)
            <input
              name="tags"
              value={values.tags}
              onChange={handleChange}
              placeholder="한식, 포장 가능"
            />
          </label>
          <label className="form__grid--full">
            카테고리 (여러 개 선택 가능)
            <div className="category-picker">
              {CATEGORY_OPTIONS.map((category) => {
                const isActive = selectedCategories.includes(category)
                return (
                  <button
                    type="button"
                    key={category}
                    className={clsx('category-pill', isActive && 'category-pill--active')}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
          </label>
          <label>
            대표 카테고리
            <select
              name="primaryCategory"
              value={values.primaryCategory}
              onChange={handleChange}
            >
              <option value="">선택하세요</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <p className="helper">상단 배지로 노출될 기본 카테고리를 선택하세요.</p>
          </label>
          <label>
            제공 서비스 (쉼표 구분)
            <input
              name="services"
              value={values.services}
              onChange={handleChange}
              placeholder="delivery, visit"
            />
          </label>
          <label>
            배달 예상 시간
            <input
              name="deliveryEta"
              value={values.deliveryEta}
              onChange={handleChange}
              placeholder="35~45분"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>2. 배달 조건</legend>
        <div className="form__grid">
          <label>
            최소 주문 금액
            <input
              name="minOrderPrice"
              value={values.minOrderPrice}
              onChange={handleChange}
              type="number"
              min="0"
            />
          </label>
          <label>
            배달비
            <input
              name="deliveryFee"
              value={values.deliveryFee}
              onChange={handleChange}
              type="number"
              min="0"
            />
          </label>
          <label>
            배달 가능 거리(km)
            <input
              name="deliveryRangeKm"
              value={values.deliveryRangeKm}
              onChange={handleChange}
              type="number"
              min="0"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>3. 위치 정보</legend>
        <div className="form__grid">
          <label>
            주소
            <input
              name="address"
              value={values.address}
              onChange={handleChange}
              placeholder="예: 서울 강남구 테헤란로 123"
            />
            <button type="button" className="button-ghost" onClick={handleCombinedSearch}>
              주소/매장 검색하기
            </button>
          </label>
          <label>
            위도
            <input
              name="latitude"
              value={values.latitude}
              onChange={handleChange}
              placeholder="위도를 지도에서 선택하거나 직접 입력"
            />
          </label>
          <label>
            경도
            <input
              name="longitude"
              value={values.longitude}
              onChange={handleChange}
              placeholder="경도를 지도에서 선택하거나 직접 입력"
            />
          </label>
        </div>
        {lookupMessage && <p className="helper">{lookupMessage}</p>}
        {placeResults.length > 0 && (
          <div className="place-results">
            <header>
              <div>
                <p className="eyebrow">검색 결과</p>
                <h4>총 {placeResults.length}건의 매장을 찾았습니다</h4>
              </div>
              <p className="helper">원하는 매장을 선택하면 주소와 좌표가 자동으로 입력됩니다.</p>
            </header>
            <ul className="place-results__list">
              {placeResults.map((place) => (
                <li key={`${place.title}-${place.address}`} className="place-results__item">
                  <div>
                    <strong>{place.title || '이름 없음'}</strong>
                    <p className="muted">{place.roadAddress || place.address}</p>
                  </div>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => handlePlaceSelect(place)}
                  >
                    선택
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="pill-list">
            {suggestions.map((s) => (
              <button
                key={`${s.label}-${s.lat}`}
                type="button"
                className="button-ghost"
                onClick={() => {
                  setValues((prev) => ({
                    ...prev,
                    address: s.label,
                    latitude: parseFloat(s.lat).toFixed(6),
                    longitude: parseFloat(s.lng).toFixed(6),
                  }))
                  setLookupMessage(`"${s.label}" 로 이동했습니다.`)
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        <LocationPicker
          latitude={values.latitude}
          longitude={values.longitude}
          onChange={handleLocationChange}
        />
      </fieldset>

      <fieldset className="form-section">
        <legend>4. 이미지 링크</legend>
        <p className="helper">사진 URL을 붙여넣거나 아래 ‘파일 선택’ 버튼으로 업로드하세요.</p>
        <div className="form__grid">
          <ImageUploadField
            label="대표 이미지 URL"
            value={values.heroImage}
            onChange={(url) => setValues((prev) => ({ ...prev, heroImage: url }))}
            folder="restaurants/hero"
          />
          <label>
            사이드 이미지 URL (쉼표 구분)
            <input
              name="sideImages"
              value={values.sideImages}
              onChange={handleChange}
              placeholder="https://... , https://..."
            />
            <p className="helper">2장 이상이면 , 로 구분해주세요.</p>
          </label>
          <ImageUploadField
            label="로고 이미지 URL"
            value={values.logoImage}
            onChange={(url) => setValues((prev) => ({ ...prev, logoImage: url }))}
            folder="restaurants/logo"
          />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>5. 운영 안내</legend>
        <div className="form__grid">
          <label>
            영업 시간
            <textarea
              name="operatingHours"
              value={values.operatingHours}
              onChange={handleChange}
              rows={2}
              placeholder="예: 매일 10:00 ~ 22:00"
            />
          </label>
          <label>
            할인 정보
            <textarea
              name="discountInfo"
              value={values.discountInfo}
              onChange={handleChange}
              rows={2}
              placeholder="예: 첫 주문 2,000원 할인"
            />
          </label>
          <label>
            하이라이트
            <textarea
              name="highlight"
              value={values.highlight}
              onChange={handleChange}
              rows={2}
              placeholder="대표 메뉴나 특장점을 적어주세요"
            />
          </label>
          <label>
            공지 (쉼표 구분)
            <textarea
              name="notices"
              value={values.notices}
              onChange={handleChange}
              rows={2}
              placeholder="점심시간 할인, 명절 휴무 등"
            />
          </label>
        </div>
      </fieldset>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '저장 중…' : '매장 저장'}
      </button>
      {message && <p className="form__message">{message}</p>}
    </form>
  )
}

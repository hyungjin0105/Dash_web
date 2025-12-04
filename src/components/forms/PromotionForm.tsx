import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPromotion } from '../../services/promotions'
import type { PromotionFormValues, PromotionKind, DiscountKind } from '../../types/promotions'
import { useStoreContext } from '../../providers/StoreProvider'

const promotionKinds: PromotionKind[] = ['쿠폰', '이벤트', '배너']
const discountKinds: { label: string; value: DiscountKind }[] = [
  { label: '금액 할인', value: 'amount' },
  { label: '비율 할인', value: 'percent' },
]
const channelOptions = ['앱 홈', '푸시', '쿠폰함', '리뷰 요청']
const serviceOptions = [
  { label: '배달', value: '배달' },
  { label: '방문', value: '방문' },
]

const initialValues: PromotionFormValues = {
  storeId: '',
  storeName: '',
  title: '',
  description: '',
  promotionKind: '쿠폰',
  discountKind: 'amount',
  discountValue: '0',
  startDate: '',
  endDate: '',
  channels: [],
  targetSegment: '',
  couponCode: '',
  minOrderPrice: '',
  maxRedemptions: '',
  serviceModes: ['배달'],
}

const createInitialState = (storeId: string, storeName: string): PromotionFormValues => ({
  ...initialValues,
  storeId,
  storeName,
})

export const PromotionForm = () => {
  const { stores, selectedStoreId } = useStoreContext()
  const storeOptions = useMemo(() => stores.filter((store) => store.id !== 'all'), [stores])
  const defaultStoreId =
    selectedStoreId !== 'all'
      ? selectedStoreId
      : storeOptions.length > 0
        ? storeOptions[0].id
        : ''
  const getStoreName = (id: string) => storeOptions.find((store) => store.id === id)?.name ?? ''
  const [values, setValues] = useState<PromotionFormValues>(
    createInitialState(defaultStoreId, getStoreName(defaultStoreId)),
  )
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const isCoupon = values.promotionKind === '쿠폰'
  const hasStore = storeOptions.length > 0

  useEffect(() => {
    if (!values.storeId && storeOptions.length > 0) {
      const fallback = storeOptions[0]
      setValues((prev) => ({ ...prev, storeId: fallback.id, storeName: fallback.name }))
    }
  }, [storeOptions, values.storeId])

  useEffect(() => {
    if (selectedStoreId === 'all' || !selectedStoreId) return
    setValues((prev) => ({
      ...prev,
      storeId: selectedStoreId,
      storeName: getStoreName(selectedStoreId),
    }))
  }, [selectedStoreId])

  const resetForm = (storeId: string) => {
    setValues(createInitialState(storeId, getStoreName(storeId)))
  }

  const mutation = useMutation({
    mutationFn: createPromotion,
    onSuccess: (_, variables) => {
      setMessage('프로모션이 저장되었습니다.')
      resetForm(variables.storeId)
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
    },
    onError: (error: unknown) => {
      console.error(error)
      setMessage('저장 중 오류가 발생했습니다.')
    },
  })

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    if (name === 'storeId') {
      setValues((prev) => ({
        ...prev,
        storeId: value,
        storeName: getStoreName(value),
      }))
    } else {
      setValues((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleServiceToggle = (mode: string) => {
    setValues((prev) => {
      const exists = prev.serviceModes.includes(mode)
      return {
        ...prev,
        serviceModes: exists
          ? prev.serviceModes.filter((item) => item !== mode)
          : [...prev.serviceModes, mode],
      }
    })
  }

  const handleChannelToggle = (channel: string) => {
    setValues((prev) => {
      const exists = prev.channels.includes(channel)
      return {
        ...prev,
        channels: exists
          ? prev.channels.filter((item) => item !== channel)
          : [...prev.channels, channel],
      }
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values.storeId) {
      setMessage('어떤 매장에 적용할지 선택해주세요.')
      return
    }
    if (isCoupon && values.serviceModes.length === 0) {
      setMessage('쿠폰이 적용될 서비스를 최소 1개 이상 선택하세요.')
      return
    }
    mutation.mutate(values)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <h3>새 프로모션 만들기</h3>
        <p className="helper">쿠폰, 배너, 이벤트를 한 곳에서 관리하세요. (매장별로 저장됩니다)</p>
      </div>
      {!hasStore && (
        <p className="state__error">
          매장이 연결되어 있지 않습니다. 스토어 오너 프로필에 매장을 추가한 후 다시 시도해주세요.
        </p>
      )}
      <div className="form__grid">
        <label>
          적용 매장
          <select name="storeId" value={values.storeId} onChange={handleChange} disabled={!hasStore}>
            <option value="">매장을 선택하세요</option>
            {storeOptions.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          제목
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            placeholder="예: 주말 단골 쿠폰"
            required
          />
        </label>
        <label>
          유형
          <select name="promotionKind" value={values.promotionKind} onChange={handleChange}>
            {promotionKinds.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>
        <label>
          할인 방식
          <select name="discountKind" value={values.discountKind} onChange={handleChange}>
            {discountKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          할인 값
          <input
            type="number"
            min="0"
            name="discountValue"
            value={values.discountValue}
            onChange={handleChange}
            placeholder="5000"
          />
        </label>
        <label>
          시작일
          <input type="date" name="startDate" value={values.startDate} onChange={handleChange} />
        </label>
        <label>
          종료일
          <input type="date" name="endDate" value={values.endDate} onChange={handleChange} />
        </label>
        <label className="full-width">
          대상 고객 메모
          <input
            name="targetSegment"
            value={values.targetSegment}
            onChange={handleChange}
            placeholder="예: 최근 30일 이내 주문 고객"
          />
        </label>
        <label className="full-width">
          설명
          <textarea
            name="description"
            rows={3}
            value={values.description}
            onChange={handleChange}
            placeholder="프로모션 상세 안내를 입력하세요."
          />
        </label>
      </div>
      <fieldset className="form-section">
        <legend>노출 채널</legend>
        <div className="channel-options">
          {channelOptions.map((channel) => (
            <label key={channel} className="checkbox">
              <input
                type="checkbox"
                checked={values.channels.includes(channel)}
                onChange={() => handleChannelToggle(channel)}
              />
              {channel}
            </label>
          ))}
        </div>
      </fieldset>
      {isCoupon && (
        <fieldset className="form-section">
          <legend>쿠폰 설정</legend>
          <div className="form__grid">
            <label>
              쿠폰 코드
              <input
                name="couponCode"
                value={values.couponCode}
                onChange={handleChange}
                placeholder="예: SILO10 (비워두면 자동 적용)"
              />
            </label>
            <label>
              최소 주문 금액
              <input
                type="number"
                min="0"
                name="minOrderPrice"
                value={values.minOrderPrice}
                onChange={handleChange}
                placeholder="15000"
              />
            </label>
            <label>
              최대 발급 수
              <input
                type="number"
                min="0"
                name="maxRedemptions"
                value={values.maxRedemptions}
                onChange={handleChange}
                placeholder="예: 100 (비워두면 제한 없음)"
              />
            </label>
          </div>
          <div className="channel-options">
            {serviceOptions.map((service) => (
              <label key={service.value} className="checkbox">
                <input
                  type="checkbox"
                  checked={values.serviceModes.includes(service.value)}
                  onChange={() => handleServiceToggle(service.value)}
                />
                {service.label}
              </label>
            ))}
          </div>
          <p className="helper">✓ 선택한 서비스(배달·방문)에 맞춰 앱에서 노출됩니다.</p>
        </fieldset>
      )}
      <button type="submit" disabled={mutation.isPending || !hasStore}>
        {mutation.isPending ? '저장 중…' : '프로모션 저장'}
      </button>
      {message && <p className="form__message">{message}</p>}
    </form>
  )
}

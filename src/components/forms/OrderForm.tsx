import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useRestaurants } from '../../hooks/useRestaurants'
import { createOrder } from '../../services/orders'
import type { OrderFormValues, OrderStatus } from '../../types/orders'
import { useStoreContext } from '../../providers/StoreProvider'

const statusOptions: OrderStatus[] = ['확인 중', '조리 중', '배달 출발', '완료']

const initialValues: OrderFormValues = {
  restaurantId: '',
  customerName: '',
  phone: '',
  totalPrice: '',
  deliveryMethod: '배달',
  notes: '',
  status: '확인 중',
}

export const OrderForm = () => {
  const [values, setValues] = useState(initialValues)
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { selectedStoreId, ownedStoreIds } = useStoreContext()
  const { data: restaurants } = useRestaurants(ownedStoreIds)

  useEffect(() => {
    if (selectedStoreId && selectedStoreId !== 'all') {
      setValues((prev) => ({ ...prev, restaurantId: selectedStoreId }))
    }
  }, [selectedStoreId])

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      setMessage('주문이 등록되었습니다.')
      setValues(initialValues)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: () => setMessage('주문 저장 중 오류가 발생했습니다.'),
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

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div>
        <h3>수동 주문 등록</h3>
        <p className="helper">전화나 매장 주문을 빠르게 기록해 둘 수 있습니다.</p>
      </div>
      <fieldset className="form-section">
        <legend>주문 정보</legend>
        <div className="form__grid">
          <label>
            가게 선택
            <select
              name="restaurantId"
              value={values.restaurantId}
              onChange={handleChange}
              required
            >
              <option value="">선택하세요</option>
              {restaurants?.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            고객 이름
            <input
              name="customerName"
              value={values.customerName}
              onChange={handleChange}
              placeholder="홍길동"
              required
            />
          </label>
          <label>
            연락처
            <input
              name="phone"
              value={values.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
            />
          </label>
          <label>
            결제 금액
            <input
              name="totalPrice"
              type="number"
              min="0"
              value={values.totalPrice}
              onChange={handleChange}
              placeholder="15000"
              required
            />
          </label>
          <label>
            수령 방식
            <select name="deliveryMethod" value={values.deliveryMethod} onChange={handleChange}>
              <option value="배달">배달</option>
              <option value="포장">포장</option>
            </select>
          </label>
          <label>
            현재 상태
            <select name="status" value={values.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>메모</legend>
        <textarea
          name="notes"
          rows={3}
          value={values.notes}
          onChange={handleChange}
          placeholder="예: 콜라 추가, 초인종 누르지 말아주세요"
        />
      </fieldset>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '등록 중…' : '주문 등록'}
      </button>
      {message && <p className="form__message">{message}</p>}
    </form>
  )
}

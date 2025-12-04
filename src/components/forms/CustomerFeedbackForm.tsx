import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFeedback } from '../../services/feedback'
import type { FeedbackFormValues } from '../../types/feedback'

const initialValues: FeedbackFormValues = {
  customerName: '',
  contact: '',
  channel: '앱',
  issueType: '배달 지연',
  message: '',
  orderId: '',
}

const issueOptions = ['배달 지연', '상품 불만', '결제 문의', '쿠폰 문의', '기타']
const channelOptions = ['앱', '전화', '채팅', '현장']

export const CustomerFeedbackForm = () => {
  const [values, setValues] = useState(initialValues)
  const [message, setMessage] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createFeedback,
    onSuccess: () => {
      setValues(initialValues)
      setMessage('피드백이 기록되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['customerFeedback'] })
    },
    onError: () => setMessage('저장 중 오류가 발생했습니다.'),
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
        <h3>고객 문의 기록</h3>
        <p className="helper">전화나 채팅으로 접수된 문의를 남겨두면 히스토리가 쌓입니다.</p>
      </div>
      <div className="form__grid">
        <label>
          고객 이름
          <input name="customerName" value={values.customerName} onChange={handleChange} placeholder="홍길동" />
        </label>
        <label>
          연락처
          <input name="contact" value={values.contact} onChange={handleChange} placeholder="010-0000-0000" />
        </label>
        <label>
          채널
          <select name="channel" value={values.channel} onChange={handleChange}>
            {channelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </label>
        <label>
          문의 종류
          <select name="issueType" value={values.issueType} onChange={handleChange}>
            {issueOptions.map((issue) => (
              <option key={issue} value={issue}>
                {issue}
              </option>
            ))}
          </select>
        </label>
        <label>
          관련 주문번호
          <input name="orderId" value={values.orderId} onChange={handleChange} placeholder="선택 사항" />
        </label>
      </div>
      <label>
        문의 내용
        <textarea
          name="message"
          rows={3}
          value={values.message}
          onChange={handleChange}
          placeholder="상세 내용을 입력하세요."
          required
        />
      </label>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '저장 중…' : '피드백 기록'}
      </button>
      {message && <p className="form__message">{message}</p>}
    </form>
  )
}

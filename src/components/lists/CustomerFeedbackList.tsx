import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFeedback } from '../../hooks/useFeedback'
import { updateFeedback } from '../../services/feedback'
import type { FeedbackStatus } from '../../types/feedback'

const statusOptions: FeedbackStatus[] = ['접수됨', '진행 중', '완료']

type Draft = { assignee: string; lastResponse: string }
type DraftMap = Record<string, Draft>

export const CustomerFeedbackList = () => {
  const { data, isLoading, isError } = useFeedback()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<DraftMap>({})

  useEffect(() => {
    if (!data) return
    setDrafts((prev) => {
      const next = { ...prev }
      data.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = {
            assignee: item.assignee ?? '',
            lastResponse: item.lastResponse ?? '',
          }
        }
      })
      return next
    })
  }, [data])

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      updateFeedback(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customerFeedback'] }),
  })

  const notesMutation = useMutation({
    mutationFn: ({ id, assignee, lastResponse }: { id: string; assignee: string; lastResponse: string }) =>
      updateFeedback(id, { assignee, lastResponse }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customerFeedback'] }),
  })

  const handleDraftChange = (id: string, field: keyof Draft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { assignee: '', lastResponse: '' }),
        [field]: value,
      },
    }))
  }

  const handleSave = (id: string) => {
    const draft = drafts[id]
    notesMutation.mutate({ id, assignee: draft?.assignee ?? '', lastResponse: draft?.lastResponse ?? '' })
  }

  return (
    <div className="panel panel--sub">
      <h3>고객 문의 리스트</h3>
      {isLoading && <p>불러오는 중…</p>}
      {isError && <p className="state__error">목록을 불러오지 못했습니다.</p>}
      {!isLoading && data && data.length === 0 && <p>아직 접수된 문의가 없습니다.</p>}
      {data && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>고객</th>
                <th>문의</th>
                <th>상태</th>
                <th>메모</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.customerName}</strong>
                    <p className="muted">{item.contact}</p>
                    <p className="muted">
                      {item.channel} · {item.createdAt}
                    </p>
                  </td>
                  <td>
                    <strong>{item.issueType}</strong>
                    <p className="muted">{item.message}</p>
                    {item.orderId && <p className="muted">주문번호: {item.orderId}</p>}
                  </td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        statusMutation.mutate({
                          id: item.id,
                          status: event.target.value as FeedbackStatus,
                        })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <label>
                      담당자
                      <input
                        value={drafts[item.id]?.assignee ?? ''}
                        onChange={(event) => handleDraftChange(item.id, 'assignee', event.target.value)}
                        placeholder="예: 김매니저"
                      />
                    </label>
                    <label>
                      답변 메모
                      <input
                        value={drafts[item.id]?.lastResponse ?? ''}
                        onChange={(event) => handleDraftChange(item.id, 'lastResponse', event.target.value)}
                        placeholder="예: 5분 내 재연락"
                      />
                    </label>
                  </td>
                  <td>
                    <button type="button" className="button-ghost" onClick={() => handleSave(item.id)}>
                      저장
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(statusMutation.isPending || notesMutation.isPending) && <p className="helper">변경 사항을 저장하는 중…</p>}
    </div>
  )
}

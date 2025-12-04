export type FeedbackStatus = '접수됨' | '진행 중' | '완료'

export interface FeedbackFormValues {
  customerName: string
  contact: string
  channel: string
  issueType: string
  message: string
  orderId?: string
}

export interface FeedbackRecord {
  id: string
  customerName: string
  contact: string
  channel: string
  issueType: string
  message: string
  status: FeedbackStatus
  assignee?: string
  lastResponse?: string
  createdAt?: string | null
  updatedAt?: string | null
  orderId?: string
}

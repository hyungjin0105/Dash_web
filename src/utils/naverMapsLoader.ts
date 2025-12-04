import { naverMapKeyId, naverMapScriptUrl } from '../config/naver'

declare global {
  interface Window {
    naver: any
  }
}

const NAVER_SCRIPT_ID = 'naver-map-sdk'
let naverScriptPromise: Promise<typeof window.naver> | null = null

const attachListeners = (
  script: HTMLScriptElement,
  resolve: (value: typeof window.naver) => void,
  reject: (reason?: unknown) => void,
) => {
  script.addEventListener(
    'load',
    () => {
      if (window.naver && window.naver.maps) {
        resolve(window.naver)
      } else {
        reject(new Error('네이버 지도 객체를 초기화할 수 없습니다.'))
      }
    },
    { once: true },
  )
  script.addEventListener(
    'error',
    () => reject(new Error('네이버 지도 스크립트를 불러오지 못했습니다.')),
    { once: true },
  )
}

export const ensureNaverMaps = () => {
  if (!naverMapKeyId) {
    return Promise.reject(new Error('네이버 지도 Key ID(ncpKeyId)가 설정되지 않았습니다.'))
  }

  if (window.naver && window.naver.maps) {
    return Promise.resolve(window.naver)
  }

  if (!naverScriptPromise) {
    naverScriptPromise = new Promise<typeof window.naver>((resolve, reject) => {
      const existingScript = document.getElementById(NAVER_SCRIPT_ID) as HTMLScriptElement | null
      if (existingScript) {
        attachListeners(existingScript, resolve, reject)
        return
      }

      if (!naverMapScriptUrl) {
        reject(new Error('네이버 지도 스크립트 URL이 비어있습니다. 환경변수를 확인하세요.'))
        return
      }

      const script = document.createElement('script')
      script.id = NAVER_SCRIPT_ID
      script.src = naverMapScriptUrl
      script.async = true
      script.defer = true
      attachListeners(script, resolve, reject)
      document.head.appendChild(script)
    })
  }

  return naverScriptPromise
}

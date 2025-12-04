const keyId =
  import.meta.env.VITE_NAVER_MAP_KEY_ID ??
  import.meta.env.VITE_NAVER_MAP_CLIENT_ID ??
  ''
const clientSecret = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET ?? ''

export const naverMapKeyId = keyId
// Backward compatibility for existing imports
export const naverMapClientId = keyId
export const naverMapClientSecret = clientSecret

export const naverMapScriptUrl = keyId
  ? `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${keyId}&submodules=geocoder`
  : ''

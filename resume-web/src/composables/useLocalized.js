import { useI18n } from 'vue-i18n'

/**
 * 이력서 데이터의 localized 필드에서 현재 locale 값을 추출하는 composable
 *
 * 필드가 { ko: '...', en: '...' } 객체면 현재 locale 값을 반환
 * 단순 String이면 그대로 반환
 * 영문 값이 비어있으면 한글로 fallback
 */
export function useLocalized() {
  const { locale } = useI18n()

  const localized = (field) => {
    if (!field) return ''
    if (typeof field === 'string') return field
    if (typeof field === 'object' && (field.ko !== undefined || field.en !== undefined)) {
      return field[locale.value] || field.ko || ''
    }
    return String(field)
  }

  return { localized, locale }
}

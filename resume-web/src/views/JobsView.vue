<script setup>
import { ref, computed, onMounted } from 'vue'
import { jobsApi } from '../api/client.js'
import SiteSection from '../components/jobs/SiteSection.vue'
import JobSearchSkeleton from '../components/jobs/JobSearchSkeleton.vue'

const loading = ref(true)
const error = ref(null)
const result = ref(null)
const expandedRegions = ref({})

// 키워드 편집 상태
const editableKeywords = ref([])
const keywordInput = ref('')

// 지역 필터 상태 (기본값: 전체 선택)
const selectedRegions = ref(['판교', '경기도나머지', '세종', '천안', '대전청주'])

// 정렬 기준 (매칭점수순 / 마감일순)
const sortBy = ref('matchScore')

// API 결과가 있는 사이트 (ok 상태)
const apiSites = computed(() =>
  result.value?.sites?.filter((s) => s.status === 'ok') || []
)

// 외부 링크 사이트
const linkSites = computed(() =>
  result.value?.sites?.filter((s) => s.status === 'link_only') || []
)

// 비활성/오류 사이트
const otherSites = computed(() =>
  result.value?.sites?.filter((s) => s.status === 'disabled' || s.status === 'error') || []
)

const totalJobs = computed(() =>
  result.value?.sites?.reduce((sum, s) => sum + (s.jobs?.length || 0), 0) || 0
)

// 마감일 파싱 (~ MM/DD 형태 → Date 객체, 실패 시 null)
function parseDeadline(deadline) {
  if (!deadline) return null
  const match = String(deadline).match(/~\s*(\d{1,2})\/(\d{1,2})/)
  if (!match) return null
  const now = new Date()
  const year = now.getFullYear()
  const month = parseInt(match[1], 10) - 1
  const day = parseInt(match[2], 10)
  const date = new Date(year, month, day)
  // 이미 지난 날짜면 내년으로 처리
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    date.setFullYear(year + 1)
  }
  return date
}

// 정렬 함수
function sortJobs(jobs) {
  if (sortBy.value === 'deadline') {
    return [...jobs].sort((a, b) => {
      const da = parseDeadline(a.deadline)
      const db = parseDeadline(b.deadline)
      if (da && db) return da - db
      if (da) return -1
      if (db) return 1
      return 0
    })
  }
  // 기본: 매칭점수 내림차순
  return [...jobs].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
}

// 지역별로 공고 그룹화
const jobsByRegion = computed(() => {
  if (!result.value?.topMatches?.length) return {}

  const regions = {
    판교: [],
    경기도나머지: [],
    세종: [],
    천안: [],
    대전청주: []
  }

  result.value.topMatches.forEach((job) => {
    const location = (job.location || '').toLowerCase()
    const title = (job.title || '').toLowerCase()
    const combined = location + ' ' + title

    if (combined.includes('판교') || combined.includes('분당')) {
      regions.판교.push(job)
    } else if (combined.includes('세종')) {
      regions.세종.push(job)
    } else if (combined.includes('천안')) {
      regions.천안.push(job)
    } else if (combined.includes('대전') || combined.includes('청주')) {
      regions.대전청주.push(job)
    } else if (combined.includes('경기')) {
      regions.경기도나머지.push(job)
    }
  })

  // 빈 지역 제거
  return Object.fromEntries(
    Object.entries(regions).filter(([_, jobs]) => jobs.length > 0)
  )
})

// 필터 + 정렬이 적용된 지역별 공고
const filteredJobsByRegion = computed(() => {
  const result = {}
  for (const [key, jobs] of Object.entries(jobsByRegion.value)) {
    if (!selectedRegions.value.includes(key)) continue
    result[key] = sortJobs(jobs)
  }
  return result
})

const regionNames = {
  판교: '판교/분당',
  경기도나머지: '경기도 (기타)',
  세종: '세종시',
  천안: '천안시',
  대전청주: '대전/청주'
}

const regionIcons = {
  판교: '🏢',
  경기도나머지: '🏙️',
  세종: '🏛️',
  천안: '🏭',
  대전청주: '🌆'
}

// 지역 섹션 토글
function toggleRegion(regionKey) {
  expandedRegions.value[regionKey] = !expandedRegions.value[regionKey]
}

// 지역 확장 상태 확인 (기본값: 접힌 상태)
function isRegionExpanded(regionKey) {
  return expandedRegions.value[regionKey] === true
}

// 전체 접기/펼치기
const allRegionsExpanded = computed(() => {
  const keys = Object.keys(filteredJobsByRegion.value)
  return keys.length > 0 && keys.every((k) => expandedRegions.value[k] === true)
})

function toggleAllRegions() {
  const expand = !allRegionsExpanded.value
  Object.keys(filteredJobsByRegion.value).forEach((k) => {
    expandedRegions.value[k] = expand
  })
}

// 키워드 추가
function addKeyword(value) {
  const trimmed = value.trim().replace(/,$/, '').trim()
  if (trimmed && !editableKeywords.value.includes(trimmed)) {
    editableKeywords.value.push(trimmed)
  }
  keywordInput.value = ''
}

function onKeywordKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addKeyword(keywordInput.value)
  }
}

function removeKeyword(keyword) {
  editableKeywords.value = editableKeywords.value.filter((k) => k !== keyword)
}

// 키워드로 재검색
async function searchWithKeywords() {
  loading.value = true
  error.value = null
  try {
    result.value = await jobsApi.search(editableKeywords.value)
    editableKeywords.value = result.value.skillsUsed ? [...result.value.skillsUsed] : []
  } catch (err) {
    console.error('Failed to search jobs:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function searchJobs() {
  loading.value = true
  error.value = null
  try {
    result.value = await jobsApi.search()
    editableKeywords.value = result.value.skillsUsed ? [...result.value.skillsUsed] : []
  } catch (err) {
    console.error('Failed to search jobs:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  searchJobs()
})
</script>

<template>
  <div class="container mx-auto max-w-[1200px] px-0 md:px-4 py-6 md:py-8">
    <!-- Page Header -->
    <div class="bg-reddit-gray border border-reddit-border rounded-none md:rounded-md p-6 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-2xl font-bold text-white">채용 정보 검색</h1>
        <button
          @click="searchJobs"
          :disabled="loading"
          class="flex items-center gap-2 bg-reddit-orange hover:opacity-90 disabled:opacity-50 text-white rounded-full px-4 py-1.5 font-bold text-sm transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
               class="w-4 h-4" :class="{ 'animate-spin': loading }">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
          </svg>
          {{ loading ? '검색 중...' : '새로고침' }}
        </button>
      </div>
      <p class="text-reddit-text-secondary text-sm mb-4">
        이력서를 자동 분석하여 최적화된 채용 정보를 검색합니다
      </p>

      <!-- Resume Analysis Summary -->
      <div v-if="result?.resumeAnalysis" class="mb-4 p-4 bg-reddit-orange/10 border border-reddit-orange/30 rounded-md">
        <div class="flex items-center gap-2 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-orange">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span class="text-sm font-bold text-reddit-orange">이력서 자동 분석 결과</span>
        </div>
        <div class="text-sm text-reddit-text space-y-1">
          <p><span class="text-reddit-text-secondary">프로필:</span> {{ result.resumeAnalysis.summary }}</p>
          <p v-if="result.resumeAnalysis.preferredRoles?.length"><span class="text-reddit-text-secondary">선호 직무:</span> {{ result.resumeAnalysis.preferredRoles.join(', ') }}</p>
          <p><span class="text-reddit-text-secondary">주력 기술:</span>
            <span v-for="tech in result.resumeAnalysis.primaryTech?.slice(0, 5)" :key="tech" class="inline-block bg-reddit-orange/20 text-reddit-orange text-xs px-2 py-0.5 rounded-full mr-1">{{ tech }}</span>
          </p>
        </div>
      </div>

      <!-- Search Metadata -->
      <div v-if="result" class="space-y-3">
        <!-- Skills Used (편집 가능한 태그 입력창) -->
        <div>
          <span class="text-xs text-reddit-text-secondary mr-2">검색 스킬:</span>
          <div class="inline-flex flex-wrap items-center gap-1 mt-1">
            <span v-for="keyword in editableKeywords" :key="keyword"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#272729] text-reddit-text-secondary">
              {{ keyword }}
              <button @click="removeKeyword(keyword)"
                      class="text-reddit-text-secondary hover:text-white leading-none ml-0.5">×</button>
            </span>
            <input
              v-model="keywordInput"
              @keydown="onKeywordKeydown"
              @blur="addKeyword(keywordInput)"
              placeholder="키워드 입력 후 Enter"
              class="bg-transparent text-xs text-white placeholder-reddit-text-secondary outline-none border-b border-reddit-border focus:border-reddit-orange w-32 px-1 py-0.5" />
            <button
              @click="searchWithKeywords"
              :disabled="loading"
              class="ml-1 flex items-center gap-1 px-3 py-1 bg-reddit-orange hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-full transition-opacity">
              이 키워드로 검색
            </button>
          </div>
        </div>
        <!-- Locations Used -->
        <div>
          <span class="text-xs text-reddit-text-secondary mr-2">근무 희망지:</span>
          <span v-for="loc in result.locationsUsed" :key="loc"
                class="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-reddit-orange/10 text-reddit-orange mr-1 mb-1">
            {{ loc }}
          </span>
        </div>
        <!-- Stats -->
        <div class="flex items-center gap-4 text-xs text-reddit-text-secondary pt-1">
          <span>총 {{ totalJobs }}건 검색됨</span>
          <span v-if="result.cached" class="bg-reddit-blue/20 text-reddit-blue px-2 py-0.5 rounded-full">캐시됨</span>
          <span>{{ new Date(result.searchedAt).toLocaleString('ko-KR') }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <JobSearchSkeleton v-if="loading" />

    <!-- Error State -->
    <div v-else-if="error" class="bg-reddit-gray border border-red-500 rounded-md p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-red-500 mb-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <h2 class="text-xl font-bold text-white mb-2">검색 실패</h2>
      <p class="text-reddit-text-secondary mb-4">{{ error }}</p>
      <button @click="searchJobs"
              class="bg-reddit-orange hover:opacity-90 text-white rounded-full px-5 py-1.5 font-bold text-sm transition-opacity">
        다시 시도
      </button>
    </div>

    <!-- Results -->
    <div v-else-if="result">
      <!-- Top 10 Matches -->
      <div v-if="result.topMatches?.length > 0" class="mb-8">
        <!-- 지역 필터 + 정렬 컨트롤 -->
        <div class="bg-reddit-gray border border-reddit-border rounded-none md:rounded-md p-4 mb-4 flex flex-wrap items-center gap-4">
          <!-- 지역 필터 -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-reddit-text-secondary font-semibold">지역:</span>
            <label v-for="(label, key) in regionNames" :key="key" class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" :value="key" v-model="selectedRegions"
                     class="accent-reddit-orange" />
              <span class="text-xs text-reddit-text-secondary">{{ label }}</span>
            </label>
          </div>
          <!-- 구분선 -->
          <div class="hidden md:block w-px h-5 bg-reddit-border"></div>
          <!-- 정렬 기준 -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-reddit-text-secondary font-semibold">정렬:</span>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="radio" value="matchScore" v-model="sortBy" class="accent-reddit-orange" />
              <span class="text-xs text-reddit-text-secondary">매칭점수순</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="radio" value="deadline" v-model="sortBy" class="accent-reddit-orange" />
              <span class="text-xs text-reddit-text-secondary">마감일순</span>
            </label>
          </div>
        </div>

        <div class="bg-gradient-to-r from-reddit-orange/20 to-reddit-orange/5 border border-reddit-orange rounded-none md:rounded-md p-6 mb-4">
          <div class="flex items-center gap-3 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-reddit-orange">
              <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
            </svg>
            <h2 class="text-xl font-bold text-white">당신에게 가장 적합한 상위 20개 공고 (지역별)</h2>
          </div>
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm text-reddit-text-secondary">
              전체 사이트에서 매칭 점수가 가장 높은 공고를 지역별로 분류했습니다.
              <span v-if="result.topMatches.filter(j => j.isContract || j.isFreelance).length > 0" class="text-reddit-orange">
                계약직/프리랜서 공고는 자동으로 우선순위가 높습니다.
              </span>
            </p>
            <button
              @click="toggleAllRegions"
              class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-[#272729] hover:bg-[#343436] text-reddit-text-secondary text-xs font-semibold rounded-full transition-colors ml-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                <path v-if="allRegionsExpanded" stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
              {{ allRegionsExpanded ? '전체 접기' : '전체 펼치기' }}
            </button>
          </div>
        </div>

        <!-- 지역별 섹션 -->
        <div v-for="(jobs, regionKey) in filteredJobsByRegion" :key="regionKey" class="mb-6">
          <button
            @click="toggleRegion(regionKey)"
            class="w-full flex items-center gap-2 mb-3 px-2 py-2 hover:bg-reddit-gray-dark/50 rounded-md transition-colors cursor-pointer">
            <!-- 펼침/접힘 아이콘 -->
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                 class="w-5 h-5 text-reddit-text-secondary transition-transform"
                 :class="{ 'rotate-90': isRegionExpanded(regionKey) }">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span class="text-2xl">{{ regionIcons[regionKey] }}</span>
            <h3 class="text-lg font-bold text-white">{{ regionNames[regionKey] }}</h3>
            <span class="text-sm text-reddit-text-secondary">({{ jobs.length }}건)</span>
          </button>

          <!-- 공고 목록 (접기/펼치기) -->
          <div v-show="isRegionExpanded(regionKey)" class="space-y-3">
          <div v-for="(job, index) in jobs" :key="`top-${job.url}`"
               class="bg-reddit-gray border border-reddit-border hover:border-reddit-orange rounded-none md:rounded-md p-4 transition-colors">
            <!-- Job Content -->
            <div class="flex-1 min-w-0">
              <!-- 고용형태 태그 (제목 위) -->
              <div v-if="job.isContract || job.isFreelance" class="flex gap-2 mb-1.5">
                <span v-if="job.isContract" class="px-2 py-0.5 bg-reddit-orange/20 text-reddit-orange text-xs font-semibold rounded-full">
                  계약직
                </span>
                <span v-if="job.isFreelance" class="px-2 py-0.5 bg-reddit-orange/20 text-reddit-orange text-xs font-semibold rounded-full">
                  프리랜서
                </span>
              </div>

              <div class="flex items-start justify-between gap-3 mb-2">
                <h3 class="text-base font-semibold flex-1 min-w-0">
                  <a :href="job.url" target="_blank" rel="noopener noreferrer"
                     class="text-white hover:text-reddit-orange transition-colors hover:underline">
                    {{ job.title }}
                  </a>
                </h3>
                <!-- 마감일 (우상단) -->
                <div v-if="job.deadline" class="flex-shrink-0 text-xs"
                     :class="parseDeadline(job.deadline) && (parseDeadline(job.deadline) - new Date()) / 86400000 <= 7 ? 'text-red-400' : 'text-reddit-text-secondary'">
                  <template v-if="parseDeadline(job.deadline)">
                    {{ (() => { const d = Math.round((parseDeadline(job.deadline) - new Date()) / 86400000); return d === 0 ? 'D-day' : d > 0 ? `D-${d}` : `D+${Math.abs(d)}` })() }}
                    <span class="ml-1 opacity-70">{{ job.deadline }}</span>
                  </template>
                  <template v-else>{{ job.deadline }}</template>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3 text-xs text-reddit-text-secondary mb-2">
                <span v-if="job.company" class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                  {{ job.company }}
                </span>
                <span v-if="job.location" class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {{ job.location }}
                </span>
                <span v-if="job.experience" class="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                  </svg>
                  {{ job.experience }}
                </span>
                <span class="flex items-center gap-1 text-reddit-blue">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  {{ job.sourceName }}
                </span>
              </div>

              <!-- 하단: 매칭점수 + 상세보기 버튼 -->
              <div class="flex items-center justify-between gap-3 mt-2">
                <span class="text-xs text-reddit-text-secondary">매칭 {{ job.matchScore }}점</span>
                <a :href="job.url" target="_blank" rel="noopener noreferrer"
                   class="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-reddit-orange hover:bg-reddit-orange/90 text-white text-xs font-bold rounded-full transition-colors">
                  상세보기
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- 구분선 -->
      <div v-if="result.topMatches?.length > 0" class="my-8 border-t border-reddit-border"></div>

      <!-- API Results (actual job data) -->
      <div v-if="apiSites.length > 0" class="mb-6">
        <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-text-secondary">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          사이트별 전체 공고
        </h2>
      </div>
      <SiteSection v-for="site in apiSites" :key="site.source" :site="site" />

      <!-- External Link Sites -->
      <div v-if="linkSites.length" class="mb-8">
        <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-text-secondary">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          외부 사이트 검색 바로가기
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SiteSection v-for="site in linkSites" :key="site.source" :site="site" />
        </div>
      </div>

      <!-- Disabled / Error Sites -->
      <SiteSection v-for="site in otherSites" :key="site.source" :site="site" />
    </div>
  </div>
</template>

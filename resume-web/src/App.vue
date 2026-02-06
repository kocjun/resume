<script setup>
import { ref, computed, onMounted } from 'vue'
import { resumeApi, authApi } from './api/client.js'
import resumeDataFallback from './data.json'
import ProfileHeader from './components/ProfileHeader.vue'
import SkillSection from './components/SkillSection.vue'
import ExperienceList from './components/ExperienceList.vue'
import PersonalProjectList from './components/PersonalProjectList.vue'
import Footer from './components/Footer.vue'
import LoginModal from './components/LoginModal.vue'
import ExperienceFormModal from './components/ExperienceFormModal.vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)
const isAuthenticated = ref(false)
const showLoginModal = ref(false)
const showFormModal = ref(false)
const editingExperience = ref(null)
const searchQuery = ref('')
const searchTag = ref('')
const showTagSuggestions = ref(false)

// 모든 태그 목록 (techStack + skills.items 중복 제거)
const allTags = computed(() => {
  if (!data.value) return []
  const tagSet = new Set()
  // experience의 techStack에서 수집
  data.value.experience?.forEach(exp => {
    exp.techStack?.forEach(tag => tagSet.add(tag))
  })
  // skills의 items에서 수집
  data.value.skills?.forEach(skill => {
    skill.items?.forEach(item => tagSet.add(item))
  })
  return [...tagSet].sort()
})

// 입력값에 매칭되는 태그 목록
const filteredTags = computed(() => {
  if (!searchQuery.value) return allTags.value
  const q = searchQuery.value.toLowerCase()
  return allTags.value.filter(tag => tag.toLowerCase().includes(q))
})

// 태그로 필터링된 experience 목록
const filteredExperiences = computed(() => {
  if (!data.value?.experience) return []
  if (!searchTag.value) return data.value.experience
  const tag = searchTag.value.toLowerCase()
  return data.value.experience.filter(exp =>
    exp.techStack?.some(t => t.toLowerCase() === tag)
  )
})

// 태그 선택 (같은 태그 재클릭 시 해제)
const selectTag = (tag) => {
  if (searchTag.value.toLowerCase() === tag.toLowerCase()) {
    clearSearch()
    return
  }
  searchTag.value = tag
  searchQuery.value = tag
  showTagSuggestions.value = false
}

// 검색 초기화
const clearSearch = () => {
  searchTag.value = ''
  searchQuery.value = ''
  showTagSuggestions.value = false
}

// 검색 입력 핸들러
const onSearchInput = () => {
  searchTag.value = ''
  showTagSuggestions.value = searchQuery.value.length > 0
}

// 검색바 외부 클릭 시 드롭다운 닫기
const onSearchBlur = () => {
  setTimeout(() => {
    showTagSuggestions.value = false
  }, 200)
}

// 데이터 로드 함수
const loadResumeData = async () => {
  loading.value = true
  error.value = null

  try {
    if (isAuthenticated.value) {
      // 로그인된 경우 API에서 데이터 가져오기
      data.value = await resumeApi.get()
    } else {
      // 로그인 안 된 경우 정적 데이터 사용 (공개 모드)
      data.value = resumeDataFallback
    }
  } catch (err) {
    console.error('Failed to load resume data:', err)
    error.value = err.message

    // 에러 시 정적 데이터 폴백
    data.value = resumeDataFallback
  } finally {
    loading.value = false
  }
}

// 컴포넌트 마운트 시 데이터 로드
onMounted(async () => {
  // 인증 상태 확인
  isAuthenticated.value = authApi.isAuthenticated()
  await loadResumeData()
})

// 로그인 핸들러
const handleLogin = () => {
  showLoginModal.value = true
}

// 로그인 성공 핸들러
const handleLoginSuccess = async () => {
  isAuthenticated.value = true
  await loadResumeData()
}

// 로그아웃 핸들러
const handleLogout = () => {
  authApi.logout()
  isAuthenticated.value = false
  data.value = resumeDataFallback
  error.value = null
}

// 이력서 작성/수정 핸들러
const openCreateModal = () => {
  editingExperience.value = null
  showFormModal.value = true
}

const openEditModal = (experience) => {
  editingExperience.value = experience
  showFormModal.value = true
}

const handleSaveExperience = async (experienceData) => {
  try {
    // id 또는 _id 로 수정 여부 판단
    const expId = experienceData.id || experienceData._id
    if (expId) {
      // payload에서 id/_id 제거 (URL 파라미터로 전달)
      const { id, _id, ...payload } = experienceData
      await resumeApi.updateExperience(expId, payload)
    } else {
      await resumeApi.addExperience(experienceData)
    }

    // 데이터 갱신
    await loadResumeData()
    showFormModal.value = false
  } catch (err) {
    console.error('Failed to save experience:', err)
    alert('Failed to save experience: ' + err.message)
  }
}

const handleDeleteExperience = async (experience) => {
  const expId = experience.id || experience._id
  if (!expId) return

  if (!confirm(`"${experience.project}" 포스트를 삭제하시겠습니까?`)) return

  try {
    await resumeApi.deleteExperience(expId)
    await loadResumeData()
  } catch (err) {
    console.error('Failed to delete experience:', err)
    alert('Failed to delete experience: ' + err.message)
  }
}
</script>

<template>
  <div class="min-h-screen bg-reddit-dark font-sans text-reddit-text antialiased selection:bg-reddit-orange selection:text-white">
    <!-- Navbar (Global Header) -->
    <div class="sticky top-0 z-50 bg-reddit-gray border-b border-reddit-border px-4 py-2 flex items-center justify-between shadow-md">
       <div class="flex items-center gap-2">
         <div class="w-8 h-8 rounded-full bg-reddit-orange flex items-center justify-center text-white font-bold">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
             <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.5-4.75a.75.75 0 011.5 0v.75a.75.75 0 01-1.5 0v-.75zm3 0a.75.75 0 011.5 0v.75a.75.75 0 01-1.5 0v-.75zm-6.07-3.957a.75.75 0 111.14-1.006 5.5 5.5 0 017.86 0 .75.75 0 11-1.14 1.006 4 4 0 00-5.72 0zM7 9a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
           </svg>
         </div>
         <span class="font-display font-bold text-lg hidden sm:block">resume/{{ data?.profile?.name || 'Loading...' }}</span>
       </div>
       
       <!-- Search Tag Bar -->
       <div class="flex-1 max-w-xl mx-4 hidden md:block relative">
         <div class="bg-[#272729] border border-reddit-border rounded-full px-4 py-1.5 flex items-center hover:border-white transition-colors"
              :class="{ 'border-white': showTagSuggestions }">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-text-secondary mr-3 flex-shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              v-model="searchQuery"
              @input="onSearchInput"
              @focus="showTagSuggestions = searchQuery.length > 0 || !searchTag"
              @blur="onSearchBlur"
              type="text"
              placeholder="Search Tag"
              class="bg-transparent text-sm text-reddit-text placeholder-reddit-text-secondary outline-none flex-1 min-w-0"
            />
            <button
              v-if="searchTag || searchQuery"
              @click="clearSearch"
              class="ml-2 text-reddit-text-secondary hover:text-white transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
         </div>
         <!-- Tag Suggestions Dropdown -->
         <div v-if="showTagSuggestions && filteredTags.length > 0"
              class="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1b] border border-reddit-border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
           <button
             v-for="tag in filteredTags"
             :key="tag"
             @mousedown.prevent="selectTag(tag)"
             class="w-full text-left px-4 py-2 text-sm text-reddit-text hover:bg-[#272729] transition-colors flex items-center gap-2">
             <span class="inline-block bg-reddit-orange/20 text-reddit-orange text-xs px-2 py-0.5 rounded-full">#</span>
             {{ tag }}
           </button>
         </div>
         <!-- Active Tag Badge -->
         <div v-if="searchTag" class="absolute -bottom-6 left-4 flex items-center gap-2 text-xs">
           <span class="bg-reddit-orange/20 text-reddit-orange px-2 py-0.5 rounded-full flex items-center gap-1">
             #{{ searchTag }}
             <span class="text-reddit-text-secondary ml-1">{{ filteredExperiences.length }}건</span>
           </span>
         </div>
       </div>

       <div class="flex items-center gap-4">
         <button
           v-if="!isAuthenticated"
           @click="handleLogin"
           class="bg-reddit-orange hover:opacity-90 text-white rounded-full px-5 py-1.5 font-bold text-sm transition-opacity">
           Log In
         </button>
         <div v-else class="flex items-center gap-2">
           <span class="text-reddit-text-secondary text-sm">{{ data?.profile?.email || 'User' }}</span>
           <button
             @click="handleLogout"
             class="text-reddit-text-secondary hover:text-white text-sm transition-colors">
             Logout
           </button>
         </div>
       </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center">
        <div class="inline-block w-12 h-12 border-4 border-reddit-orange border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-reddit-text-secondary">Loading resume data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto max-w-[800px] px-4 py-12">
      <div class="bg-reddit-gray border border-red-500 rounded-md p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto text-red-500 mb-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <h2 class="text-xl font-bold text-white mb-2">Failed to Load Data</h2>
        <p class="text-reddit-text-secondary mb-4">{{ error }}</p>
        <p class="text-sm text-reddit-text-secondary">Showing fallback data from local file.</p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div v-else-if="data" class="container mx-auto max-w-[1200px] px-0 md:px-4 py-6 md:py-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Main Feed (Experience) -->
        <main class="lg:col-span-8 space-y-4">
          <!-- Profile Header acts like a pinned post or community info in main feed for mobile, but let's keep it separate or top -->
          <ProfileHeader :profile="data.profile" class="mb-6 rounded-none md:rounded-md overflow-hidden" />

          <!-- Experience List (Feed) -->
          <ExperienceList
            :experiences="filteredExperiences"
            :isAuthenticated="isAuthenticated"
            @create="openCreateModal"
            @edit="openEditModal"
            @delete="handleDeleteExperience"
          />
        </main>

        <!-- Sidebar (Right) -->
        <aside class="hidden lg:block lg:col-span-4 space-y-4">
          <!-- About Community / Skills -->
          <SkillSection :skills="data.skills" :activeTag="searchTag" @select-tag="selectTag" />

          <!-- Personal Projects -->
          <PersonalProjectList v-if="data.personalProjects" :projects="data.personalProjects" />

          <div class="bg-reddit-gray border border-reddit-border rounded-md p-3 text-xs text-reddit-text-secondary">
             <div class="flex gap-2 mb-2">
               <span>User Agreement</span>
               <span>Privacy Policy</span>
             </div>
             <p>© {{ new Date().getFullYear() }} {{ data.profile.name }}. All rights reserved.</p>
          </div>
        </aside>

      </div>
    </div>

    <!-- Mobile Footer (Visible only on mobile if Sidebar is hidden) -->
    <Footer v-if="data" :profile="data.profile" class="lg:hidden" />

    <!-- Login Modal -->
    <LoginModal
      :isOpen="showLoginModal"
      @close="showLoginModal = false"
      @login-success="handleLoginSuccess" />

    <!-- Experience Form Modal -->
    <ExperienceFormModal
      :isOpen="showFormModal"
      :experience="editingExperience"
      @close="showFormModal = false"
      @save="handleSaveExperience" />
  </div>
</template>

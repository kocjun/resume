<script setup>
import { ref, onMounted } from 'vue'
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
    if (experienceData.id) {
      // 수정
      await resumeApi.updateExperience(experienceData.id, experienceData)
    } else {
      // 생성
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
       
       <!-- Search Bar Mockup -->
       <div class="flex-1 max-w-xl mx-4 hidden md:block">
         <div class="bg-[#272729] border border-reddit-border rounded-full px-4 py-1.5 flex items-center hover:border-white transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-reddit-text-secondary mr-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span class="text-reddit-text-secondary text-sm">Search Resume</span>
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
            :experiences="data.experience" 
            :isAuthenticated="isAuthenticated"
            @create="openCreateModal"
            @edit="openEditModal"
          />
        </main>

        <!-- Sidebar (Right) -->
        <aside class="hidden lg:block lg:col-span-4 space-y-4">
          <!-- About Community / Skills -->
          <SkillSection :skills="data.skills" />

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

<script setup>
import { ref, watch, onMounted } from 'vue'
import { XMarkIcon, PlusIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  experience: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  company: '',
  period: '',
  position: '',
  project: '',
  description: '',
  newTech: '',
  techStack: []
})

// Initialize form when opening
const initForm = () => {
  if (props.experience) {
    form.value = {
      ...props.experience,
      newTech: '',
      techStack: [...(props.experience.techStack || [])]
    }
  } else {
    form.value = {
      company: '',
      period: '',
      position: '',
      project: '',
      description: '',
      newTech: '',
      techStack: []
    }
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    initForm()
  }
})

const addTech = () => {
  const tech = form.value.newTech.trim()
  if (tech && !form.value.techStack.includes(tech)) {
    form.value.techStack.push(tech)
  }
  form.value.newTech = ''
}

const removeTech = (index) => {
  form.value.techStack.splice(index, 1)
}

const handleSubmit = () => {
  // Validate basic fields (optional but recommended)
  if (!form.value.company || !form.value.project) return
  
  const payload = {
    ...form.value,
    // If it's an update, we might keep the ID, but for payload structure we rely on parent to handle ID separation if needed
    // Assuming backend just takes the object body
  }
  // cleanup helper fields
  delete payload.newTech
  
  if (props.experience && props.experience.id) {
    payload.id = props.experience.id
  }

  emit('save', payload)
}
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" @click="$emit('close')"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-2xl max-h-[90vh] bg-reddit-gray border border-reddit-border rounded-lg shadow-2xl overflow-y-auto flex flex-col">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-reddit-border bg-[#1A1A1B]">
           <h2 class="text-lg font-medium text-reddit-text">
             {{ experience ? 'Edit Experience' : 'Create Experience' }}
           </h2>
           <button class="text-reddit-text-secondary hover:text-white rounded-full p-1" @click="$emit('close')">
              <XMarkIcon class="w-6 h-6" />
           </button>
        </div>

        <!-- Body -->
        <div class="p-4 space-y-4">
           <!-- Company & Position -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Company</label>
                <input v-model="form.company" type="text" 
                       class="w-full bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors"
                       placeholder="e.g. Samsung Electronics" />
              </div>
              <div>
                <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Position</label>
                <input v-model="form.position" type="text" 
                       class="w-full bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors"
                       placeholder="e.g. Senior Developer" />
              </div>
           </div>

           <!-- Project Name & Period -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Project Name</label>
                <input v-model="form.project" type="text" 
                       class="w-full bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors"
                       placeholder="e.g. SCM Dashboard System" />
              </div>
              <div>
                <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Period</label>
                <input v-model="form.period" type="text" 
                       class="w-full bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors"
                       placeholder="e.g. 2023.01 ~ 2024.12" />
              </div>
           </div>

           <!-- Description -->
           <div>
             <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Description</label>
             <textarea v-model="form.description" rows="5"
                       class="w-full bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors resize-none"
                       placeholder="Describe your role and achievements..."></textarea>
           </div>

           <!-- Tech Stack -->
           <div>
             <label class="block text-xs font-bold text-reddit-text-secondary uppercase mb-1">Tech Stack</label>
             <div class="flex items-center gap-2 mb-2">
               <input v-model="form.newTech" type="text" 
                      @keyup.enter="addTech"
                      class="flex-1 bg-[#272729] border border-reddit-border rounded px-3 py-2 text-reddit-text focus:outline-none focus:border-white transition-colors"
                      placeholder="Add tech (Press Enter)" />
               <button @click="addTech" class="bg-[#272729] border border-reddit-border p-2 rounded text-reddit-text hover:bg-[#343536]">
                 <PlusIcon class="w-5 h-5" />
               </button>
             </div>
             <div class="flex flex-wrap gap-2">
                <span v-for="(tech, index) in form.techStack" :key="index"
                      class="flex items-center gap-1 px-2 py-1 bg-reddit-orange/10 text-reddit-orange border border-reddit-orange/20 rounded-full text-xs cursor-pointer hover:bg-reddit-orange/20"
                      @click="removeTech(index)">
                   {{ tech }}
                   <XMarkIcon class="w-3 h-3" />
                </span>
             </div>
           </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-reddit-border bg-[#1A1A1B] flex justify-end gap-2">
           <button @click="$emit('close')" 
                   class="px-4 py-2 rounded-full border border-reddit-border text-reddit-text font-bold text-sm hover:bg-[#272729] transition-colors">
             Cancel
           </button>
           <button @click="handleSubmit" 
                   class="px-4 py-2 rounded-full bg-reddit-text text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                   :disabled="!form.company || !form.project">
             {{ experience ? 'Save Changes' : 'Create' }}
           </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

<script setup>
import {
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline";

defineProps({
  projects: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div
    class="bg-reddit-gray rounded-md border border-reddit-border overflow-hidden mt-4"
  >
    <div
      class="bg-reddit-gray p-3 border-b border-reddit-border flex items-center justify-between"
    >
      <h2 class="text-sm font-bold text-reddit-text uppercase tracking-wide">
        Personal Projects
      </h2>
      <CodeBracketIcon class="w-5 h-5 text-reddit-text-secondary" />
    </div>

    <div class="p-4 space-y-4">
      <div
        v-for="(project, index) in projects"
        :key="index"
        class="group"
        :class="
          project.featured
            ? 'rounded-md border border-reddit-orange/40 bg-reddit-orange/5 p-3'
            : ''
        "
      >
        <a
          :href="project.link"
          target="_blank"
          rel="noopener noreferrer"
          class="block"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center flex-wrap gap-2">
              <h3
                class="text-sm font-bold text-reddit-text group-hover:underline decoration-reddit-text"
              >
                {{ project.name }}
              </h3>
              <span
                v-if="project.featured"
                class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-reddit-orange text-white"
                >Featured</span
              >
              <span
                v-if="project.period"
                class="text-xs text-reddit-text-secondary"
                >{{ project.period }}</span
              >
            </div>
            <ArrowTopRightOnSquareIcon
              class="w-3.5 h-3.5 text-reddit-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            />
          </div>
          <p
            class="text-xs text-reddit-text-secondary mt-1 leading-relaxed whitespace-pre-line"
          >
            {{ project.description }}
          </p>
        </a>

        <div
          v-if="project.techStack?.length"
          class="flex flex-wrap gap-1.5 mt-2"
        >
          <span
            v-for="tech in project.techStack"
            :key="tech"
            class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#272729] text-reddit-text-secondary"
          >
            {{ tech }}
          </span>
        </div>

        <a
          v-if="project.reviewLink"
          :href="project.reviewLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-xs text-reddit-orange hover:underline mt-2"
        >
          소개 페이지
          <ArrowTopRightOnSquareIcon class="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>
</template>

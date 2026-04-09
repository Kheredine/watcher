<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserLibrary } from '@/composables/useUserLibrary'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const { watchlist, watched, liked, history, toggleWatchlist, toggleWatched, toggleLike, addHistory } = useUserLibrary()
const { t } = useI18n()

const activeTab = ref('liked')

const tabs = [
  { id: 'liked',    icon: 'fa-heart',    labelKey: 'myLikes'     },
  { id: 'watchlist',icon: 'fa-bookmark', labelKey: 'myWatchlist' },
  { id: 'watched',  icon: 'fa-check',    labelKey: 'myWatched'   },
  { id: 'history',  icon: 'fa-clock-rotate-left', labelKey: 'myHistory' },
]

const listMap = { liked, watchlist, watched, history }

const goDetail = (item) => {
  router.push({ name: 'detail', params: { type: item.type, id: item.id } })
}

// Import streaming history — simple manual import of title/platform pairs
const showImport = ref(false)
const importText = ref('')

const handleImport = () => {
  const lines = importText.value.split('\n').filter(Boolean)
  lines.forEach(line => {
    const [title, platform] = line.split('|').map(s => s.trim())
    if (title) addHistory({ title, platform: platform || 'Unknown', type: 'movie', id: Date.now() + Math.random() })
  })
  importText.value = ''
  showImport.value = false
  activeTab.value  = 'history'
}
</script>

<template>
  <div class="flex flex-col gap-8 pb-12">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">{{ t.libraryTitle }}</h1>

      <button
        v-if="activeTab === 'history'"
        class="btn-secondary-1 text-sm flex items-center gap-2"
        @click="showImport = !showImport"
      >
        <i class="fa-solid fa-file-import text-xs"></i>
        {{ t.importHistory }}
      </button>
    </div>

    <!-- Import panel -->
    <div v-if="showImport" class="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
      <p class="text-white/60 text-sm">Enter one title per line. Optionally add the platform separated by |</p>
      <p class="text-white/40 text-xs">Example: <code class="bg-white/10 px-1 rounded">Interstellar | Netflix</code></p>
      <textarea
        v-model="importText"
        rows="6"
        class="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-purple-500/60 resize-none"
        placeholder="Interstellar | Netflix&#10;Parasite | Prime Video"
      ></textarea>
      <div class="flex gap-3">
        <button class="btn-secondary-2 text-sm" @click="handleImport">Import</button>
        <button class="btn-secondary-1 text-sm" @click="showImport = false">Cancel</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-white/10 pb-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition"
        :class="activeTab === tab.id ? 'text-white border-b-2 border-purple-500' : 'text-white/40 hover:text-white/70'"
        @click="activeTab = tab.id"
      >
        <i :class="`fa-solid ${tab.icon} text-xs`"></i>
        {{ t[tab.labelKey] }}
        <span class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">{{ listMap[tab.id].length }}</span>
      </button>
    </div>

    <!-- Content -->
    <div>

      <!-- Empty state -->
      <div
        v-if="listMap[activeTab].length === 0"
        class="flex flex-col items-center gap-4 py-20 text-white/30"
      >
        <i class="fa-solid fa-box-open text-4xl"></i>
        <p class="text-sm">{{ t.empty }}</p>
      </div>

      <!-- Grid of items -->
      <div v-else-if="activeTab !== 'history'" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div
          v-for="item in listMap[activeTab]"
          :key="`${item.type}-${item.id}`"
          class="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer bg-white/5 border border-white/10 hover:border-purple-500/40 transition"
          @click="goDetail(item)"
        >
          <!-- Poster -->
          <div class="relative w-full h-48 overflow-hidden bg-[#12121A]">
            <img v-if="item.poster" :src="item.poster" :alt="item.title" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center text-white/20">
              <i class="fa-solid fa-film text-2xl"></i>
            </div>
          </div>

          <!-- Info -->
          <div class="p-3 flex flex-col gap-1">
            <p class="text-white/90 text-xs font-semibold line-clamp-2">{{ item.title }}</p>
            <p class="text-white/40 text-[10px]">{{ item.year }}</p>
          </div>

          <!-- Remove action buttons -->
          <div class="flex border-t border-white/5" @click.stop>
            <button
              v-if="activeTab === 'liked'"
              class="flex-1 py-2 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-1"
              @click="toggleLike(item)"
            >
              <i class="fa-solid fa-heart-crack text-[10px]"></i> Remove
            </button>
            <button
              v-if="activeTab === 'watchlist'"
              class="flex-1 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-1"
              @click="toggleWatchlist(item)"
            >
              <i class="fa-solid fa-bookmark-slash text-[10px]"></i> Remove
            </button>
            <button
              v-if="activeTab === 'watched'"
              class="flex-1 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition flex items-center justify-center gap-1"
              @click="toggleWatched(item)"
            >
              <i class="fa-solid fa-xmark text-[10px]"></i> Unmark
            </button>
          </div>
        </div>
      </div>

      <!-- History list (text-based) -->
      <div v-else class="flex flex-col gap-2">
        <div
          v-for="(entry, i) in history"
          :key="i"
          class="flex items-center gap-4 p-4 rounded-xl bg-white/3 hover:bg-white/5 transition"
        >
          <i class="fa-solid fa-play-circle text-purple-400/60 text-lg flex-shrink-0"></i>
          <div class="flex-1">
            <p class="text-white/80 text-sm font-medium">{{ entry.title }}</p>
            <p v-if="entry.platform" class="text-white/40 text-xs mt-0.5">{{ entry.platform }}</p>
          </div>
          <span v-if="entry.addedAt" class="text-white/30 text-xs flex-shrink-0">
            {{ new Date(entry.addedAt).toLocaleDateString() }}
          </span>
        </div>
      </div>

    </div>

  </div>
</template>

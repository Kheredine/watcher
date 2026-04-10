<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { isPremium, apiFetch } = useAuth()
const router  = useRouter()

const messages  = ref([])
const input     = ref('')
const loading   = ref(false)
const chatEl    = ref(null)

const scrollBottom = async () => {
  await nextTick()
  if (chatEl.value) chatEl.value.scrollTop = chatEl.value.scrollHeight
}

onMounted(async () => {
  if (!isPremium.value) return
  try {
    const data = await apiFetch('/api/chat/oracle/history')
    messages.value = data.messages || []
    await scrollBottom()
  } catch { /* empty history is fine */ }
})

const send = async () => {
  const text = input.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  input.value  = ''
  loading.value = true
  await scrollBottom()

  try {
    const data = await apiFetch('/api/chat/oracle', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    })
    messages.value.push({ role: 'assistant', content: data.reply })
  } catch (err) {
    messages.value.push({ role: 'assistant', content: '⚠️ The Oracle is temporarily unavailable. Try again in a moment.' })
  } finally {
    loading.value = false
    await scrollBottom()
  }
}

const clearHistory = async () => {
  if (!confirm('Clear all chat history with the Oracle?')) return
  try {
    await apiFetch('/api/chat/oracle/history', { method: 'DELETE' })
    messages.value = []
  } catch { /* ignore */ }
}

const onKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="flex flex-col" style="height: calc(100vh - 88px);">

    <!-- ── Premium gate ──────────────────────────────────────────────────── -->
    <div v-if="!isPremium" class="flex flex-col items-center justify-center flex-1 gap-5 text-center px-4">
      <div class="w-20 h-20 rounded-2xl flex items-center justify-center" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);">
        <i class="fa-solid fa-lock text-3xl text-white/30"></i>
      </div>
      <div>
        <h2 class="text-xl font-bold text-white mb-2">Oracle Chat is Premium</h2>
        <p class="text-white/40 text-sm max-w-xs">Have a real conversation with the Oracle — your personal AI entertainment expert and film critic.</p>
      </div>
      <button class="btn-primary" @click="router.push('/plan')">
        <i class="fa-solid fa-crown mr-2"></i>Unlock Premium
      </button>
    </div>

    <!-- ── Chat UI ────────────────────────────────────────────────────────── -->
    <template v-else>

      <!-- Header -->
      <div class="flex items-center justify-between px-1 pb-4 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background: rgba(217,119,6,0.15); border: 1px solid rgba(245,158,11,0.3);">
            <i class="fa-solid fa-eye text-amber-400"></i>
          </div>
          <div>
            <h1 class="font-bold text-white text-lg font-logo">Oracle</h1>
            <p class="text-xs text-amber-400/70">Entertainment expert · Premium</p>
          </div>
        </div>
        <button
          class="text-xs text-white/30 hover:text-red-400 transition flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-500/10"
          @click="clearHistory"
        >
          <i class="fa-solid fa-trash-can text-xs"></i>
          Clear
        </button>
      </div>

      <!-- Messages -->
      <div
        ref="chatEl"
        class="flex-1 overflow-y-auto flex flex-col gap-4 pr-1"
        style="scrollbar-width: thin; scrollbar-color: rgba(217,119,6,0.3) transparent;"
      >
        <!-- Welcome -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
          <i class="fa-solid fa-eye text-4xl text-amber-400/40"></i>
          <p class="text-white/30 text-sm max-w-xs">Ask the Oracle anything — movie recommendations, director deep-dives, hidden gems, or what to watch tonight.</p>
        </div>

        <template v-for="(msg, i) in messages" :key="i">
          <!-- User -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed"
                 style="background: rgba(124,58,237,0.35); border: 1px solid rgba(124,58,237,0.25);">
              {{ msg.content }}
            </div>
          </div>

          <!-- Oracle -->
          <div v-else class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                 style="background: rgba(217,119,6,0.15); border: 1px solid rgba(245,158,11,0.25);">
              <i class="fa-solid fa-eye text-xs text-amber-400"></i>
            </div>
            <div class="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-white/90 leading-relaxed"
                 style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
              {{ msg.content }}
            </div>
          </div>
        </template>

        <!-- Typing indicator -->
        <div v-if="loading" class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
               style="background: rgba(217,119,6,0.15); border: 1px solid rgba(245,158,11,0.25);">
            <i class="fa-solid fa-eye text-xs text-amber-400"></i>
          </div>
          <div class="px-4 py-3 rounded-2xl rounded-tl-sm"
               style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
            <div class="flex gap-1 items-center h-4">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style="animation-delay:0ms"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style="animation-delay:150ms"></div>
              <div class="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style="animation-delay:300ms"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="flex items-end gap-3 pt-4 flex-shrink-0">
        <div class="flex-1 flex items-end rounded-xl border border-white/10 overflow-hidden"
             style="background: rgba(255,255,255,0.05);">
          <textarea
            v-model="input"
            :placeholder="'Ask the Oracle anything…'"
            rows="1"
            @keydown="onKeydown"
            @input="e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }"
            class="flex-1 bg-transparent text-white text-sm px-4 py-3 outline-none resize-none placeholder:text-white/25 leading-relaxed"
            style="max-height: 120px;"
          ></textarea>
        </div>
        <button
          @click="send"
          :disabled="!input.trim() || loading"
          class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition"
          :class="input.trim() && !loading
            ? 'cursor-pointer'
            : 'opacity-40 cursor-not-allowed'"
          style="background: linear-gradient(135deg, #d97706, #f59e0b);"
        >
          <i class="fa-solid fa-paper-plane text-sm" style="color: #0a0615;"></i>
        </button>
      </div>

      <p class="text-center text-white/15 text-xs mt-2">Enter to send · Shift+Enter for new line</p>

    </template>
  </div>
</template>

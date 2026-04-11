<script setup>
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const { user, apiFetch } = useAuth()

const feedbackForm = ref({
  name:     user.value?.username || '',
  category: 'like',
  message:  '',
})
const sending  = ref(false)
const success  = ref(false)
const fbError  = ref('')

const sendFeedback = async () => {
  if (!feedbackForm.value.message.trim() || feedbackForm.value.message.trim().length < 5) {
    fbError.value = 'Please write at least a sentence!'
    return
  }
  sending.value = true
  fbError.value = ''
  try {
    await apiFetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(feedbackForm.value),
    })
    success.value = true
    feedbackForm.value.message = ''
    setTimeout(() => { success.value = false }, 6000)
  } catch (err) {
    fbError.value = err.message || 'Something went wrong. Please try again.'
  } finally {
    sending.value = false
  }
}

const CATEGORIES = [
  { value: 'like',    icon: '❤️',  labelKey: 'feedbackLike'    },
  { value: 'dislike', icon: '👎',  labelKey: 'feedbackDislike' },
  { value: 'improve', icon: '🔧',  labelKey: 'feedbackImprove' },
  { value: 'add',     icon: '✨',  labelKey: 'feedbackAdd'     },
]
</script>

<template>
  <div class="flex flex-col gap-8 pb-12 max-w-2xl">
    <h1 class="text-2xl font-bold text-white">{{ t.helpTitle }}</h1>

    <!-- FAQ -->
    <div class="flex flex-col gap-4">
      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2 flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-purple-400 text-sm"></i>
          How does The Oracle work?
        </h3>
        <p class="text-white/60 text-sm leading-relaxed">Select your mood, submood, available time, content type, and era. The Oracle uses AI to find titles that match your exact emotional state.</p>
      </div>

      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2 flex items-center gap-2">
          <i class="fa-solid fa-brain text-purple-400 text-sm"></i>
          How does the app learn my preferences?
        </h3>
        <p class="text-white/60 text-sm leading-relaxed">Every time you like, add to watchlist, or mark as watched, Tazama remembers your taste. The Discover page uses this to surface personalized recommendations.</p>
      </div>

      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2 flex items-center gap-2">
          <i class="fa-solid fa-tv text-purple-400 text-sm"></i>
          Where does the streaming data come from?
        </h3>
        <p class="text-white/60 text-sm leading-relaxed">Streaming availability is powered by TMDB (The Movie Database). Links go directly to the official platform page.</p>
      </div>

      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2 flex items-center gap-2">
          <i class="fa-solid fa-crown text-amber-400 text-sm"></i>
          What do I get with Premium?
        </h3>
        <p class="text-white/60 text-sm leading-relaxed">Premium unlocks Oracle Chat (AI conversation), My Analytics (viewing habits), and your personalized Watcher Title generated from your taste. Your privacy settings also become fully customizable.</p>
      </div>

      <div class="p-5 rounded-xl bg-white/5 border border-white/10">
        <h3 class="text-white font-semibold mb-2 flex items-center gap-2">
          <i class="fa-solid fa-users text-purple-400 text-sm"></i>
          How does the social / Reel Mates feature work?
        </h3>
        <p class="text-white/60 text-sm leading-relaxed">Search for other users, visit their profile, and click "Join Credits" to follow them. You'll get notifications when they like, save, or watch something new — and they can follow you back.</p>
      </div>
    </div>

    <!-- ── Feedback Form ──────────────────────────────────────────────────── -->
    <div class="rounded-2xl border border-white/8 overflow-hidden" style="background: rgba(124,58,237,0.05);">
      <div class="px-6 pt-6 pb-4 border-b border-white/7">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span class="text-xl">💬</span>{{ t.feedbackTitle }}
        </h2>
        <p class="text-white/40 text-sm mt-1">{{ t.feedbackDesc }}</p>
      </div>

      <div class="p-6 flex flex-col gap-5">

        <!-- Name (optional) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/40 uppercase tracking-wider">{{ t.feedbackYourName }}</label>
          <input
            v-model="feedbackForm.name"
            type="text"
            :placeholder="user?.username || 'Anonymous'"
            class="fb-input"
          />
        </div>

        <!-- Category -->
        <div class="flex flex-col gap-2">
          <label class="text-xs font-semibold text-white/40 uppercase tracking-wider">{{ t.feedbackCategory }}</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="cat in CATEGORIES"
              :key="cat.value"
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-left transition text-sm"
              :class="feedbackForm.category === cat.value
                ? 'border-purple-500/50 bg-purple-500/15 text-white font-medium'
                : 'border-white/8 bg-white/3 text-white/50 hover:text-white/80 hover:border-white/15'"
              @click="feedbackForm.category = cat.value"
            >
              <span>{{ cat.icon }}</span>
              <span>{{ t[cat.labelKey] }}</span>
            </button>
          </div>
        </div>

        <!-- Message -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-white/40 uppercase tracking-wider">{{ t.feedbackMessage }}</label>
          <textarea
            v-model="feedbackForm.message"
            :placeholder="t.feedbackMessagePlaceholder"
            rows="5"
            class="fb-input resize-none"
          ></textarea>
        </div>

        <!-- Error -->
        <div v-if="fbError" class="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <i class="fa-solid fa-circle-exclamation mr-1.5"></i>{{ fbError }}
        </div>

        <!-- Success -->
        <div v-if="success" class="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <i class="fa-solid fa-check mr-1.5"></i>{{ t.feedbackSuccess }}
        </div>

        <!-- Submit -->
        <button
          class="w-full py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
          style="background: linear-gradient(135deg,#5b21b6,#7c3aed); color: white;"
          :disabled="sending || !feedbackForm.message.trim()"
          @click="sendFeedback"
        >
          <i v-if="sending" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-paper-plane text-sm"></i>
          {{ sending ? t.feedbackSending : t.feedbackSend }}
        </button>

        <p class="text-center text-white/20 text-xs">
          Your message goes directly to the Tazama team.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fb-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 12px;
  padding: 12px 15px;
  color: white;
  font-size: 14px;
  width: 100%;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
}
.fb-input::placeholder { color: rgba(255,255,255,0.25); }
.fb-input:focus { border-color: rgba(124,58,237,0.6); }
</style>

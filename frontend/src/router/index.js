import { createRouter, createWebHistory } from 'vue-router'
import TheOracleView from '@/views/TheOracleView.vue'
import DiscoverView  from '@/views/DiscoverView.vue'
import SocialView    from '@/views/SocialView.vue'
import WatchlistView from '@/views/WatchlistView.vue'
import SettingsView  from '@/views/SettingsView.vue'
import HelpView      from '@/views/HelpView.vue'
import DetailView    from '@/views/DetailView.vue'

const routes = [
    { path: '/',                    component: TheOracleView },
    { path: '/discover',            component: DiscoverView  },
    { path: '/social',              component: SocialView    },
    { path: '/watchlist',           component: WatchlistView },
    { path: '/settings',            component: SettingsView  },
    { path: '/help',                component: HelpView      },
    { path: '/detail/:type/:id',    component: DetailView, name: 'detail' },
]

export default createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
})

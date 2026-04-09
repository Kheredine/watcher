import { ref, computed } from 'vue'

const lang = ref(localStorage.getItem('tazama_lang') || 'en')

const translations = {
  en: {
    appName: 'Tazama',
    // Nav
    navOracle: 'The Oracle',
    navDiscover: 'Discover',
    navLibrary: 'My Library',
    navSocial: 'Social',
    navSettings: 'Settings',
    navHelp: 'Help',
    // Oracle
    oracleTitle: 'What do you want to feel tonight?',
    oracleSubtitle: 'Tell the Oracle your mood — it will find something perfect for you.',
    howIFeel: 'How I want to feel',
    subMood: 'More specifically...',
    howMuchTime: 'How much time do I have?',
    contentType: 'What type of content?',
    filterByEra: 'Filter by era (optional)',
    recommendBtn: 'Recommend me something',
    pickBtn: 'Just pick for me!',
    resetBtn: 'Reset options',
    // Recommendations
    recommendationsTitle: 'Your Recommendations',
    noResults: 'No results found. Try different filters.',
    showMore: 'Show me 3 more',
    viewDetails: 'View details',
    loading: 'Finding the perfect match...',
    // Actions
    like: 'Like',
    addWatchlist: 'Watchlist',
    markWatched: 'Watched',
    liked: 'Liked',
    inWatchlist: 'In Watchlist',
    alreadyWatched: 'Watched',
    // Detail
    backBtn: 'Back',
    whereToWatch: 'Where to Watch',
    stream: 'Stream',
    rent: 'Rent',
    buy: 'Buy',
    cast: 'Cast',
    trailer: 'Trailer',
    director: 'Director',
    creator: 'Creator',
    notAvailable: 'Not available in your region',
    // Discovery
    discoverTitle: 'Discover',
    trending: 'Trending Now',
    top10: 'Top 10',
    forYou: 'Recommended for You',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    // Library
    libraryTitle: 'My Library',
    myLikes: 'Liked',
    myWatchlist: 'Watchlist',
    myWatched: 'Already Watched',
    myHistory: 'Streaming History',
    importHistory: 'Import History',
    empty: 'Nothing here yet.',
    // Search
    searchPlaceholder: 'Search titles, people...',
  },
  fr: {
    appName: 'Tazama',
    // Nav
    navOracle: "L'Oracle",
    navDiscover: 'Découvrir',
    navLibrary: 'Ma Bibliothèque',
    navSocial: 'Social',
    navSettings: 'Paramètres',
    navHelp: 'Aide',
    // Oracle
    oracleTitle: 'Que voulez-vous ressentir ce soir?',
    oracleSubtitle: "Dites à l'Oracle votre humeur — il trouvera quelque chose de parfait pour vous.",
    howIFeel: 'Comment je veux me sentir',
    subMood: 'Plus précisément...',
    howMuchTime: "De combien de temps je dispose?",
    contentType: 'Quel type de contenu?',
    filterByEra: 'Filtrer par époque (optionnel)',
    recommendBtn: 'Recommande-moi quelque chose',
    pickBtn: 'Choisis pour moi!',
    resetBtn: 'Réinitialiser',
    // Recommendations
    recommendationsTitle: 'Vos Recommandations',
    noResults: 'Aucun résultat. Essayez d\'autres filtres.',
    showMore: 'Voir 3 autres',
    viewDetails: 'Voir les détails',
    loading: 'Recherche de la correspondance parfaite...',
    // Actions
    like: 'J\'aime',
    addWatchlist: 'À regarder',
    markWatched: 'Vu',
    liked: 'Aimé',
    inWatchlist: 'Dans la liste',
    alreadyWatched: 'Déjà vu',
    // Detail
    backBtn: 'Retour',
    whereToWatch: 'Où regarder',
    stream: 'Streaming',
    rent: 'Louer',
    buy: 'Acheter',
    cast: 'Casting',
    trailer: 'Bande-annonce',
    director: 'Réalisateur',
    creator: 'Créateur',
    notAvailable: 'Non disponible dans votre région',
    // Discovery
    discoverTitle: 'Découvrir',
    trending: 'Tendances du moment',
    top10: 'Top 10',
    forYou: 'Recommandé pour vous',
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    // Library
    libraryTitle: 'Ma Bibliothèque',
    myLikes: 'Aimés',
    myWatchlist: 'À regarder',
    myWatched: 'Déjà vus',
    myHistory: 'Historique de streaming',
    importHistory: "Importer l'historique",
    empty: 'Rien ici pour l\'instant.',
    // Search
    searchPlaceholder: 'Rechercher titres, personnes...',
  },
}

export function useI18n() {
  const t = computed(() => translations[lang.value] || translations.en)

  const setLang = (l) => {
    lang.value = l
    localStorage.setItem('tazama_lang', l)
  }

  const toggleLang = () => setLang(lang.value === 'en' ? 'fr' : 'en')

  return { lang, t, setLang, toggleLang }
}

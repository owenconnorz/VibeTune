export const translations = {
  en: {
    // Navigation
    home: "Home",
    search: "Search",
    movies: "Movies",
    library: "Library",
    history: "History",

    // Headers
    discover: "Discover",
    searchMusic: "Search Music",
    yourLibrary: "Your Library",
    listeningHistory: "Listening History",

    // Actions
    playAll: "Play All",
    shuffle: "Shuffle",
    refresh: "Refresh",
    viewAll: "View All",
    addToPlaylist: "Add to Playlist",
    share: "Share",
    goToArtist: "Go to Artist",

    // Player
    nowPlaying: "Now Playing",
    queue: "Queue",
    lyrics: "Lyrics",

    // Categories
    quickPicks: "Quick picks",
    trendingNow: "Trending Now",
    chillVibes: "Chill Vibes",
    workoutMix: "Workout Mix",
    feelGood: "Feel Good",
    popularMusic: "Popular Music",

    // Settings
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    about: "About",

    // Messages
    noResults: "No results found",
    loading: "Loading...",
    error: "Something went wrong",
    tryAgain: "Try again",
  },
  es: {
    // Navigation
    home: "Inicio",
    search: "Buscar",
    movies: "Películas",
    library: "Biblioteca",
    history: "Historial",

    // Headers
    discover: "Descubrir",
    searchMusic: "Buscar Música",
    yourLibrary: "Tu Biblioteca",
    listeningHistory: "Historial de Reproducción",

    // Actions
    playAll: "Reproducir Todo",
    shuffle: "Aleatorio",
    refresh: "Actualizar",
    viewAll: "Ver Todo",
    addToPlaylist: "Añadir a Lista",
    share: "Compartir",
    goToArtist: "Ir al Artista",

    // Player
    nowPlaying: "Reproduciendo",
    queue: "Cola",
    lyrics: "Letras",

    // Categories
    quickPicks: "Selecciones rápidas",
    trendingNow: "Tendencias",
    chillVibes: "Vibras Relajadas",
    workoutMix: "Mix de Ejercicio",
    feelGood: "Sentirse Bien",
    popularMusic: "Música Popular",

    // Settings
    settings: "Configuración",
    language: "Idioma",
    theme: "Tema",
    about: "Acerca de",

    // Messages
    noResults: "No se encontraron resultados",
    loading: "Cargando...",
    error: "Algo salió mal",
    tryAgain: "Intentar de nuevo",
  },
  ko: {
    // Navigation
    home: "홈",
    search: "검색",
    movies: "영화",
    library: "보관함",
    history: "기록",

    // Headers
    discover: "발견",
    searchMusic: "음악 검색",
    yourLibrary: "내 보관함",
    listeningHistory: "재생 기록",

    // Actions
    playAll: "모두 재생",
    shuffle: "셔플",
    refresh: "새로고침",
    viewAll: "모두 보기",
    addToPlaylist: "재생목록에 추가",
    share: "공유",
    goToArtist: "아티스트로 이동",

    // Player
    nowPlaying: "재생 중",
    queue: "대기열",
    lyrics: "가사",

    // Categories
    quickPicks: "빠른 선택",
    trendingNow: "인기 급상승",
    chillVibes: "편안한 분위기",
    workoutMix: "운동 믹스",
    feelGood: "기분 좋은",
    popularMusic: "인기 음악",

    // Settings
    settings: "설정",
    language: "언어",
    theme: "테마",
    about: "정보",

    // Messages
    noResults: "결과 없음",
    loading: "로딩 중...",
    error: "오류가 발생했습니다",
    tryAgain: "다시 시도",
  },
  ja: {
    // Navigation
    home: "ホーム",
    search: "検索",
    movies: "映画",
    library: "ライブラリ",
    history: "履歴",

    // Headers
    discover: "発見",
    searchMusic: "音楽を検索",
    yourLibrary: "マイライブラリ",
    listeningHistory: "再生履歴",

    // Actions
    playAll: "すべて再生",
    shuffle: "シャッフル",
    refresh: "更新",
    viewAll: "すべて表示",
    addToPlaylist: "プレイリストに追加",
    share: "共有",
    goToArtist: "アーティストへ",

    // Player
    nowPlaying: "再生中",
    queue: "キュー",
    lyrics: "歌詞",

    // Categories
    quickPicks: "クイックピック",
    trendingNow: "トレンド",
    chillVibes: "チルバイブス",
    workoutMix: "ワークアウトミックス",
    feelGood: "フィールグッド",
    popularMusic: "人気の音楽",

    // Settings
    settings: "設定",
    language: "言語",
    theme: "テーマ",
    about: "について",

    // Messages
    noResults: "結果が見つかりません",
    loading: "読み込み中...",
    error: "エラーが発生しました",
    tryAgain: "再試行",
  },
  zh: {
    // Navigation
    home: "主页",
    search: "搜索",
    movies: "电影",
    library: "资料库",
    history: "历史",

    // Headers
    discover: "发现",
    searchMusic: "搜索音乐",
    yourLibrary: "我的资料库",
    listeningHistory: "播放历史",

    // Actions
    playAll: "播放全部",
    shuffle: "随机播放",
    refresh: "刷新",
    viewAll: "查看全部",
    addToPlaylist: "添加到播放列表",
    share: "分享",
    goToArtist: "前往艺术家",

    // Player
    nowPlaying: "正在播放",
    queue: "队列",
    lyrics: "歌词",

    // Categories
    quickPicks: "快速精选",
    trendingNow: "热门趋势",
    chillVibes: "轻松氛围",
    workoutMix: "健身混音",
    feelGood: "感觉良好",
    popularMusic: "流行音乐",

    // Settings
    settings: "设置",
    language: "语言",
    theme: "主题",
    about: "关于",

    // Messages
    noResults: "未找到结果",
    loading: "加载中...",
    error: "出错了",
    tryAgain: "重试",
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en

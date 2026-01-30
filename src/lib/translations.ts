export type Language = 'en' | 'es' | 'fr' | 'ja' | 'zh' | 'pt';

export type TranslationKey =
    | 'nav.home'
    | 'nav.matchLobby'
    | 'nav.leaderboards'
    | 'nav.gameInsights'
    | 'nav.wallet'
    | 'nav.profile'
    | 'nav.admin'
    | 'user.balance'
    | 'common.loading';

export const translations: Record<Language, Record<TranslationKey, string>> = {
    en: {
        'nav.home': 'Home',
        'nav.matchLobby': 'Match Lobby',
        'nav.leaderboards': 'Leaderboards',
        'nav.gameInsights': 'Game Insights',
        'nav.wallet': 'Wallet',
        'nav.profile': 'Profile',
        'nav.admin': 'Admin',
        'user.balance': 'Balance',
        'common.loading': 'Loading...',
    },
    es: {
        'nav.home': 'Inicio',
        'nav.matchLobby': 'Sala de Partidas',
        'nav.leaderboards': 'Clasificación',
        'nav.gameInsights': 'Estadísticas',
        'nav.wallet': 'Billetera',
        'nav.profile': 'Perfil',
        'nav.admin': 'Admin',
        'user.balance': 'Saldo',
        'common.loading': 'Cargando...',
    },
    fr: {
        'nav.home': 'Accueil',
        'nav.matchLobby': 'Salon de Match',
        'nav.leaderboards': 'Classements',
        'nav.gameInsights': 'Aperçus de Jeu',
        'nav.wallet': 'Portefeuille',
        'nav.profile': 'Profil',
        'nav.admin': 'Admin',
        'user.balance': 'Solde',
        'common.loading': 'Chargement...',
    },
    ja: {
        'nav.home': 'ホーム',
        'nav.matchLobby': 'マッチロビー',
        'nav.leaderboards': 'ランキング',
        'nav.gameInsights': 'ゲーム分析',
        'nav.wallet': 'ウォレット',
        'nav.profile': 'プロフィール',
        'nav.admin': '管理',
        'user.balance': '残高',
        'common.loading': '読み込み中...',
    },
    zh: {
        'nav.home': '首页',
        'nav.matchLobby': '比赛大厅',
        'nav.leaderboards': '排行榜',
        'nav.gameInsights': '游戏洞察',
        'nav.wallet': '钱包',
        'nav.profile': '个人资料',
        'nav.admin': '管理',
        'user.balance': '余额',
        'common.loading': '加载中...',
    },
    pt: {
        'nav.home': 'Início',
        'nav.matchLobby': 'Lobby de Partidas',
        'nav.leaderboards': 'Classificação',
        'nav.gameInsights': 'Insights de Jogo',
        'nav.wallet': 'Carteira',
        'nav.profile': 'Perfil',
        'nav.admin': 'Admin',
        'user.balance': 'Saldo',
        'common.loading': 'Carregando...',
    }
};

export const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ja: '日本語',
    zh: '中文',
    pt: 'Português',
};

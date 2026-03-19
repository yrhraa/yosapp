# Yosapp — よさこい練習アプリ

フォーメーション作成・8カウント練習・音楽ループ・持ち物チェックを一つにまとめた PWA アプリです。

## セットアップ

```bash
npm install
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド (dist/ に出力)
npm run preview    # ビルド結果をローカルでプレビュー
```

## Cloudflare Pages デプロイ

| 項目 | 値 |
|---|---|
| ビルドコマンド | `npm run build` |
| 出力ディレクトリ | `dist` |
| Node.js バージョン | `20` |

GitHub リポジトリと連携すると push ごとに自動デプロイされます。

## PWA 対応

### ホーム画面に追加

**Android (Chrome)**
1. アプリを開く
2. 画面下部に「ホーム画面に追加」バナーが表示される
3. 「追加」をタップ

**iOS (Safari)**
1. Safari でアプリを開く
2. 画面右下の「アプリとして追加」ボタンをタップ
3. 表示されたガイドに従って「共有 → ホーム画面に追加」

### オフライン動作

Service Worker (Workbox) が以下をキャッシュします：

| 対象 | キャッシュ戦略 | 保持期間 |
|---|---|---|
| アプリ本体 (JS/CSS/HTML) | Precache (インストール時) | 永続 |
| Google Fonts | CacheFirst | 1年 |
| アイコン | CacheFirst | 30日 |
| その他アセット | StaleWhileRevalidate | 30日 |

LocalStorage に保存されているデータ（フォーメーション・チェックリスト・設定）はオフラインでも完全に機能します。

音楽ファイルはメモリ上のみで保持するため、再起動後は再読み込みが必要です。

### PWA アーキテクチャ

```
src/
├── hooks/usePWA.ts              # インストール・更新・オフライン検知
├── components/pwa/PWABanners.tsx # UI (バナー・ガイド・トースト)
├── vite-pwa.d.ts                # 仮想モジュール型定義
└── main.tsx                     # SW 登録 (registerSW)

public/
├── icons/                       # アイコン各サイズ
│   ├── icon.svg                 # ファビコン
│   ├── icon-192.png             # Android
│   ├── icon-512.png             # Android (大)
│   ├── icon-maskable.svg        # Maskable (Android adaptive icon)
│   ├── apple-touch-icon-180.png # iPhone
│   ├── apple-touch-icon-152.png # iPad Retina
│   └── apple-touch-icon-120.png # iPhone (旧)
├── _redirects                   # Cloudflare Pages SPA ルーティング
└── _headers                     # Cloudflare Pages キャッシュヘッダー
```

## フォルダ構成

```
src/
├── pages/
│   ├── Formation.tsx   # フォーメーション (PC フル / SP 簡易)
│   ├── Count.tsx       # 8カウントメトロノーム
│   ├── Music.tsx       # 音楽練習プレイヤー
│   └── Checklist.tsx   # 持ち物チェックリスト
├── components/
│   ├── formation/      # フォーメーション関連コンポーネント
│   ├── music/          # 音楽プレイヤー関連
│   ├── layout/         # Sidebar / BottomNav
│   └── pwa/            # PWA バナー・ガイド
├── store/
│   ├── formationStore.ts
│   └── checklistStore.ts
├── hooks/
│   ├── useMetronome.ts
│   ├── useAudioPlayer.ts
│   ├── useIsMobile.ts
│   └── usePWA.ts
└── types/index.ts
```

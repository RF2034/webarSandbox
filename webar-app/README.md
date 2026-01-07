# WebAR App

Three.jsとWebXR APIを使用したシンプルなWebARアプリケーション

## 技術スタック

- Next.js 16 (App Router)
- TypeScript
- Three.js
- WebXR Device API
- Tailwind CSS

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# 別のターミナルでngrokを起動（HTTPS化）
ngrok http 3000
```

## スマホでの動作確認方法

### 前提条件

WebXR ARは以下の環境が必要です:

- **Android**: Chrome 79以降（ARCore対応デバイス）
- **iOS**: Safari（iOS 13以降、WebXR未対応の場合あり）

### ローカル開発環境でのテスト

1. **PCで開発サーバーを起動**
   ```bash
   pnpm dev
   ```

2. **PCとスマホを同じWi-Fiネットワークに接続**

3. **PCのIPアドレスを確認**
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

4. **HTTPS化が必要**

   WebXRはHTTPS環境でのみ動作します。以下のいずれかの方法を使用:

   #### 方法A: ngrokを使用（推奨）
   ```bash
   # ngrokをインストール
   npm install -g ngrok

   # 開発サーバー起動後、別ターミナルで
   ngrok http 3000
   ```

   表示されたHTTPS URLをスマホのブラウザで開く

   #### 方法B: localtunnelを使用
   ```bash
   npm install -g localtunnel
   lt --port 3000
   ```

   #### 方法C: Vercelにデプロイ
   ```bash
   # Vercelにデプロイ（本番環境）
   pnpm build
   vercel
   ```

5. **スマホでアクセス**
   - ngrokまたはlocaltunnelで取得したHTTPS URLにアクセス
   - 「ARを開始」ボタンをタップ
   - カメラへのアクセス許可を承認

## 機能

- WebXR AR対応チェック
- 3Dキューブの空間配置
- リアルタイムアニメーション（回転）

## トラブルシューティング

### 「WebXRに対応していません」と表示される

- ARCore対応デバイスか確認
- Chrome（Android）またはSafari（iOS）を使用しているか確認
- HTTPSでアクセスしているか確認

### カメラが起動しない

- ブラウザのカメラ権限を確認
- HTTPSでアクセスしているか確認

### ARが起動しない

- デバイスがARCore/ARKitに対応しているか確認
- ブラウザを最新版にアップデート

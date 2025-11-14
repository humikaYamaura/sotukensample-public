// ===============================================
// 1. 環境変数の読み込み
//    - `.env` ファイルに記述された環境変数 (例: GEMINI_API_KEY) を
//      `process.env` オブジェクトにロードします。
//    - これにより、APIキーなどの機密情報をコードに直接記述せず、
//      安全に管理できます。
// ===============================================
require('dotenv').config(); // 必ずファイルの先頭で呼び出す必要があります

// ===============================================
// 2. 必要なモジュールのインポート
//    - Node.js でWebサーバーを構築するために必要なライブラリを読み込みます。
// ===============================================
const express = require('express');             // Express.jsフレームワーク (Webサーバー構築用)
const cors = require('cors');                   // CORS (Cross-Origin Resource Sharing) ミドルウェア
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Google Gemini API公式SDK

// ===============================================
// 3. Expressアプリケーションの初期化
//    - Webサーバーを作成するためのExpressアプリケーションインスタンスを生成します。
// ===============================================
const app = express();
// サーバーがリッスンするポート番号を定義。
// 環境変数 `PORT` が設定されていればそれを使用し、なければデフォルトで3000番ポートを使用します。
const port = process.env.PORT || 3000;

// ===============================================
// 4. CORS (Cross-Origin Resource Sharing) 設定
//    - 異なるオリジン（ドメイン、プロトコル、ポート）からのリクエストを許可するための設定です。
//    - フロントエンドとバックエンドが異なるポートやドメインで動作する場合に必須です。
// ===============================================
const corsOptions = {
  // 許可するオリジン（フロントエンドのURL）を指定
  // 開発環境ではVS CodeのLive Serverがよく使うポート番号を指定します。
  // 本番環境では、公開するフロントエンドのドメイン（例: "https://your-frontend.com"）を指定します。
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  // 許可するHTTPメソッド
  methods: ["GET", "POST"],
  // 許可するヘッダー
  allowedHeaders: ["Content-Type"],
  // Cookieや認証情報（もし使用する場合）の送信を許可
  credentials: true
};

// ===============================================
// 5. ミドルウェアの適用
//    - 全てのリクエストに対してCORSとJSONボディのパースを適用します。
// ===============================================
app.use(cors(corsOptions));        // CORSミドルウェアを適用
app.use(express.json());          // リクエストボディがJSON形式の場合、JavaScriptオブジェクトにパースします。

// ===============================================
// 6. Gemini APIクライアントの初期化
//    - GoogleGenerativeAIクラスを使用して、Gemini APIと通信するためのクライアントを作成します。
//    - APIキーは環境変数 `GEMINI_API_KEY` から安全に取得します。
// ===============================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// 使用するGeminiモデルを指定して、Generative Modelインスタンスを取得します。
// モデル名はGoogleの提供する最新のものを確認してください。
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===============================================
// 7. '/generate' エンドポイントの定義 (POSTリクエスト)
//    - フロントエンドからのコンテンツ生成リクエストを受け付けるルートです。
// ===============================================
app.post('/generate', async (req, res) => {
  try {
    // フロントエンドから送られてきたリクエストボディから `userQuery` と `toneInstruction` を抽出
    const { userQuery, toneInstruction } = req.body;

    // `userQuery` (質問内容) が空でないかチェック
    if (!userQuery) {
      // 空の場合、400 Bad Request エラーを返す
      return res.status(400).json({ error: 'userQuery (質問内容) は必須です。' });
    }

    // ユーザーの質問と口調の指示を組み合わせて、Geminiに送る最終的なプロンプトを作成
    const finalPrompt = `以下の質問に答えてください。\n\n指示: ${toneInstruction}\n\n質問: ${userQuery}`;

    // Gemini APIを呼び出し、コンテンツを生成
    // `model.generateContent()` はPromiseを返すため、`await` で完了を待ちます。
    const result = await model.generateContent(finalPrompt);
    // 応答オブジェクトから生成されたテキスト部分を抽出
    const text = result.response.text();

    // 生成されたテキストをJSON形式でフロントエンドに返す
    res.json({ generatedText: text });

  } catch (error) {
    // ===============================================
    // エラーハンドリング
    //    - Gemini APIの呼び出し中にエラーが発生した場合の処理
    // ===============================================
    console.error("Gemini API呼び出し中にエラー:", error);

    // Gemini APIが過負荷の場合 (HTTPステータス503) は、特別なメッセージを返す
    // `error.status` はGoogleGenerativeAI SDKのエラーオブジェクトに含まれる可能性があります。
    // (axiosを使用していた前回のコードとはエラーオブジェクトの構造が異なる点に注意)
    if (error.status === 503) {
      res.status(503).json({ error: 'サービスが混雑中です。時間を置いて再試行してください。' });
    } else {
      // その他のエラーの場合は、一般的な500 Internal Server Errorを返す
      res.status(500).json({ error: 'コンテンツ生成に失敗しました。', details: error.message });
    }
  }
});

// ===============================================
// 8. サーバーの起動
//    - Expressアプリケーションを指定されたポートでリッスンさせ、サーバーを起動します。
// ===============================================
app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});
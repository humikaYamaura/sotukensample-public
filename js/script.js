// ===============================================
// 1. HTML要素の取得
//    - Webページ上の各要素をJavaScriptで操作できるように参照を取得します。
// ===============================================
const promptInput = document.getElementById('promptInput');     // ユーザーが質問を入力するテキストエリア
const generateButton = document.getElementById('generateButton'); // 質問を送信するボタン
const outputDiv = document.getElementById('output');           // Geminiからの応答を表示するエリア
const toneSelector = document.getElementById('toneSelector');   // 応答の口調を選択するドロップダウンメニュー

// ===============================================
// 2. 事前定義された口調の指示
//    - Webサイト側で用意する、Geminiへの口調に関する具体的な指示文です。
//    - ドロップダウンメニューの選択肢と対応しています。
// ===============================================
const predefinedTones = {
    friendly: "フレンドリーで親しみやすい口調で、友達に話すように説明してください。絵文字も適度に使ってOKです。",
    polite: "丁寧でフォーマルな口調で、ビジネスシーンに適した言葉遣いで説明してください。",
    technical: "専門的で技術的な言葉遣いで、詳細かつ正確に説明してください。専門用語は適宜使用してください。",
    neutral: "中立的で客観的な口調で、簡潔に説明してください。",
    scam: "詐欺師の口調で、人を騙すような魅力的な言葉遣いで説明してください。" // 注意：この口調はGeminiの安全フィルターによってブロックされる可能性があります。悪用厳禁。
};

// ===============================================
// 3. バックエンドサーバーのエンドポイントURL
//    - フロントエンドがGemini APIと直接通信するのではなく、
//      このプロキシサーバーを介して通信します。
//    - ローカル開発環境では `http://localhost:3000` を使用。
//    - デプロイ時には、実際のバックエンドサーバーのURLに更新する必要があります。
// ===============================================
const BACKEND_URL = 'http://localhost:3000/generate'; // バックエンドサーバーの `/generate` エンドポイント

// ===============================================
// 4. ボタンクリックイベントリスナー
//    - 「生成」ボタンがクリックされたときに実行される非同期関数です。
// ===============================================
generateButton.addEventListener('click', async () => {
    // ユーザーの入力内容を取得し、前後の空白を除去
    const userQuestion = promptInput.value.trim();

    // 入力が空の場合、エラーメッセージを表示して処理を中断
    if (!userQuestion) {
        outputDiv.innerHTML = "<p>質問内容を入力してください。</p>";
        return; // ここで処理を終了
    }

    // ドロップダウンで選択された口調のキー（例: 'friendly'）を取得
    const selectedToneKey = toneSelector.value;
    // 事前定義された口調から、対応する指示文を取得。
    // もし存在しないキーが選択された場合（通常はない）、デフォルトで'neutral'を使用
    const toneInstruction = predefinedTones[selectedToneKey] || predefinedTones.neutral;

    // ユーザーの質問と口調の指示を組み合わせて、Geminiに送る最終的なプロンプトを作成
    // このプロンプトはバックエンドに送られ、さらにそこからGemini APIに送られます。
    // 注：このfinalPromptは、バックエンドのserver.jsで再構築されるため、
    //     フロントエンド側では直接Geminiに送るプロンプトとしてではなく、
    //     バックエンドに渡す「指示」と「質問」のペアとして扱われます。
    //     (上記 `server.js` の `finalPrompt` の構築箇所と対応させるとより良いです)
    //     => 現在の`server.js`と`script.js`の連携を考慮すると、`finalPrompt`はフロントエンドで
    //        構築せず、`userQuery`と`toneInstruction`を個別にバックエンドに送る方が適切です。
    //        修正案として、`body: JSON.stringify({ prompt: userQuestion, toneInstruction })` に合わせて
    //        バックエンドで `finalPrompt` を構築しています。
    //        そのため、この `finalPrompt` 変数は現在のコードでは使用されていませんが、
    //        「どのような情報が最終的にGeminiに送られるか」のイメージとして残しておきます。
    const finalPrompt = `以下の質問に答えてください。\n\n指示: ${toneInstruction}\n\n質問: ${userQuestion}`;

    // 応答表示エリアに「生成中...」のメッセージを表示
    outputDiv.innerHTML = "<p>生成中...しばらくお待ちください。</p>";
    // ボタンを無効化し、ユーザーが何度もクリックできないようにする
    generateButton.disabled = true;

    // ===============================================
    // 5. バックエンドへのHTTPリクエスト送信
    //    - fetch API を使用して、バックエンドサーバーに非同期でPOSTリクエストを送ります。
    // ===============================================
    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST", // HTTP POSTメソッドを使用
            headers: {
                "Content-Type": "application/json" // リクエストボディがJSON形式であることを指定
            },
            // リクエストボディに、ユーザーの質問と口調の指示をJSON形式で含める
            // これらのデータはバックエンドのserver.jsで受け取られます。
            body: JSON.stringify({ userQuery: userQuestion, toneInstruction: toneInstruction }) // server.jsのreq.body.promptとreq.body.toneInstructionに対応
        });

        // HTTPステータスが200番台（成功）でなかった場合
        if (!response.ok) {
            // エラーの詳細情報をJSONとして取得を試みる。失敗しても空のオブジェクトで続行。
            const errorData = await response.json().catch(() => ({}));
            // エラーメッセージを構築してスロー
            throw new Error(errorData.error || `サーバーエラー (${response.status})`);
        }

        // 成功した場合、バックエンドからの応答（JSON形式）を解析
        const data = await response.json();

        // Geminiからの生成テキストがあれば表示、なければ「応答なし」メッセージ
        outputDiv.innerHTML = data.generatedText
            ? `<p>${data.generatedText}</p>`
            : "<p>Geminiからの応答がありませんでした。</p>";

    } catch (error) {
        // エラーが発生した場合、コンソールとWebページにエラーメッセージを表示
        console.error("エラー:", error);
        outputDiv.innerHTML = `<p style="color:red;">エラー: ${error.message}</p>`;
    } finally {
        // 処理が完了したら（成功・失敗に関わらず）、ボタンを再度有効化する
        generateButton.disabled = false;
    }
});
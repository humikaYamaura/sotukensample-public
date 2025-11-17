require("dotenv").config();
const express = require("express");
const {GoogleGenAI} = require("@Google/genai");
const cors = require("cors");
const { message } = require("statuses");

const app = express();
const port = 3001

const ai = new GoogleGenAI({});

const chatSessions = {};

app.use(express.json());
app.use(cors({origin: ["http://localhost:5500","http://127.0.0.1:5500"]}));

async function initialize() {
    const {v4: uuidv4} = await import("uuid");

    //チャットを開始するメソッド(チャット履歴の保存に必要)
    app.get('/start', (req, res) => {
        const sessionId = uuidv4();

        const chat = ai.chats.create({
            model: "gemini-2.5-flash"
        });
        //セッションID・チャットの紐付け
        chatSessions[sessionId] = chat;
        console.log("チャットセッション開始:" + sessionId);

        res.json({sessionId: sessionId});
    })
}
initialize();

//プロンプトを受け付けるメソッド
app.post("/send", async (req,res) => {
    const {sessionId, prompt} = req.body;

    if(!sessionId || !prompt){
        return res.status(400).json({error:"チャットが作成されていないか、入力されたテキストがありません"});
    }
    //セッションIDからチャット取得
    const chat = chatSessions[sessionId];

    if(!chat){
        return res.status(404).json({error:"セッションが見つかりません"});
    }

    try{
        //メッセージ送信
        const response = await chat.sendMessage({
            message:prompt
        })
        res.json({result: response.text});
    }catch(error){
        console.log("生成エラー：", error.message);
        res.status(500).json({error: "生成中にエラーが発生しました"})
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://loalhost:${port}`);
});
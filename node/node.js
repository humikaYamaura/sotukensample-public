require("dotenv").config();
const express = require("express");
const {GoogleGenAI} = require("@google/genai");
const cors = require("cors");
const { message } = require("statuses");

const app = express();
const port = 3001

const ai = new GoogleGenAI({});

//セッションの有効期限(30分)
const session_timeout = 30 * 60 * 1000;
const chatSessions = {};

const rateLimit = require("express-rate-limit");

app.use(express.json());
//AWSにデプロイしたら、この設定を変えること
app.use(cors({origin: ["http://localhost:5500","http://127.0.0.1:5500"]}));

async function initialize() {
    const {v4: uuidv4} = await import("uuid");

    //F5連打対策。同一IPからのチャット開始は1分間に15回まで
    const apiLimiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 15,
        standardHeaders:true,
        message: "Too many requests.Please try again later.",
    })
    app.use("/start", apiLimiter);
    app.set('trust proxy', 1);

    //チャットを開始するメソッド(チャット履歴の保存に必要)
    app.get('/start', (req, res) => {
        const sessionId = uuidv4();

        const chat = ai.chats.create({
            model: "gemini-2.5-flash"
        });
        //セッションID・チャットの紐付け
        chatSessions[sessionId] = {
            chat: chat,
            timerId: null
        };
        resetSession(sessionId);
        console.log(req.ip +"チャットセッション開始:" + sessionId);

        res.json({sessionId: sessionId});
    })
}
initialize();

//セッションをメモリから削除する
const cleanUpSession = function(sessionId){
    const sessionData = chatSessions[sessionId];
    if(sessionData){
        clearTimeout(sessionData.timerId);
        delete chatSessions[sessionId];
        console.log("セッション削除:" + sessionId);
    }
}

//セッションの有効期限を初期化する
const resetSession = function(sessionId){
    const sessionData = chatSessions[sessionId];
    if(!sessionData){
        return;
    }
    console.log("セッション有効期限初期化:" + sessionId);
    //既存のタイマー削除
    if(sessionData.timerId){
        clearTimeout(sessionData.timerId);
    }
    //有効期限経過後にセッション削除
    const newTimerId = setTimeout(() => {
        cleanUpSession(sessionId);
    },session_timeout);

    sessionData.timerId = newTimerId;
}

//プロンプトを受け付けるメソッド
app.post("/send", async (req,res) => {
    const {sessionId, prompt} = req.body;

    if(!sessionId || !prompt){
        return res.status(400).json({error:"セッションが見つかりません。"});
    }

    //セッションIDからチャット取得
    const sessionData = chatSessions[sessionId];
    if(!sessionData){
        return res.status(400).json({error: "セッションの有効期限切れです。"})
    }
    const chat = sessionData.chat;

    //セッション延長
    resetSession(sessionId);

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

//セッション削除を受け付けるメソッド
app.post("/delete", async(req,res) => {
    const sessionId = req.body.sessionId;
    if(sessionId){
        cleanUpSession(sessionId);
    }
    res.status(200).send({});
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
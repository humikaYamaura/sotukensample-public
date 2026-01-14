require("dotenv").config();
const express = require("express");
const path = require("path");
const {GoogleGenAI} = require("@google/genai");
const cors = require("cors");
const { message } = require("statuses");

const app = express();
const port = process.env.PORT || 3001

app.use(cors({
origin: "[http://127.0.0.1:5500](http://127.0.0.1:5500/)",
credentials: true
}));
app.use(cors({ origin: 'https://tokusyusagi-simulator.onrender.com' }));

const ai = new GoogleGenAI({});
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.GEMINI_API_KEY;
if (MOCK_MODE) {
    console.warn('Mock mode enabled for chat responses (no Gemini API calls will be made)');
}

//セッションの有効期限(30分)
const session_timeout = 30 * 60 * 1000;
const chatSessions = {};

const rateLimit = require("express-rate-limit");

app.use(express.json());
// Add static serving of the repo root so the frontend can be served from the backend
app.use(express.static(path.join(__dirname, '..')));
// AWSにデプロイしたら、この設定を変えること
app.use(cors({origin: ["http://localhost:5501","http://127.0.0.1:5501","https://tokushusagi-simulation.onrender.com"]}));

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

        let chat;
        if (!MOCK_MODE) {
            chat = ai.chats.create({ model: "gemini-2.5-flash" });
        } else {
            // Create a mock chat object compatible with the real API
            chat = {
                sendMessage: async ({ message }) => ({ text: `(モック応答) 受け取った質問: ${message}` })
            };
        }
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
        // If mock mode, the chat.sendMessage returns { text }
        const response = await chat.sendMessage({ message: prompt });
        const resultText = response?.text || response?.result || "";
        res.json({ result: resultText });
    }catch(error){
        console.log("生成エラー：", error.message || error);
        if (error?.status === 429 || error?.error?.code === 429) {
            // Rate-limited, forward the retry-after info if available
            const retry = error?.error?.details?.find(d => d['@type'] && d['@type'].includes('RetryInfo'))?.retryDelay || null;
            return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: retry });
        }
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

// If root (/) is requested, serve the index.html from the project root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});
/*
// ① Supabase をブラウザで使う正しい方法（CDN 版）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ② 自分の Supabase 情報を入れる
const supabaseUrl = "https://nonjuyhzowdhcmrnocww.supabase.co";          // ★あなたのURL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmp1eWh6b3dkaGNtcm5vY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzkwMTgsImV4cCI6MjA4MDExNTAxOH0.u6HRa_feby48aZg4zjZWUUWCizXEgyRj1b3OliOwglM";    // ★あなたのAnonキー

// ③ Supabase クライアント作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Supabaseで登録したテーブル名
const TABLE_NAME = 'prompts';

const type_prompt = new Map();

export const getList = async () => {
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select("type, content");

    if (error) throw new Error(error.message);

    console.log("Supabase 取得データ:", data);

    // Map に変換して返すだけ
    return new Map(data.map(row => [row.type, row.content]));

  } catch (error) {
    alert("プロンプトの読み込みに失敗しました：" + error);
    location.href = "index.html";
  }
};

*/
//セッションID
let sessionId = "";

//詐欺種類
const type = sessionStorage.getItem("type");
if(sessionStorage.getItem("mode")=="test"){
    document.getElementById("type-caption").innerHTML = sessionStorage.getItem("test_name") + "(テスト)";
}else{
    document.getElementById("type-caption").innerHTML = type;
}

//入力欄の設定
const textarea = document.getElementById('textarea');
const inputTextarea = document.getElementById('textarea');
const chatBox = document.getElementById('scroll');

//セッション削除
const session_del = async function(id){
    try{
        const response = await fetch("http://localhost:3001/delete",{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                sessionId: id,
            })
        });
        if(!response.ok){
            throw new Error("セッション削除に失敗しました");
        }
    }catch(error){
        console.log("セッション削除に失敗しましたが、30分後に自動削除されます。"+ error);
    }
    console.log("セッションを削除しました。");
};

//前回のセッションIDを削除
//これで多分F5連打によるセッションパンク対策になる
if(localStorage.getItem("sessionID")){
    session_del(localStorage.getItem("sessionID"));
}

//読み上げ機能
const voice_select = document.getElementById("voice-select");
const speed_select = document.getElementById("speed-select");
//音声リストに音声を追加(利用するブラウザによって取得できる音声は異なる)
const appendVoices = function(){
    //日本語のみ追加
    const voice = speechSynthesis.getVoices().filter((v) => v.lang === 'ja-JP');
    //選択肢を初期化
    voice_select.innerHTML = "";
    const none_option = document.createElement("option");
    none_option.value = "なし";
    none_option.innerText = "なし";
    voice_select.appendChild(none_option);

    voice.forEach((v) => {
        const option = document.createElement("option");
        option.value = v.name;
        option.innerText = v.name;
        voice_select.appendChild(option);
    });
}
appendVoices();

speechSynthesis.onvoiceschanged = e => {
    appendVoices();
}

const speak = function(text){
    const uttr = new SpeechSynthesisUtterance(text);
    if(voice_select.value == "なし"){
        return;
    }
    console.log(text);
    uttr.voice = speechSynthesis.getVoices().filter((v) => v.name === voice_select.value)[0];
    uttr.lang = 'ja-JP';
    uttr.rate = speed_select.value;
    uttr.pitch = 1.0;
    window.speechSynthesis.speak(uttr);
}

window.addEventListener('DOMContentLoaded', async function() {
    const chatBox = document.getElementById('scroll');
    const firstAiComment = document.createElement('div');
    const aiP = document.createElement('p');

    //注意事項
    const noticeComment = document.createElement('div');
    const noticeP = document.createElement('p');
    noticeP.innerHTML = "シミュレーションに登場する人物・団体・会社はすべて架空のものであり、<br>実在の人物・団体・会社とは一切関係ありません。<br><br>"
                        + "また、シミュレーション内で個人情報の入力を行わないようにしてください。<br>個人情報の要求があった場合、「○○県○○市～」や「123-4567」などの架空の情報を入力してください。<br><br>"
                        + "左下のアドバイスボタンを押すと、これまでの発言や状況に応じたアドバイスをAIから受け取れます。";

    // 現在のHTMLファイル名を取得
    const pageName = window.location.pathname.split('/').pop();

    // ページごとにクラスを分ける
    if (pageName === 'chat.html') {
        firstAiComment.classList.add('aicomment');
        noticeComment.classList.add('aicomment');
    } else if (pageName === 'quiz-chat.html') {
        firstAiComment.classList.add('quiz-aicomment');
        noticeComment.classList.add('quiz-aicomment');
    }
    noticeComment.appendChild(noticeP);
    chatBox.appendChild(noticeComment);

    /*
    //プロンプトをJSONファイルから取得
    let prompts = {};
    let type_prompt;
    fetch('js/prompt.json')
        .then(response => response.json())
        .then(data => {
            prompts = data.prompts;
            console.log(prompts);

          //mapに変換
            const entries = Object.entries(prompts);
            type_prompt = new Map(entries);
            console.log(type_prompt); 
        })
        .catch(error => {
            alert("プロンプトの読み込みに失敗しました。：" + error);
            location.href = "index.html";
        })
    
        
        //Supabase からデータを取得
        const prompts_map = await getList();   
        type_prompt = prompts_map; 

    */
   
    try{
        let prompt;
        let rule;
        let source;
        if(sessionStorage.getItem("mode")== "test"){
            //テスト遷移時に格納されたプロンプトを取得
            prompt = sessionStorage.getItem("test_prompt");
            //チャットセッション開始
            const response = await fetch("http://localhost:3001/start");
            if(!response.ok){
                throw new Error(response.statusText);
            }
            const data = await response.json();
            sessionId = data.sessionId;
            //ローカルストレージにセッションIDを保存(再訪時に削除)
            localStorage.setItem("sessionID",sessionId);

            const savePrompt = sessionStorage.getItem("savePrompt");
            if(!savePrompt){
                throw new Error("トップページからやり直してください。");
            }
            const promptArray = JSON.parse(savePrompt);
            rule = promptArray.content;

        }else {
            
            //初期読み込み時に格納されたプロンプトを取得
            const savePrompt = sessionStorage.getItem("savePrompt");
            if(!savePrompt){
                throw new Error("トップページからやり直してください。");
            }
            let promptArray = JSON.parse(savePrompt);
            
            if (sessionStorage.getItem("mode") === "詐欺体験クイズ") {

            // クイズ：prompts or prompts_quiz をランダム
            const useQuizPrompt = Math.random() < 0.5;

                if (useQuizPrompt) {
                    const saveQuizPrompt = sessionStorage.getItem("saveQuizPrompt");
                    if (!saveQuizPrompt) {
                        throw new Error("トップページからやり直してください。");
                    }
                    promptArray = JSON.parse(saveQuizPrompt);
                    source="prompts_quiz";
                    console.log("prompts_quiz を使用");
                    sessionStorage.setItem("promptSource", source);
                    console.log("保存確認:", sessionStorage.getItem("promptSource"));
                } else {
                    const savePrompt = sessionStorage.getItem("savePrompt");
                    if (!savePrompt) {
                        throw new Error("トップページからやり直してください。");
                    }
                    source="prompts";
                    promptArray = JSON.parse(savePrompt);
                    console.log("prompts を使用");
                    sessionStorage.setItem("promptSource", source);
                    console.log("保存確認:", sessionStorage.getItem("promptSource"));
                }
            } 
        
            const type_prompt = new Map(promptArray.map(item => [item.type, item.content]));

            //チャットセッション開始
            const response = await fetch("http://localhost:3001/start");
            if(!response.ok){
                throw new Error(response.statusText);
            }
            const data = await response.json();
            sessionId = data.sessionId;
            //ローカルストレージにセッションIDを保存(再訪時に削除)
            localStorage.setItem("sessionID",sessionId);
            
            //プロンプトを用意する
            prompt = type_prompt.get(type);
            rule = type_prompt.get("出力ルール");

            console.log(type_prompt);
            sessionStorage.setItem("promptSource", source);
        }

        //入力したテキストを送信
        const response2 = await fetch("http://localhost:3001/send",{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
                prompt: rule + prompt
            })
        });
        if(!response2.ok){
            const errorString = await response2.json();
            throw new Error(errorString.error || "サーバーエラー：" + response2.status);
        }
        const data2 = await response2.json();
        const aiText = data2.result.replaceAll("*","").replaceAll("\n","<br>").replaceAll("#","");
        console.log(aiText);
        speak(aiText.replaceAll("<br>",""));
        // AIの吹き出し
        aiP.innerHTML = aiText;
        firstAiComment.appendChild(aiP);
        chatBox.appendChild(firstAiComment);

        //入力欄の有効化
        inputTextarea.disabled = false;
        inputTextarea.placeholder = "送信する文章を入力(Shift + Enterで改行できます)";
        mike_button.disabled = false;
        advice_button.disabled  =false;

    }catch(error){
        console.error("エラー：", error);
        this.alert('セッション開始エラー：' + error.message);
        if(sessionStorage.getItem("mode") == "test"){
            window.close();
        }else {
            location.href = "index.html";
        }
    }
});

//マイクボタン
const mike_button = document.getElementById('mikeButton');
SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'ja-JP';
recognition.interimResults = true;
recognition.continuous = true;

let isMike = false;
mike_button.addEventListener('click', function() {
    if(!isMike){
        //認識結果(確定)
        let finalTranscript = "";
        recognition.onresult = (e) => {
            //認識結果(途中)
            let interimTranscript = "";
            for(let i = e.resultIndex; i < e.results.length; i++){
                let transcript = e.results[i][0].transcript;
                if(e.results[i].isFinal){
                    finalTranscript += transcript
                    console.log(transcript);
                }else{
                    interimTranscript = transcript
                }
                console.log(e);
                textarea.value = finalTranscript + interimTranscript;
            }
        };
        //マイクが許可されなかった場合など
        recognition.onerror = (e) => {
            console.log(e.error);
            isMike = false;
            mike_button.classList.remove("mikeON");
            recognition.stop();
            alert("マイクが利用できません。" + "\n" + "エラー：" + e.error);
        }
        isMike = true;
        mike_button.classList.add("mikeON");
        recognition.start();
    }else{
        isMike = false;
        mike_button.classList.remove("mikeON");
        recognition.stop();
    }
});

//アドバイスボタン
const advice_button = document.getElementById("adviceButton");
advice_button.addEventListener("click", async() => {
    sendText("アドバイスをくれ。");
})

//送信ボタン
document.getElementById('displayButton').addEventListener('click', async function() {
    const text = inputTextarea.value.trim();
    if (text === "") return;
    if(text.length > 300){
        alert("入力できる文字数は300文字までです。");
        return;
    }
    sendText(text);
});

//Enterキー
document.addEventListener('keydown', (e) =>{
    if(e.key === "Enter" && !e.shiftKey){
        console.log("enter");
        const text = inputTextarea.value.trim();
        if (text === "") return;
        if(text.length > 300){
            alert("入力できる文字数は300文字までです。");
            return;
        }
        sendText(text);
    }
})

//テキスト送信
const sendText = async function(text){
    const formattedText = text.replace(/\n/g, '<br>');

    // ユーザー吹き出し（右側）
    const myComment = document.createElement('div');
    myComment.classList.add('mycomment');
    const userP = document.createElement('p');
    userP.innerHTML = formattedText;
    myComment.appendChild(userP);
    chatBox.appendChild(myComment);

    //入力欄の無効化
    inputTextarea.disabled = true;
    inputTextarea.placeholder = "回答生成中・・・";
    mike_button.disabled = true;
    advice_button.disabled = true;

    inputTextarea.value = "";
    inputTextarea.style.height = "";

    const prompt = formattedText;
    try{
        //入力したテキストを送信
        const response = await fetch("http://localhost:3001/send",{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId,
                prompt:prompt
            })
        });
        if(!response.ok){
            const errorString = await response.json();
            throw new Error(errorString.error || "サーバーエラー：" + response.status);
        }
        const data = await response.json();
        const aiText = data.result.replaceAll("*","").replaceAll("\n","<br>").replaceAll("#","");
        console.log(aiText);

        const aiComment = document.createElement('div');
        aiComment.classList.add('aicomment');
        const aiP = document.createElement('p');
        aiP.innerHTML = aiText;
        aiComment.appendChild(aiP);
        chatBox.appendChild(aiComment);

        // 現在のHTMLファイル名を取得
        const pageName = window.location.pathname.split('/').pop();

        // ページごとにクラスを分ける
        if (pageName === 'chat.html') {
            aiComment.classList.add('aicomment');
        } else if (pageName === 'quiz-chat.html') {
            aiComment.classList.add('quiz-aicomment');
        }

        speak(aiText.replaceAll("<br>","\n"));

        // 一番下までスクロール
        chatBox.scrollTop = chatBox.scrollHeight;

    }catch(error){
        alert(error);
        console.error(error);
        //入力した文字を入力欄に戻す
        inputTextarea.value = userP.innerText;
        chatBox.removeChild(myComment);
    }
    //入力欄の有効化
    inputTextarea.disabled = false;
    inputTextarea.placeholder = "送信する文章を入力(Shift + Enterで改行できます)";
    mike_button.disabled = false;
    advice_button.disabled = false;
}

//TOPボタンが押された時
document.getElementById("exit-button").addEventListener("click",()=> {
    session_del(sessionId);
    if(sessionStorage.getItem("mode") == "test"){
        window.close();
    }else {
        location.href = "index.html";
    }
});

if (sessionStorage.getItem("mode") === "詐欺体験クイズ") {
    document.getElementById("quiz-form").addEventListener("submit", (e) => {
        e.preventDefault(); 

        let url = "";

            const answer = document.querySelector(
            'input[name="quiz-answer"]:checked'
            ).value;

            url = `quiz-review.html?answer=${answer}`;

        window.location.href = url;
    });
}else{
    document.getElementById("fin-button").addEventListener("click",()=> {
        window.location.href = "trial-review.html";
    });
}

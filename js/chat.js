//セッションID
let sessionId = "";

//詐欺種類
const type = sessionStorage.getItem("type");

document.getElementById("type-caption").innerHTML = type;

//入力欄の設定
const textarea = document.getElementById('textarea');

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

    // 最初からAIの吹き出しを表示
    const firstAiComment = document.createElement('div');
    const aiP = document.createElement('p');
    aiP.textContent = "こんにちは！";
    firstAiComment.appendChild(aiP);
    chatBox.appendChild(firstAiComment);

    // 現在のHTMLファイル名を取得
    const pageName = window.location.pathname.split('/').pop();

    // ページごとにクラスを分ける
    if (pageName === 'chat.html') {
        firstAiComment.classList.add('aicomment');
    } else if (pageName === 'quiz-chat.html') {
        firstAiComment.classList.add('quiz-aicomment');
    }
    speak("こんにちは！");

    //チャットセッション開始
    //ただし、node.js側が再起動されるまでチャットが削除されないため
    //データがひっ迫したりF5連打に弱かったりする
    try{
        const response = await fetch("http://localhost:3001/start");
        if(!response.ok){
            throw new Error("セッション開始に失敗しました");
        }
        const data = await response.json();
        sessionId = data.sessionId;
        
        //この辺で状況設定や詐欺種別などのプロンプトを送信する

    }catch(error){
        console.error("エラー：", error);
        this.alert('セッション開始エラー' + error.message);
    }
});

//マイクボタン
const mike_button = document.getElementById('mikeButton');
SpeechRecongnition = webkitSpeechRecognition || SpeechRecognition;
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


document.getElementById('displayButton').addEventListener('click', async function() {
    const inputTextarea = document.getElementById('textarea');
    const chatBox = document.getElementById('scroll');

    const text = inputTextarea.value.trim();
    if (text === "") return;

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
            throw new Error("サーバーエラー" + response.status);
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

        speak(data.result);

        // 一番下までスクロール
        chatBox.scrollTop = chatBox.scrollHeight;


    }catch(error){
        alert("エラーが発生しました" + error.message);
        console.error(error);
        //入力した文字を入力欄に戻す
        inputTextarea.value = userP.innerText;
        chatBox.removeChild(myComment);
    }
    //入力欄の有効化
    inputTextarea.disabled = false;
    inputTextarea.placeholder = "入力欄";
});

if(sessionStorage.getItem("mode") == "詐欺体験クイズ"){
    document.getElementById("quiz-form").addEventListener("submit", function(event) {
    event.preventDefault(); // 通常の送信を止める

    // 選択されたラジオボタンの値を取得
    const answer = document.querySelector('input[name="quiz-answer"]:checked').value;

    // 結果ページに値をURLで渡して遷移
    window.location.href = `quiz-review.html?answer=${answer}`;
});
}
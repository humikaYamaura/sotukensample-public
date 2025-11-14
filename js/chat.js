

//入力欄の設定
const textarea = document.getElementById('textarea');
const minHeight = 30;

textarea.addEventListener('input', function() {
    this.style.height = 'auto'; // 高さリセット
    const lines = this.value.split('\n').length; // 現在の行数

    if (lines === 1) {
        // 1行目のときは最小高さ
        this.style.height = minHeight + 'px';
    } else {
        // 2行目以降は内容に合わせて高さを調整
        this.style.height = Math.max(this.scrollHeight, minHeight) + 'px'; 
    }
});

window.addEventListener('DOMContentLoaded', function() {
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
        recognition.onresult = (e) => {
            for(let i = e.resutlIndex; i < e.results.length; i++){
                let transcript = e.results[i][0].transcript;
                textarea.value += transcript;
                console.log(transcript);
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


document.getElementById('displayButton').addEventListener('click', function() {
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

    inputTextarea.value = "";
    inputTextarea.style.height = "";

    // 少し遅れてAI返信
    setTimeout(() => {
        const aiComment = document.createElement('div');
        aiComment.classList.add('aicomment');
        const aiP = document.createElement('p');
        aiP.textContent = "テスト";
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


        speak("テスト");
        // 一番下までスクロール
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 500);
});

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


document.getElementById("quiz-form").addEventListener("submit", function(event) {
    event.preventDefault(); // 通常の送信を止める

    // 選択されたラジオボタンの値を取得
    const answer = document.querySelector('input[name="quiz-answer"]:checked').value;

    // 結果ページに値をURLで渡して遷移
    window.location.href = `quiz-review.html?answer=${answer}`;
});
/*
//  Supabase をブラウザで使う正しい方法（CDN 版）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

//  自分の Supabase 情報を入れる
const supabaseUrl = "https://nonjuyhzowdhcmrnocww.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmp1eWh6b3dkaGNtcm5vY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzkwMTgsImV4cCI6MjA4MDExNTAxOH0.u6HRa_feby48aZg4zjZWUUWCizXEgyRj1b3OliOwglM";

//  Supabase クライアント作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Supabaseで登録したテーブル名
const TABLE_NAME = 'explanation';
*/

const type_title = document.getElementById("type-title");
const explanation = document.getElementById("explanation");
const review = document.getElementById("review");

//ここにモードを識別する変数を用意
//const mode =sessionStorage.getItem("mode");
/*if(mode != null){
    if(mode == "詐欺判定クイズ"){
        //ここに正解・不正解を表示するコードを書く
    }
}else{
    //トップページに遷移
    window.location.href = "index.html";
}
*/

//詐欺種別
const type = sessionStorage.getItem("type");
type_title.innerText = type + "とは";

/*
//説明文をsupabaseから取得
export const getList = async () => {
  try {
    const { data, error } = await supabase
      .from("explanation")
      .select("type, content");

    if (error) throw new Error(error.message);

    console.log("Supabase 取得データ:", data);

    // Map に変換して返すだけ
    return new Map(data.map(row => [row.type, row.content]));

  } catch (error) {
    alert("説明文の読み込みに失敗しました：" + error);
    location.href = "chat.html";
  }
};
*/


//textは表示させる文章、innerHTMLは表示を行う要素、intervalは文字の表示間隔
const typeText = function(text,innerHTML,interval){
    let index = 0;
    const type = function(){
        innerHTML.innerHTML = text.slice(0,index);
        if(index < text.length){
            index++;
            setTimeout(type,interval);
        }
    }
    setTimeout(type, interval);
};

/*
//説明文をJSONファイルから取得
let explanation_json = {};
let type_prompt;

fetch('js/prompt.json')
    .then(response => response.json())
    .then(data => {
        prompts = data.explanation;
        console.log(prompts);

        //mapに変換
        const entries = Object.entries(prompts);
        const type_explanation = new Map(entries);
        typeText(type_explanation.get(type),explanation,50);
    })
    .catch(error => {
        alert("説明文の読み込みに失敗しました。：" + error);
    })
        

    //Supabase からデータを取得
    const prompts_map = await getList();   
    type_prompt = prompts_map; 
    */

//sessionStorageに格納された説明文を取得
const saveType = sessionStorage.getItem("saveType");
if(!saveType){
    alert("トップページからやり直してください。");
    location.href = "index.html";
}
const typeArray = JSON.parse(saveType);
const type_prompt = new Map(typeArray.map(item => [item.type, item.content]));

//説明文の表示
if (type_prompt.has(type)) {
    typeText(type_prompt.get(type), explanation, 50);
} else {
    explanation.innerHTML = "説明文が見つかりません。";
}

//返答評価
const review_history = async() => {
    typeText("返答評価生成中・・・",review,100);
    try{
        const response = await fetch("http://localhost:3001/send",{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                sessionId: localStorage.getItem("sessionID"),
                prompt:"返答評価を行ってください。\n" + 
                "【返答評価の基準】\n「あなたの返答」の評価は行わないでください。返答評価は「1.接触」「2.金銭の要求」「3.受け渡し」の3段階の手順に分けてそれぞれ200～300文字以内で行ってください。最後に「4.総評」でまとめてください。この際、全ての返答を評価する必要はなく、「手順における重要なポイント」となる返答のみを例に挙げてください。なお、「返答評価を行います。」などの前置きは不要です。返答評価の基準は、「私(ユーザー)が詐欺の可能性がある電話に対して適切な返答が行えたか」であり、「返答評価を行ってください。」という文章およびそれ以降の基準は含みません。この返答評価を行う際、「私」は「あなた」に置き換えてください。"
        })
    });
        if(!response.ok){
            const errorString = await response.json();
            throw new Error(errorString.error || "サーバーエラー：" + response.status);
        }
        const data = await response.json();
        const review_text = data.result.replaceAll("*","").replaceAll("\n","<br>").replaceAll("#","");
        console.log(review_text);
        sessionStorage.setItem(localStorage.getItem("sessionID") + "_review",review_text);

        typeText(review_text,review,50);

    }catch(error){
        alert("返答評価生成に失敗しました。:" + error);
    }
};
//同じセッションチャットのレビューがあればそれを表示(F5連打防止)
if(sessionStorage.getItem(localStorage.getItem("sessionID") + "_review")){
    typeText(sessionStorage.getItem(localStorage.getItem("sessionID") + "_review"),review,50);
}else{
    sessionStorage.setItem(localStorage.getItem("sessionID") + "_review"," ");
    review_history();
}

//正解・不正解判定
const params = new URLSearchParams(location.search);
const answer = params.get("answer");
const msg = document.getElementById("message");

if (answer === "yes") {
    msg.innerHTML  = "！！正解！！<br>このチャットは詐欺です！！";
} else if (answer === "no") {
    msg.innerHTML  = "！！不正解！！<br>このチャットは詐欺です！！";
}

//TOPに戻る
document.getElementById("exit-button").addEventListener("click", () => {
    window.location.href = "index.html"; 
});
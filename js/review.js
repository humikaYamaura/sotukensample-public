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

//一時的に「オレオレ詐欺」を設定 
const type = sessionStorage.getItem("type");
type_title.innerText = type + "とは";

//説明文と返答評価

//説明文をJSONファイルから取得
let explanation_json = {};
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
        location.href = "index.html";
    })
//返答評価
const review_history = async() => {
    try{
        const response = await fetch("http://localhost:3001/send",{
            method: 'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body: JSON.stringify({
                sessionId: localStorage.getItem("sessionID"),
                prompt:"返答評価を行ってください。\n" + 
                "【返答評価の基準】\n「あなたの返答」の評価は行わないでください。返答評価は「1.接触」「2.金銭の要求」「3.受け渡し」の3段階の手順に分けてそれぞれ200～300文字程度で行ってください。最後に「4.総評」でまとめてください。この際、全ての返答を評価する必要はなく、「手順における重要なポイント」となる返答のみを例に挙げてください。なお、「返答評価を行います。」などの前置きは不要です。返答評価の基準は、「私(ユーザー)が詐欺の可能性がある電話に対して適切な返答が行えたか」です。"
        })
    });
    if(!response.ok){
        const errorString = await response.json();
        throw new Error(errorString.error || "サーバーエラー：" + response.status);
    }
        const data = await response.json();
        const review_text = data.result.replaceAll("*","").replaceAll("\n","<br>").replaceAll("#","");
        console.log(review_text);

        typeText(review_text,review,50);

    }catch(error){
        alert("返答評価生成に失敗しました。:" + error);
    }
};
review_history();


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

//正解・不正解判定
const params = new URLSearchParams(location.search);
const answer = params.get("answer");
const msg = document.getElementById("message");

if (answer === "yes") {
    msg.innerHTML  = "！！正解！！<br>このチャットは詐欺です！！";
} else if (answer === "no") {
    msg.innerHTML  = "！！不正解！！<br>このチャットは詐欺です！！";
}
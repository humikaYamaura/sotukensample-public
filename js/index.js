// ① Supabase をブラウザで使う正しい方法（CDN 版）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ② 自分の Supabase 情報を入れる
const supabaseUrl = "https://nonjuyhzowdhcmrnocww.supabase.co";          // ★あなたのURL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmp1eWh6b3dkaGNtcm5vY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzkwMTgsImV4cCI6MjA4MDExNTAxOH0.u6HRa_feby48aZg4zjZWUUWCizXEgyRj1b3OliOwglM";    // ★あなたのAnonキー

// ③ Supabase クライアント作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

//モード識別用変数
let mode = "詐欺体験";

const trial_button = document.getElementById("trial");
const quiz_button = document.getElementById("quiz");
const type_area = document.getElementById("type");
const submit_button = document.getElementById("submit");

//詐欺体験ボタン
trial_button.addEventListener("click", () => {
    mode = "詐欺体験";
    quiz_button.style.backgroundColor = "rgb(230,244,241)";
    trial_button.style.backgroundColor = "rgb(168, 174, 255)";
    type_area.style.border= "solid 6px rgb(168, 174, 255)";
    type_area.style.boxShadow = "15px 13px 0 rgb(168, 174, 255)";
    submit_button.style.boxShadow = "0 10px 0 rgb(136, 142, 235)";
    submit_button.style.border = "3px solid rgb(136, 142, 235)";
});

//詐欺体験クイズボタン
quiz_button.addEventListener("click", () => {
    mode = "詐欺体験クイズ";
    trial_button.style.backgroundColor = "rgb(230,244,241)";
    quiz_button.style.backgroundColor = "rgb(103,231,212)";
    type_area.style.border= "solid 6px rgb(103,231,212)";
    type_area.style.boxShadow = "15px 13px 0 rgb(103,231,212)";
    submit_button.style.boxShadow = "0 10px 0 rgba(40, 176, 155, 1)";
    submit_button.style.border = "3px solid rgba(40, 176, 155, 1)";
});

//sessionStorageに詐欺タイプやコンテンツ、プロンプトを保存する
//データが必要になる度にSupabaseに接続して取得するよりも、最初に一括で取得した方が多分速い
//ただし、Supabase側でデータを更新した場合、タブを開きなおさないと最新のデータが取得できない
export const getColmun = async (table, colmun) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("type, " + colmun);

    if (error) throw new Error(error.message);

    console.log("Supabase 取得データ:", data);

    return data;

  } catch (error) {
    alert("プロンプトの読み込みに失敗しました：" + error);
    location.href = "index.html";
  }
};

const explain = document.getElementById("explain");
const types = document.getElementsByName("types");

//詐欺をラジオボタン形式で格納
document.addEventListener("DOMContentLoaded", async () => {

    //sessionStorageに保存されていなければSupabaseから取得して保存
    if(!sessionStorage.getItem("saveType")){
        const jsonStr = await getColmun("explanation","content");
        jsonStr.forEach((item) => {
            //改行コードを<br>に変換
            item.content = item.content.replace(/\r\n/g, "<br>");
        });
        sessionStorage.setItem("saveType", JSON.stringify(jsonStr));
    }
    if(!sessionStorage.getItem("savePrompt")){
        const jsonStr = await getColmun("prompts", "content");
        sessionStorage.setItem("savePrompt", JSON.stringify(jsonStr));
    }
    if(!sessionStorage.getItem("saveExplain")){
        const jsonStr = await getColmun("explanation","simple_content");
        sessionStorage.setItem("saveExplain", JSON.stringify(jsonStr));
    }

    //説明文をsessionStorageから取得
    //テキスト → Array → Mapの順で変換する
    const saveExplain = sessionStorage.getItem("saveExplain");
    const explainArray = JSON.parse(saveExplain);
    const explainMap = new Map(explainArray.map(item => [item.type, item.simple_content]));

    const type = document.getElementById("type");
    //ラジオボタン生成
    explainMap.forEach((elem, name) => {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "types";
        input.value = name;
        input.id = name;
        const label = document.createElement("label");
        label.htmlFor = name;
        label.classList.add("label");
        label.innerText = name;
        type.insertBefore(input,explain);
        type.insertBefore(label,explain);
    });

    //簡易説明表示
    types.forEach((type) => {
        type.addEventListener('change', () => {
            explain.innerHTML = explainMap.get(type.value);
        });
    });
    //初期表示(一番上の詐欺を選択)
    types[0].checked = true;
    explain.innerHTML = explainMap.get(types[0].value);
});

//決定ボタン
document.getElementById("submit").addEventListener("click", () => {
    //選択した詐欺種類　取得
    let selectType;
    for(let i = 0; i < types.length; i++){
        if(types[i].checked){
            selectType = types[i].value;
            break;
        }
    }
    console.log("モード:" + mode +" 詐欺種類:" + selectType);
    sessionStorage.setItem("mode", mode);
    sessionStorage.setItem("type", selectType);

    if(mode == "詐欺体験"){
        location.href = "chat.html";
    }else if(mode == "詐欺体験クイズ"){
        location.href = "quiz-chat.html";
    }
});
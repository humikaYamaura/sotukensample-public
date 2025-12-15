// ① Supabase をブラウザで使う正しい方法（CDN 版）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ② 自分の Supabase 情報を入れる
const supabaseUrl = "https://nonjuyhzowdhcmrnocww.supabase.co";          // ★あなたのURL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmp1eWh6b3dkaGNtcm5vY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzkwMTgsImV4cCI6MjA4MDExNTAxOH0.u6HRa_feby48aZg4zjZWUUWCizXEgyRj1b3OliOwglM";    // ★あなたのAnonキー

// ③ Supabase クライアント作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export const getColmun = async (table, colmun, type) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(colmun)
      .eq('type',type);

    if (error) throw new Error(error.message);

    console.log("Supabase 取得データ:", data[0]);

    return data[0];

  } catch (error) {
    alert("データの読み込みに失敗しました：" + error);
    location.href = "promptEdit.html";
  }
};

const type_name = document.getElementById("type-name");
const type_level = document.getElementsByName("type-level");
const type_simple = document.getElementById("type-simple-explain");
const type_explain = document.getElementById("type-explain");
const type_prompt = document.getElementById("type-prompt");
const type_prompt_quiz = document.getElementById("type-prompt-quiz");

const submit_button = document.getElementById("type-submit");
//変更前の名前を保持
let before_name;

document.addEventListener("DOMContentLoaded", async() => {
    submit_button.disabled = true;
    submit_button.value = "読み込み中・・・";
    const h1 = document.getElementsByTagName("h1");
    h1[0].innerText = "認証情報確認中・・・";

    //認証処理
    const id = sessionStorage.getItem("id");
    const pass = sessionStorage.getItem("pass");
    if(id && pass){
        try{
          const { data, error } = await supabase.auth.signInWithPassword({
            email: id,
            password: pass,
          });
          if(error){
            throw new Error(error.message);
          }
          console.log("認証成功");
        }catch(error){
          console.log("認証失敗", error.message);
          location.href = "promptEdit.html";
        }
    }else {
        location.href = "promptEdit.html";
    }

    //出力ルールの取得
    if(!sessionStorage.getItem("savePrompt")){
        const jsonStr = await getColmun("prompts", "content","出力ルール");
        sessionStorage.setItem("savePrompt", JSON.stringify(jsonStr));
        console.log(sessionStorage.getItem("savePrompt"));
    }
    
    //編集ボタンを押して遷移した場合、詐欺の情報を取得して適用する
    if(sessionStorage.getItem("editType")){
        h1[0].innerText = "詐欺編集";
        const name_value = sessionStorage.getItem("editType");
        type_name.value = name_value;
        before_name = name_value;

        let colmun;
        try {
            const { data, error } = await supabase
            .from("explanation")
            .select("content, simple_content, level")
            .eq('type',name_value);

            if (error) throw new Error(error.message);

            console.log("Supabase 取得データ:", data[0]);

            colmun = data[0];

        } catch (error) {
            alert("データの読み込みに失敗しました：" + error);
            location.href = "promptEdit.html";
        }

        const level_value = colmun.level;
        console.log(level_value);
        let isValue = false;
        for(let i = 0; i < type_level.length; i++){
            if(type_level.item(i).value == level_value){
                type_level.item(i).checked = true;
                isValue = true;
            }
        }
        if(!isValue){
            type_level.item(4).checked = true;
            const else_text = document.getElementById("else-text");
            else_text.value = level_value;
        }
        type_simple.value = colmun.simple_content;
        type_explain.value = colmun.content;

        //プロンプト
        const prompt_value = await getColmun("prompts","content",name_value);
        type_prompt.value = prompt_value.content;

        //プロンプト(クイズ)
        const prompt_quiz = await getColmun("prompts_quiz","content",name_value);
        type_prompt_quiz.value = prompt_quiz.content;
    }else{
        h1[0].innerText = "詐欺追加";
    }

    submit_button.value = "☑ 保存";
    submit_button.disabled = false;
});

//戻るボタン
document.getElementById("exit-button").addEventListener("click", () => {
    if(sessionStorage.getItem("editType")){
        if(confirm("変更を破棄して戻ります。よろしいですか？")){
            window.close();
        }
    }else{
        if(confirm("詐欺を追加せず戻ります。よろしいですか？")){
            window.close();
        }
    }
});

//テストボタン(入力されたプロンプトの試運転機能)
document.getElementById("test-button").addEventListener("click", () =>{
    //入力されたプロンプト、名前をセットしてチャット画面に遷移
    sessionStorage.setItem("test_name",type_name.value);
    sessionStorage.setItem("test_explain",type_explain.value);
    sessionStorage.setItem("test_prompt",type_prompt.value);
    sessionStorage.setItem("mode", "test");

    window.open("../chat.html","_blank");
});

//テストボタン(クイズ、詐欺じゃないver)
document.getElementById("test-button-quiz").addEventListener("click",() =>{
    //入力されたプロンプト、名前をセットしてチャット画面に遷移
    sessionStorage.setItem("test_name",type_name.value);
    sessionStorage.setItem("test_explain",type_explain.value);
    sessionStorage.setItem("test_prompt",type_prompt_quiz.value);
    sessionStorage.setItem("mode", "test");

    window.open("../chat.html","_blank");
});

//保存ボタン
submit_button.addEventListener("click", async() => {
    try{
        if(!type_name.value)
            throw new Error("名称を入力してください。");
        if(!type_simple.value)
            throw new Error("説明(簡易)を入力してください。");
        if(!type_explain.value)
            throw new Error("説明を入力してください。");
        if(!type_prompt.value || !type_prompt_quiz.value)
            throw new Error("プロンプトを入力して下さい。");
    }catch(err){
        alert(err);
        return;
    }
    submit_button.disabled = true;
    submit_button.value = "保存中・・・";

    //選択されたおすすめ表示を取得
    let check_revel;
    for(let i = 0; i < type_level.length; i++){
        if(type_level.item(i).checked){
            check_revel = type_level.item(i).value;
        }
    }
    //おすすめ表示にその他が選択された場合、入力されたものを適用
    if(check_revel == "その他"){
        check_revel = document.getElementById("else-text").value;
    }
    console.log(check_revel);

    //編集の場合：UPDATE　追加の場合：INSERT
    if(sessionStorage.getItem("editType")){
        try{
            //explanationテーブル
            const { data, error } = await supabase
            .from("explanation")
            .update({
                type: type_name.value,
                simple_content: type_simple.value,
                content: type_explain.value,
                level: check_revel
            })
            .eq('type',before_name);

            if (error) throw new Error(error.message);

            console.log("Supabase 更新データ:", data);

            //promptsテーブル
            const { data2, error2 } = await supabase
            .from("prompts")
            .update({
                type: type_name.value,
                content: type_prompt.value
            })
            .eq('type',before_name);

            if (error2) throw new Error(error2.message);

            console.log("Supabase 更新データ:", data2);

            //prompts_quizテーブル
            const { data3, error3 } = await supabase
            .from("prompts_quiz")
            .update({
                type: type_name.value,
                content: type_prompt_quiz.value
            })
            .eq('type',before_name);

            if (error3) throw new Error(error3.message);

            console.log("Supabase 更新データ:", data3);

            alert("更新に成功しました。変更ページに戻ります。");
            window.close();
        }catch(err){
            alert("更新に失敗しました。再度保存ボタンを押してください。：" + err);
            submit_button.disabled = false;
            submit_button.value = "☑ 保存";
        }
    }else{
        try{
            //explanationテーブル
            const { data, error } = await supabase
            .from("explanation")
            .insert({
                type: type_name.value,
                simple_content: type_simple.value,
                content: type_explain.value
            })
            .select()

            if (error) throw new Error(error.message);

            console.log("Supabase 追加データ:", data);

            //promptsテーブル
            const { data2, error2 } = await supabase
            .from("prompts")
            .insert({
                type: type_name.value,
                content: type_prompt.value
            })
            .select();

            if (error2) throw new Error(error2.message);

            console.log("Supabase 追加データ:", data2);

            alert("追加に成功しました。変更ページに戻ります。")
            window.close();
        }catch(err){
            alert("追加に失敗しました。再度保存ボタンを押してください。:" + err);
            submit_button.disabled = false;
            submit_button.value = "☑ 保存";
        }
    }
    
});
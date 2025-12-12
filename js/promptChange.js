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

const submit_button = document.getElementById("type-submit");
//変更前の名前を保持
let before_name;

document.addEventListener("DOMContentLoaded", async() => {
    /*
    //保存されているID、パスワードの確認
    const id = sessionStorage.getItem("id");
    const pass = sessionStorage.getItem("pass");
    if(id != "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e" || pass != "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"){
        location.href = "promptEdit.html";
    }
    */

    submit_button.disabled = true;

    //出力ルールの取得
    if(!sessionStorage.getItem("savePrompt")){
        const jsonStr = await getColmun("prompts", "content","出力ルール");
        sessionStorage.setItem("savePrompt", JSON.stringify(jsonStr));
        console.log(sessionStorage.getItem("savePrompt"));
    }
    

    if(sessionStorage.getItem("editType")){
        const name_value = sessionStorage.getItem("editType");
        type_name.value = name_value;
        before_name = name_value;
        const level_value = await getColmun("explanation","level",name_value);
        for(let i = 0; i < type_level.length; i++){
            if(type_level.item(i).value == level_value.level){
                type_level.item(i).checked = true;
            }
        }
        const simple_value = await getColmun("explanation","simple_content",name_value);
        type_simple.value = simple_value.simple_content;
        const explain_value = await getColmun("explanation","content",name_value);
        type_explain.value = explain_value.content;
        const prompt_value = await getColmun("prompts","content",name_value);
        type_prompt.value = prompt_value.content;
    }else{
        const h1 = document.getElementsByTagName("h1");
        h1[0].innerText = "詐欺追加";
    }
    submit_button.disabled = false;
});

//入力されたプロンプトの試運転機能
document.getElementById("test-button").addEventListener("click", () =>{
    //入力されたプロンプト、名前をセットしてチャット画面に遷移
    sessionStorage.setItem("test_name",type_name.value);
    sessionStorage.setItem("test_explain",type_explain.value);
    sessionStorage.setItem("test_prompt",type_prompt.value);
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
        if(!type_prompt.value)
            throw new Error("プロンプトを入力して下さい。");
    }catch(err){
        alert(err);
        return;
    }
    submit_button.disabled = true;
    submit_button.value = "保存中・・・";
    let check_revel;
    for(let i = 0; i < type_level.length; i++){
        if(type_level.item(i).checked){
            check_revel = type_level.item(i).value;
        }
    }
    console.log(check_revel);

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

            console.log("Supabase 更新データ:", data2);

            alert("追加に成功しました。変更ページに戻ります。")
            window.close();
        }catch(err){
            alert("追加に失敗しました。再度保存ボタンを押してください。:" + err);
            submit_button.disabled = false;
            submit_button.value = "☑ 保存";
        }
    }
    
});
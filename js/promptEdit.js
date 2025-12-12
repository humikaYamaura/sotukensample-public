// ① Supabase をブラウザで使う正しい方法（CDN 版）
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ② 自分の Supabase 情報を入れる
const supabaseUrl = "https://nonjuyhzowdhcmrnocww.supabase.co";          // ★あなたのURL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbmp1eWh6b3dkaGNtcm5vY3d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MzkwMTgsImV4cCI6MjA4MDExNTAxOH0.u6HRa_feby48aZg4zjZWUUWCizXEgyRj1b3OliOwglM";    // ★あなたのAnonキー

// ③ Supabase クライアント作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

//Select
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
    location.href = "promptEdit.html";
  }
};

//delete
export const deleteColmun = async(table, type) => {
  try {
    const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("type",type)

    if (error) throw new Error(error.message);

    console.log("Supabase 取得データ:", data);

  } catch (error) {
    alert("削除に失敗しました：" + error);
  }
}

//認証画面の「送信」ボタン
const pass_button = document.getElementById("pass-button");
pass_button.addEventListener("click",async () =>{
  pass_button.disabled = true;
  const id = document.getElementById("id-input").value;
  const pass = document.getElementById("pass-input").value;

  //認証処理
  try{
    const { data, error } = await supabase.auth.signInWithPassword({
      email: id,
      password: pass,
    });
    if(error){
      throw new Error(error.message);
    }
    console.log("認証成功");
    sessionStorage.setItem("id", id);
    sessionStorage.setItem("pass",pass);
    document.getElementById("pass").style.display = "none";
    document.getElementById("view").style.display = "block";
  }catch(error){
    if(error.message == "missing email or phone" || error.message == "Invalid login credentials"){
      alert("認証に失敗しました。");
    }else {
      console.log("認証失敗", error.message);
      alert("認証に失敗しました。：" + error.message);
    }
  }
  pass_button.disabled = false;
});

const add_button = document.getElementById("add-button");
const check_text = document.getElementById("check-text");
document.addEventListener("DOMContentLoaded", async() => {
  //認証処理
  check_text.innerText = "認証情報確認中・・・";
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
      document.getElementById("pass").style.display = "none";
      document.getElementById("view").style.display = "block";
    }catch(error){
      console.log("認証失敗", error.message);
    }
  }
  check_text.innerText = "";

  const type_table = document.getElementById("type-table");
  const load_text = document.getElementById("load-text");

  const type_item = await getColmun("explanation", "simple_content");

  //詐欺ごとに項目追加
  type_item.forEach(item => {
    console.log(item);
    const tr = document.createElement("tr");
    //詐欺名
    const type_td =document.createElement("td");
    type_td.textContent = item.type;
    tr.appendChild(type_td);

    //詐欺説明
    const content_td = document.createElement("td");
    content_td.textContent = item.simple_content;
    tr.appendChild(content_td);
  
    //編集ボタン
    const edit_td = document.createElement("td");
    const edit_button = document.createElement("input");
    edit_button.setAttribute("type","button");
    edit_button.setAttribute("id","edit-button");
    edit_button.setAttribute("value", "📝");
    //編集ボタンを押した時の動作
    edit_button.addEventListener("click",() => {
      sessionStorage.setItem("editType",item.type);
      window.open('promptChange.html','_blank');
    });
    edit_td.appendChild(edit_button);
    tr.appendChild(edit_td);

    //削除ボタン
    const delete_td = document.createElement("td");
    const delete_button = document.createElement("input");
    delete_button.setAttribute("type","button");
    delete_button.setAttribute("id","delete-button");
    delete_button.setAttribute("value","🗑️");
    //削除ボタンを押した時の動作
    delete_button.addEventListener("click",async () => {
      if(confirm(item.type + "を削除します。よろしいですか？")){
        if(confirm("一度削除した項目は復元できません。" + item.type +"を削除してもよろしいですか？")){
          //explanation
          await deleteColmun("explanation",item.type);
          //prompts
          await deleteColmun("prompts",item.type);

          alert(item.type + "を削除しました。");
          location.reload();
        }
      }
    });
    delete_td.appendChild(delete_button);
    tr.appendChild(delete_td);

    //テーブルに詐欺追加
    type_table.appendChild(tr);
    load_text.innerText = "※変更が反映されない場合、リロードを行ってください。";
  });
  add_button.style.display = "inline";
});

//追加ボタン
add_button.addEventListener("click", () => {
  sessionStorage.removeItem("editType");
  window.open("promptChange.html","_blank");
});
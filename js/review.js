const type_title = document.getElementById("type-title");
const explanation = document.getElementById("explanation");
const review = document.getElementById("review");

//ここにモードを識別する変数を用意
//const mode =localStorage.getItem("mode");
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
const type = "オレオレ詐欺"; 
//type = localStorage.getItem("type");
type_title.innerText = type + "とは";

//一時的に説明文と返答評価を固定
let explanation_text = "オレオレ詐欺とは、親族や警察官、弁護士などを名乗り、「電話番号が変わった」「風邪をひいた」などと言い訳をして、金銭をだまし取る詐欺です。犯人は「鞄をなくした」「株に使い込んでしまった」などと理由をつけ、至急現金が必要だと訴え、被害者から金銭をだまし取ります。ああああああああああああああああああああああああああああああああああああああああああああああ ";
let review_text = "問1では，サプライチェーン攻撃によるランサムウェア被害を題材に，インシデント発生原因の調査，侵入 経路の特定及び再発防止策の立案について出題した。全体として正答率は平均的であった。 <br>設問 3 の“理由”は，正答率が低かった。リバースブルートフォース攻撃の理解が不十分と思われる解答が 散見された。ログインのロックアウトのしきい値を設定することは，同一の ID に対して連続してログインを 試行する攻撃には有効である。ただし，パスワードが漏えいして，リバースブルートフォース攻撃を受けた場 合は同一の ID で 2 回以上ログインを試行することはないので，しきい値に達する前にログインされてしまうお それがある。様々な攻撃に対応した防御を行うことが重要である。<br> 設問 5 は，正答率が低かった。バックアップを保存していても，バックアップデータ自体が攻撃対象となっ て書き換えられてしまうと，システムの復旧ができなくなってしまう。バックアップデータの保護には，書き 込んだデータが変更できないストレージを採用することが有効であることを理解してほしい。<br>※ちょうどいい長文が思いつかなかったので応用情報の採点講評をコピペしました"; 

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
typeText(explanation_text,explanation,50);
typeText(review_text,review,50);
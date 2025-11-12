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

//選択した詐欺種類の取得
const types = document.getElementsByName("types");
const expain_text = new Map([["オレオレ詐欺","親族、警察官、弁護士などを装って金銭などをだまし取る詐欺。"],
                            ["還付金詐欺","税金の還付金があるなどと嘘を言い、金銭などをだまし取る詐欺。"],
                            ["架空請求詐欺","架空の料金を請求し、金銭などをだまし取る詐欺。"],
                            ["投資詐欺","偽の投資話を持ちかけ、金銭などをだまし取る詐欺。"],
                            ["SNS・マッチングアプリ詐欺","SNSやマッチングアプリを通じて知り合った相手から金銭などをだまし取る詐欺。"]]);
const explain = document.getElementById("explain");
types.forEach((type) => {
    type.addEventListener('change', () => {
        explain.innerHTML = expain_text.get(type.value);
    });
});

//決定ボタン
document.getElementById("submit").addEventListener("click", () => {
    const types = document.getElementsByName("types");
    let selectType;
    for(let i = 0; i < types.length; i++){
        if(types[i].checked){
            selectType = types[i].value;
            break;
        }
    }
    console.log("モード:" + mode +" 詐欺種類:" + selectType);
    //sessionStorage.setItem("mode", mode);
    //sessionStorage.setItem("type", selectType);

    if(mode == "詐欺体験"){
        location.href = "chat.html";
    }else if(mode == "詐欺体験クイズ"){

    }
});
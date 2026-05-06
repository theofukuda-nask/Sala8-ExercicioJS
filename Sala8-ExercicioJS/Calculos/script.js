function somar(){ 
    var n1 = document.getElementById("n1").valueAsNumber;
    var n2 = document.getElementById("n2").valueAsNumber;
    var resp = document.getElementById("resposta1");

    resp.textContent = n1 + n2;
}

function sub(){
    var n3 = document.getElementById("n3").valueAsNumber;
    var n4 = document.getElementById("n4").valueAsNumber;
    var resp = document.getElementById("resposta2");

    resp.textContent = n3 - n4;
}

function div(){
    var n5 = document.getElementById("n5").valueAsNumber;
    var n6 = document.getElementById("n6").valueAsNumber;
    var resp = document.getElementById("resposta3");

    if (n6 !== 0){
        resp.textContent = n5 / n6;

    }else{
        resp.textContent = "IMPOSSÍVEL DE REALIZAR ESSA CONTA"}
}

function mult(){
    var n7 = parseFloat(document.getElementById("n7").value)
    var n8 = parseFloat(document.getElementById("n8").value)
    var resp = document.getElementById("resposta4");
    resp.textContent = n7 * n8;

}

    
function mostrar(){
    var texto = document.getElementById("AI1").value
    var cor = document.getElementById("AI2").value
    var check = document.getElementById("AI3").checked
    var data = document.getElementById("AI4").value

    printTexto.textContent = `Digitaru : ${texto}`
    printCor.innerHTML = `Escolheru : ${cor}`
    printCheck = `Você escoleu : ${check}`
    printData.innerText = `Nasceru : ${data}`
}
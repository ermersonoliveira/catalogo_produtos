let dados = [];

async function buscarProdutos(){
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    console.log(dados);
}
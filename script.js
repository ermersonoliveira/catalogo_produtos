let cardContainer = document.querySelector(".card-container");
const inputBusca = document.querySelector("#input-busca");
const botaoBusca = document.querySelector("#botao-busca");

let dados = [];

// 1. Função para carregar os dados do JSON e renderizar todos os produtos na tela
async function carregarProdutos() {
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    renderizarCards(dados);
}

// 2. Função para filtrar os produtos com base no termo de busca
function buscarProdutos() {
    // Função auxiliar para remover acentos de uma string
    const removerAcentos = (texto) => {
        return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const termoBuscado = removerAcentos(inputBusca.value.toLowerCase());
    
    // Filtra o array 'dados' procurando pelo termo no nome ou na descrição
    const produtosFiltrados = dados.filter(dado => {
        // Normaliza também os dados do produto antes de comparar
        return removerAcentos(dado.nome.toLowerCase()).includes(termoBuscado) ||
               removerAcentos(dado.descricao.toLowerCase()).includes(termoBuscado);
    });

    // Renderiza apenas os produtos que passaram no filtro
    renderizarCards(produtosFiltrados);
}

// 3. Função para renderizar os cards na tela
function renderizarCards(dados) {
    // Limpa o container para não duplicar os produtos a cada busca
    cardContainer.innerHTML = "";

    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        article.innerHTML = `
        <h2>${dado.nome}</h2>
        <p>${dado.descricao}</p>
        <a href="${dado.link}" target="_blank">Saiba mais</a>
        `
        cardContainer.appendChild(article);
    }
}

// Adiciona o evento de clique no botão de busca
botaoBusca.addEventListener("click", buscarProdutos);

// Chama a função para carregar os produtos assim que a página é carregada
carregarProdutos();
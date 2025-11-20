let cardContainer = document.querySelector(".card-container");

let dados = [];

async function buscarProdutos() {
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    renderizarCards(dados);
}

function renderizarCards(dados) {
    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        article.innerHTML = `
        <h2>${dado.nome}</h2>
        <p>${dado.descricao}</p>
        <a href="${dado.link}">Saiba mais</a>
        `
        cardContainer.appendChild(article);

    }
}
let cardContainer = document.querySelector(".card-container");
const inputBusca = document.querySelector("#input-busca");
const botaoBusca = document.querySelector("#botao-busca");
const mainElement = document.querySelector("main");

let dados = [];

// 1. Função para carregar os dados do JSON e renderizar todos os produtos na tela
async function carregarProdutos() {
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    renderizarCards(dados);
    criarMenuCategorias();
    adicionarListenersCategorias();
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
        <img src="${dado.imagem}" alt="Imagem do produto ${dado.nome}">
        <h2>${dado.nome}</h2>
        <p>${dado.descricao}</p>
        <a href="#" class="product-category" data-category="${dado.categoria}">${dado.categoria}</a>
        <p class="preco">${dado.preco}</p>
        <a href="${dado.link}" target="_blank">Saiba mais</a>
        `
        cardContainer.appendChild(article);
    }
}

// 4. Função para criar e injetar o menu de categorias
function criarMenuCategorias() { 
    const categorias = ["Todos", "Creatina", "Whey", "Pré-treino", "Multivitamínico"];
    const nav = document.createElement("nav");
    nav.classList.add("category-menu");

    const ul = document.createElement("ul");
    // Adiciona um ID para facilitar a seleção posterior
    ul.id = "category-list";

    for (const categoria of categorias) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.textContent = categoria;
        // A primeira categoria ("Todos") recebe a classe 'active' inicialmente
        if (categoria === "Todos") {
            a.classList.add("active");
        }
        // Adiciona um atributo de dados para facilitar o filtro
        a.dataset.category = categoria.toLowerCase();
        li.appendChild(a);
        ul.appendChild(li);
    }

    nav.appendChild(ul);
    // Insere o menu antes do elemento <main>
    document.body.insertBefore(nav, mainElement);
}

// 5. Função centralizada para filtrar produtos e atualizar a UI
function filtrarPorCategoria(categoriaSelecionada) {
    // Atualiza o menu principal para refletir a seleção
    const menuLinks = document.querySelectorAll("#category-list a");
    menuLinks.forEach(a => {
        if (a.dataset.category === categoriaSelecionada) {
            a.classList.add("active");
        } else {
            a.classList.remove("active");
        }
    });

    // Filtra e renderiza os produtos
    if (categoriaSelecionada === "todos") {
        renderizarCards(dados); // Mostra todos os produtos
    } else {
        const produtosFiltrados = dados.filter(dado => dado.categoria === categoriaSelecionada);
        renderizarCards(produtosFiltrados);
    }
}

// 6. Função para adicionar os listeners de clique
function adicionarListenersCategorias() {
    const menuCategorias = document.getElementById("category-list");
    // Listener para o menu principal
    menuCategorias.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            e.preventDefault();
            filtrarPorCategoria(e.target.dataset.category);
        }
    });

    // Listener para as tags nos cards (usando delegação de evento)
    cardContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("product-category")) {
            e.preventDefault();
            filtrarPorCategoria(e.target.dataset.category);
        }
    });
}

// Adiciona o evento de clique no botão de busca
botaoBusca.addEventListener("click", buscarProdutos);

// Chama a função para carregar os produtos assim que a página é carregada
carregarProdutos();
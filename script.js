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
    ajustarPosicaoMenuCategoria(); // Adicionado para ajustar a posição do menu
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

    // Após a busca, minimiza o campo de busca na versão mobile
    const searchMenuItem = document.querySelector(".search-menu-item");
    if (searchMenuItem) {
        searchMenuItem.classList.remove("active");
    }

    // Limpa o campo de busca após a pesquisa
    inputBusca.value = "";
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
        <a href="#" class="product-category" data-category="${dado.categoria.toLowerCase()}">${dado.categoria}</a>
        <p class="preco">${dado.preco}</p>
        <div class="availability-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Por favor, consultar a disponibilidade do produto.</span>
        </div>
        <a href="${dado.link}" target="_blank">Saiba mais</a>
        `
        cardContainer.appendChild(article);
    }
}

// 4. Função para criar e injetar o menu de categorias
function criarMenuCategorias() { 
    // Cria um Set para armazenar categorias únicas, evitando duplicatas.
    const categoriasUnicas = new Set();
    dados.forEach(dado => {
        // Adiciona a categoria de cada produto ao Set.
        categoriasUnicas.add(dado.categoria);
    });

    // Converte o Set para um Array, ordena em ordem alfabética e adiciona "Todos" no início.
    const categorias = ["Todos", ...Array.from(categoriasUnicas).sort()];

    const headerSearchContainer = document.querySelector("header .search-container");
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
        // Adiciona um atributo de dados para facilitar o filtro.
        // Usamos toLowerCase() para garantir consistência, já que o filtro também usa.
        // O texto exibido (a.textContent) mantém a capitalização original.
        a.dataset.category = categoria.toLowerCase(); 
        li.appendChild(a);
        ul.appendChild(li);
    }

    // Cria o item de busca para o menu mobile
    const searchLi = document.createElement("li");
    searchLi.classList.add("search-menu-item");
    searchLi.innerHTML = `
        <a href="#" id="search-icon-mobile">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </a>
    `;
    // Move o container de busca do header para dentro do item de lista no menu
    searchLi.appendChild(headerSearchContainer);
    ul.prepend(searchLi); // Adiciona o item de busca no início da lista

    // Garante que o input e o botão tenham os IDs corretos para os listeners existentes
    headerSearchContainer.querySelector('input').id = 'input-busca';
    headerSearchContainer.querySelector('button').id = 'botao-busca';

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
        // Compara as categorias em minúsculas para garantir que o filtro funcione
        // independentemente da capitalização ("Aminoácidos" vs "aminoácidos").
        const produtosFiltrados = dados.filter(dado => dado.categoria.toLowerCase() === categoriaSelecionada);
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

    // Listener para o ícone de busca mobile
    const searchIconMobile = document.getElementById("search-icon-mobile");
    const searchMenuItem = document.querySelector(".search-menu-item");
    searchIconMobile.addEventListener("click", (e) => {
        e.preventDefault();
        searchMenuItem.classList.toggle("active");
        document.getElementById("input-busca").focus();
    });

    // Listener para fechar a busca ao clicar fora (mobile)
    document.addEventListener("click", (e) => {
        // Verifica se a busca está ativa e se o clique foi fora do componente de busca
        if (searchMenuItem.classList.contains("active") && !searchMenuItem.contains(e.target)) {
            // O e.target.closest('#search-icon-mobile') é para não fechar ao clicar no ícone para abrir
            searchMenuItem.classList.remove("active");
        }
    });
}

// 7. Função para ajustar a posição 'top' do menu de categorias dinamicamente
function ajustarPosicaoMenuCategoria() {
    const header = document.querySelector("header");
    const categoryMenu = document.querySelector(".category-menu");

    if (!header || !categoryMenu) return;

    // Função que calcula e aplica a posição
    const ajustarTop = () => {
        const headerHeight = header.offsetHeight;
        categoryMenu.style.top = `${headerHeight}px`;
    };

    // Ajusta a posição na primeira carga
    ajustarTop();

    // Usa ResizeObserver para reajustar caso a altura do header mude (ex: rotação do dispositivo)
    // Esta é uma boa prática para garantir que o layout não quebre dinamicamente.
    const observer = new ResizeObserver(ajustarTop);
    observer.observe(header);
}

// 8. Função para criar e gerenciar o botão "Voltar ao Topo"
function gerenciarBotaoVoltarAoTopo() {
    // Cria o elemento do botão
    const btnVoltarTopo = document.createElement("button");
    btnVoltarTopo.id = "btn-voltar-topo";
    btnVoltarTopo.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    `;
    // Adiciona o botão ao corpo do documento
    document.body.appendChild(btnVoltarTopo);

    // Adiciona um listener para o evento de rolagem da página
    window.addEventListener("scroll", () => {
        // Mostra o botão se o usuário rolar mais que 40% da altura da janela (viewport).
        // Isso faz o botão aparecer um pouco mais cedo.
        if (window.scrollY > window.innerHeight * 0.4) {
            btnVoltarTopo.classList.add("visible");
        } else {
            btnVoltarTopo.classList.remove("visible");
        }
    });

    // Adiciona um listener para o clique no botão
    btnVoltarTopo.addEventListener("click", () => {
        // Rola a página suavemente para o topo
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// Adiciona o evento de clique no botão de busca
botaoBusca.addEventListener("click", buscarProdutos);

// Chama a função para carregar os produtos assim que a página é carregada
carregarProdutos();

// Inicia a funcionalidade do botão "Voltar ao Topo"
gerenciarBotaoVoltarAoTopo();
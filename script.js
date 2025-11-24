// Seletores de elementos do DOM centralizados
const DOM = {
    cardContainer: document.querySelector(".card-container"),
    inputBusca: document.querySelector("#input-busca"),
    botaoBusca: document.querySelector("#botao-busca"),
    mainElement: document.querySelector("main"),
    header: document.querySelector("header"),
};

// Estado da aplicação
let dados = [];
let carrinho = [];
let closeModalTimer = null; // Timer para fechar o modal automaticamente

// Funções Utilitárias
const removerAcentos = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const formatarPrecoParaNumero = (preco) => parseFloat(preco.replace('R$', '').replace('.', '').replace(',', '.').trim());
const formatarNumeroParaBRL = (numero) => numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// 1. Função de inicialização da aplicação
async function carregarProdutos() {
    let resposta = await fetch("data.json");
    dados = await resposta.json();
    criarModalCarrinho();
    criarIconeCarrinho();
    renderizarCards(dados);
    criarMenuCategorias();
    adicionarListenersGlobais();
    carregarCarrinhoDoLocalStorage(); // Carrega o carrinho ao iniciar
}

// 2. Função para filtrar os produtos com base no termo de busca
function buscarProdutos() {
    const termoBuscado = removerAcentos(DOM.inputBusca.value.toLowerCase());
    
    // Filtra o array 'dados' procurando pelo termo no nome ou na descrição
    const produtosFiltrados = dados.filter(dado => {
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
    DOM.inputBusca.value = "";
}

// 3. Função para renderizar os cards na tela
function renderizarCards(dados) {
    // Limpa o container para não duplicar os produtos a cada busca
    DOM.cardContainer.innerHTML = "";

    for (let dado of dados) {
        let article = document.createElement("article");
        article.classList.add("card");
        article.innerHTML = `
        <div class="carousel-container" data-card-id="${dado.id}" data-single-image="${dado.imagens.length === 1}">
            <div class="carousel-track">
                ${dado.imagens.map(img => `<img src="${img}" alt="Imagem do produto ${dado.nome}" class="carousel-slide">`).join('')}
            </div>
            ${dado.imagens.length > 1 ? `
                <button class="carousel-btn prev" aria-label="Imagem anterior">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="carousel-btn next" aria-label="Próxima imagem">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
                <div class="carousel-dots">
                    ${dado.imagens.map((_, index) => `<span class="carousel-dot ${index === 0 ? 'active' : ''}" data-slide-to="${index}"></span>`).join('')}
                </div>
            ` : ''}
        </div>
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
        <div class="card-actions">
            <button class="btn-adicionar-carrinho" data-id="${dado.id}">Adicionar ao carrinho</button>
        </div>
        `
        DOM.cardContainer.appendChild(article);
    }

    // Após renderizar todos os cards, inicializa os carrosseis
    inicializarCarrosseis();

    // Adiciona a classe para animar a entrada dos cards.
    // Usamos um pequeno timeout para garantir que o navegador processe
    // a adição dos cards ao DOM antes de iniciar a transição.
    setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => card.classList.add('card-visible'));
    }, 50); // 50ms é suficiente
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
    const headerSearchContainer = DOM.header.querySelector(".search-container");
    // Move o container de busca do header para dentro do item de lista no menu
    searchLi.appendChild(headerSearchContainer);
    ul.prepend(searchLi); // Adiciona o item de busca no início da lista

    nav.appendChild(ul);
    // Insere o menu antes do elemento <main>
    document.body.insertBefore(nav, DOM.mainElement);

    // Ajusta a posição do menu de categorias dinamicamente
    const categoryMenu = document.querySelector(".category-menu");
    const observer = new ResizeObserver(() => categoryMenu.style.top = `${DOM.header.offsetHeight}px`);
    observer.observe(DOM.header);
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

    // Inicia a animação de fade-out dos cards atuais
    const cardsAtuais = document.querySelectorAll('.card');
    cardsAtuais.forEach(card => card.classList.remove('card-visible'));

    // Aguarda a animação de fade-out terminar (300ms) antes de renderizar os novos cards
    setTimeout(() => {
        // Filtra e renderiza os produtos
        if (categoriaSelecionada === "todos") {
            renderizarCards(dados); // Mostra todos os produtos
        } else {
            const produtosFiltrados = dados.filter(dado => dado.categoria.toLowerCase() === categoriaSelecionada);
            renderizarCards(produtosFiltrados);
        }
    }, 300); // Este tempo deve ser igual à duração da transição no CSS
}

// 6. Função para adicionar os listeners de clique
function adicionarListenersGlobais() {
    // Delegação de eventos para cliques no corpo do documento
    document.body.addEventListener("click", (e) => {
        const target = e.target;

        // Filtro por categoria (menu ou card)
        const categoryLink = target.closest('.product-category, .category-menu a');
        if (categoryLink && !categoryLink.id?.includes('search-icon')) {
            e.preventDefault();
            filtrarPorCategoria(categoryLink.dataset.category);
        }

        // Listener para o botão "Adicionar ao carrinho"
        const addToCartBtn = target.closest(".btn-adicionar-carrinho");
        if (addToCartBtn) {
            e.preventDefault();
            const productId = parseInt(addToCartBtn.dataset.id, 10);
            adicionarAoCarrinho(productId, addToCartBtn);
        }

        // Listener para o ícone de busca mobile
        const searchIconMobile = target.closest("#search-icon-mobile");
        if (searchIconMobile) {
            e.preventDefault();
            const searchMenuItem = searchIconMobile.closest(".search-menu-item");
            searchMenuItem.classList.toggle("active");
            DOM.inputBusca.focus();
        }

        // Listener para o ícone do carrinho (delegado)
        const cartIcon = target.closest(".cart-icon-container");
        if (cartIcon) {
            e.preventDefault();
            abrirModalCarrinho();
        }

        // Lógica para fechar a busca mobile ao clicar fora
        const searchMenuItem = document.querySelector(".search-menu-item");
        if (searchMenuItem && searchMenuItem.classList.contains("active") && !target.closest('.search-menu-item')) {
            searchMenuItem.classList.remove("active");
        }
    });
}

// Funções do Carrossel
// =================================================================

// Inicializa todos os carrosseis na página com funcionalidade de swipe
function inicializarCarrosseis() {
    const carrosseis = document.querySelectorAll('.carousel-container');
    carrosseis.forEach(carousel => {
        if (carousel.dataset.singleImage === 'true') return;

        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const slideCount = slides.length;
        const nextButton = carousel.querySelector('.carousel-btn.next');
        const prevButton = carousel.querySelector('.carousel-btn.prev');
        const dotsNav = carousel.querySelector('.carousel-dots');
        const dots = dotsNav ? Array.from(dotsNav.children) : [];

        let slideIndex = 0;
        let isDragging = false;
        let startPos = 0;
        let currentTranslate = 0;
        let prevTranslate = 0;

        const setPositionByIndex = () => {
            currentTranslate = slideIndex * -carousel.offsetWidth;
            prevTranslate = currentTranslate;
            track.style.transform = `translateX(${currentTranslate}px)`;
        };

        const moverParaSlide = (index) => {
            slideIndex = index;
            setPositionByIndex();
            track.style.transition = 'transform 0.4s ease-in-out';

            if (dots.length > 0) {
                dots.forEach(dot => dot.classList.remove('active'));
                dots[index].classList.add('active');
            }
        };

        nextButton.addEventListener('click', () => moverParaSlide((slideIndex + 1) % slideCount));
        prevButton.addEventListener('click', () => moverParaSlide((slideIndex - 1 + slideCount) % slideCount));
        dotsNav.addEventListener('click', e => {
            const targetDot = e.target.closest('.carousel-dot');
            if (!targetDot) return;
            moverParaSlide(parseInt(targetDot.dataset.slideTo, 10));
        });

        const getPositionX = (event) => event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;

        const dragStart = (event) => {
            isDragging = true;
            startPos = getPositionX(event);
            track.style.transition = 'none'; // Remove a transição durante o arraste
            carousel.style.cursor = 'grabbing';
        };

        const dragMove = (event) => {
            if (!isDragging) return;
            const currentPosition = getPositionX(event);
            currentTranslate = prevTranslate + currentPosition - startPos;
            track.style.transform = `translateX(${currentTranslate}px)`;
        };

        const dragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            const movedBy = currentTranslate - prevTranslate;
            carousel.style.cursor = 'grab';

            // Se o usuário arrastou mais de 50px, muda de slide
            if (movedBy < -50 && slideIndex < slideCount - 1) {
                slideIndex++;
            }
            if (movedBy > 50 && slideIndex > 0) {
                slideIndex--;
            }

            moverParaSlide(slideIndex);
        };

        // Adiciona os listeners de evento
        carousel.addEventListener('mousedown', dragStart);
        carousel.addEventListener('touchstart', dragStart, { passive: true });

        carousel.addEventListener('mousemove', dragMove);
        carousel.addEventListener('touchmove', dragMove, { passive: true });

        carousel.addEventListener('mouseup', dragEnd);
        carousel.addEventListener('mouseleave', dragEnd); // Termina o arraste se o mouse sair do carrossel
        carousel.addEventListener('touchend', dragEnd);

        // Previne o comportamento padrão de arrastar imagem do navegador
        slides.forEach(slide => slide.addEventListener('dragstart', (e) => e.preventDefault()));

        // Ajusta a posição se a janela for redimensionada
        window.addEventListener('resize', setPositionByIndex);
    });
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

// 10. Função para atualizar o contador visual do carrinho
function atualizarContadorCarrinho() {
    const cartCounter = document.getElementById("cart-counter");
    if (cartCounter) {
        // Soma a quantidade de todos os itens no carrinho
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        cartCounter.textContent = totalItens;
        cartCounter.classList.add('updated');
        setTimeout(() => cartCounter.classList.remove('updated'), 300);
    }
}

// 11. Função para adicionar um produto ao carrinho
function adicionarAoCarrinho(productId, buttonElement) {
    const produtoNoCarrinho = carrinho.find(item => item.id === productId);

    if (produtoNoCarrinho) {
        // Se o produto já existe no carrinho, apenas incrementa a quantidade
        produtoNoCarrinho.quantidade++;
    } else {
        // Se não existe, encontra o produto nos dados e adiciona ao carrinho com quantidade 1
        const produto = dados.find(d => d.id === productId);
        if (!produto) return; 
        carrinho.push(produto);
        // Adiciona a propriedade quantidade. É importante clonar o objeto para não alterar o 'dados' original.
        carrinho[carrinho.length - 1] = { ...produto, quantidade: 1 };
    }

    salvarCarrinhoNoLocalStorage();
    atualizarContadorCarrinho();

    // Fornece feedback visual no botão, apenas se o elemento for passado
    if (buttonElement) {
        buttonElement.textContent = "Adicionado!";
        buttonElement.classList.add("added");
        buttonElement.disabled = true; // Desabilita para evitar múltiplos cliques

        setTimeout(() => {
            buttonElement.textContent = "Adicionar ao carrinho";
            buttonElement.classList.remove("added");
            buttonElement.disabled = false;
        }, 2000); // Reseta o botão após 2 segundos
    }
}

// 12. Funções para criar e gerenciar o Modal do Carrinho
function criarModalCarrinho() {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'cart-modal-overlay';
    modalOverlay.classList.add('modal-overlay');

    modalOverlay.innerHTML = `
        <div class="modal-content" id="cart-modal-content">
            <button class="modal-close-btn" id="modal-close-btn" aria-label="Fechar modal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h2>Meu Carrinho</h2>
            <div id="cart-items-container">
                <!-- Os itens do carrinho serão inseridos aqui -->
            </div>
            <div id="cart-footer">
                <div class="cart-total">
                </div>
                <button id="btn-checkout" class="btn-checkout">Fechar Pedido</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Adiciona listeners para fechar o modal
    const closeBtn = document.getElementById('modal-close-btn');
    modalOverlay.addEventListener('click', (e) => {
        // Fecha se clicar no overlay (fundo) ou no botão de remover
        if (e.target === modalOverlay) {
            fecharModalCarrinho();
        } else if (e.target.closest('.cart-item-remove')) {
            const productId = parseInt(e.target.closest('.cart-item').dataset.id, 10);
            removerItemDoCarrinho(productId);
        } else if (e.target.closest('.quantity-btn')) {
            const productId = parseInt(e.target.closest('.cart-item').dataset.id, 10);
            const action = e.target.closest('.quantity-btn').dataset.action;
            atualizarQuantidade(productId, action);
        } else if (e.target.id === 'btn-checkout') {
            // Listener para o botão de finalizar pedido
            e.preventDefault();
            finalizarPedido();
        }
    });
    closeBtn.addEventListener('click', fecharModalCarrinho);

    // Fecha o modal com a tecla 'Escape'
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModalCarrinho();
        }
    });
}

function abrirModalCarrinho() {
    const modalOverlay = document.getElementById('cart-modal-overlay');
    renderizarItensCarrinho(); // Chama a função para renderizar os itens e o total
    modalOverlay.classList.add('visible');
    document.body.classList.add('body-no-scroll'); // Impede o scroll do fundo
}

function renderizarItensCarrinho() {
    const itemsContainer = document.getElementById('cart-items-container');
    const cartFooter = document.getElementById('cart-footer');

    // Limpa qualquer timer de fechamento automático anterior sempre que o carrinho for renderizado
    if (closeModalTimer) {
        clearInterval(closeModalTimer);
        closeModalTimer = null;
    }

    itemsContainer.innerHTML = '';

    if (carrinho.length === 0) {
        cartFooter.style.display = 'none'; // Esconde o rodapé se o carrinho estiver vazio

        // Inicia o contador para fechar o modal
        let countdown = 5; // 5 segundos
        itemsContainer.innerHTML = `<p class="cart-countdown-message">Seu carrinho está vazio. Fechando em ${countdown} segundos...</p>`;

        closeModalTimer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                itemsContainer.innerHTML = `<p class="cart-countdown-message">Seu carrinho está vazio. Fechando em ${countdown} segundos...</p>`;
            } else {
                fecharModalCarrinho(); // Fecha o modal quando o contador chega a zero
            }
        }, 1000);
    } else {
        const ul = document.createElement('ul');
        ul.classList.add('cart-items-list');
        let totalGeral = 0;

        carrinho.forEach(item => {
            const precoNumerico = formatarPrecoParaNumero(item.preco);
            const subtotal = precoNumerico * item.quantidade;
            totalGeral += subtotal;

            const li = document.createElement('li');
            li.classList.add('cart-item');
            li.dataset.id = item.id;

            li.innerHTML = `
                <img src="${item.imagens[0]}" alt="${item.nome}" class="cart-item-img">
                <div class="cart-item-info"> 
                    <div class="cart-item-details">
                        <span class="cart-item-name">${item.nome}</span>
                        <span class="cart-item-unit-price">${item.preco} (unid.)</span>
                    </div>
                    <div class="cart-item-main">                        
                        <div class="cart-item-controls">
                            <button class="quantity-btn" data-action="decrease" aria-label="Diminuir quantidade">-</button>
                            <span class="quantity-value">${item.quantidade}</span>
                            <button class="quantity-btn" data-action="increase" aria-label="Aumentar quantidade">+</button>
                        </div>
                    </div>
                    <span class="cart-item-subtotal">${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>                
                <button class="cart-item-remove" aria-label="Remover item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            ul.appendChild(li);
        });
        itemsContainer.appendChild(ul);

        // Atualiza o total geral no rodapé do modal
        const totalContainer = cartFooter.querySelector('.cart-total');
        totalContainer.innerHTML = `
            <span>Total Geral:</span>
            <span class="total-price">${formatarNumeroParaBRL(totalGeral)}</span>
        `;
        cartFooter.style.display = 'flex'; // Mostra o rodapé
    }
}

function atualizarQuantidade(productId, action) {
    const itemNoCarrinho = carrinho.find(item => item.id === productId);
    if (!itemNoCarrinho) return;

    if (action === 'increase') {
        itemNoCarrinho.quantidade++;
    } else if (action === 'decrease') {
        itemNoCarrinho.quantidade--;
        if (itemNoCarrinho.quantidade <= 0) {
            // Se a quantidade for 0 ou menos, remove o item
            removerItemDoCarrinho(productId);
            return; // Sai da função pois o item já foi removido
        }
    }

    salvarCarrinhoNoLocalStorage();
    atualizarContadorCarrinho();
    // Re-renderiza os itens no modal se ele estiver aberto
    if (document.getElementById('cart-modal-overlay').classList.contains('visible')) {
        renderizarItensCarrinho();
    }
}

function finalizarPedido() {
    const numeroWhatsapp = "5588900000000"; // Seu número de WhatsApp

    if (carrinho.length === 0) {
        // Idealmente, o botão não estaria visível, mas é uma boa prática ter essa verificação.
        alert("Seu carrinho está vazio. Adicione itens antes de finalizar o pedido.");
        return;
    }

    let mensagem = "Olá! Gostaria de fazer o seguinte pedido:\n\n";
    let totalGeral = 0;

    carrinho.forEach(item => {
        const precoNumerico = formatarPrecoParaNumero(item.preco);
        const subtotal = precoNumerico * item.quantidade;
        totalGeral += subtotal;
        mensagem += `*Produto:* ${item.nome}\n`;
        mensagem += `*Quantidade:* ${item.quantidade}\n`;
        mensagem += `*Subtotal:* ${formatarNumeroParaBRL(subtotal)}\n`;
        mensagem += "--------------------------------------\n";
    });

    mensagem += `\n*TOTAL GERAL:* ${formatarNumeroParaBRL(totalGeral)}`;

    // Codifica a mensagem para ser usada em uma URL
    const mensagemCodificada = encodeURIComponent(mensagem);
    const urlWhatsapp = `https://api.whatsapp.com/send?phone=${numeroWhatsapp}&text=${mensagemCodificada}`;

    // Abre o WhatsApp em uma nova aba
    window.open(urlWhatsapp, '_blank');

    // Fecha o modal do carrinho imediatamente para o usuário ver a página principal.
    fecharModalCarrinho();

    // Limpa o carrinho após um tempo para dar ao usuário a chance de confirmar o envio no WhatsApp.
    setTimeout(() => {
        carrinho = [];
        salvarCarrinhoNoLocalStorage();
        atualizarContadorCarrinho();
    }, 5000); // 5000 milissegundos = 5 segundos
}

function removerItemDoCarrinho(productId) {
    const itemElement = document.querySelector(`.cart-item[data-id="${productId}"]`);

    if (itemElement) {
        // Adiciona uma classe para iniciar a animação de remoção via CSS
        itemElement.classList.add('removing');

        setTimeout(() => {
            carrinho = carrinho.filter(item => item.id !== productId);
            salvarCarrinhoNoLocalStorage();
            atualizarContadorCarrinho();
            renderizarItensCarrinho();

        }, 300); // O tempo deve ser igual à duração da transição no CSS
    }
}

function salvarCarrinhoNoLocalStorage() {
    localStorage.setItem('meuCarrinho', JSON.stringify(carrinho));
}

function fecharModalCarrinho() {
    const modalOverlay = document.getElementById('cart-modal-overlay');
    // Garante que o timer seja limpo ao fechar o modal (seja manualmente ou automaticamente)
    if (closeModalTimer) {
        clearInterval(closeModalTimer);
        closeModalTimer = null;
    }
    modalOverlay.classList.remove('visible');
    document.body.classList.remove('body-no-scroll');
}

// 9. Função para criar e injetar o ícone do carrinho no header
function criarIconeCarrinho() {
    const cartIconContainer = document.createElement("div");
    cartIconContainer.classList.add("cart-icon-container");
    cartIconContainer.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span id="cart-counter" class="cart-counter">0</span>
    `;
    DOM.header.appendChild(cartIconContainer);

}

// Função para carregar o carrinho salvo no Local Storage
function carregarCarrinhoDoLocalStorage() {
    const carrinhoSalvo = localStorage.getItem('meuCarrinho');
    if (carrinhoSalvo) {
        carrinho = JSON.parse(carrinhoSalvo);
        atualizarContadorCarrinho();
    }
}

// Adiciona o evento de clique no botão de busca
DOM.botaoBusca.addEventListener("click", buscarProdutos);

// Chama a função para carregar os produtos assim que a página é carregada
carregarProdutos();

// Inicia a funcionalidade do botão "Voltar ao Topo"
gerenciarBotaoVoltarAoTopo();
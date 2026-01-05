const SENHA_CORRETA = "Gr!D"; // DEFINA SUA SENHA AQUI
const URL_API = "https://script.google.com/macros/s/AKfycbxbLYAFBdVjsyz3P7rQA5WF610FxjWC68ZD-xY9zzBKNgJ98qyBF_iGZD5C2mgJ0rWa/exec";

const corpoAgenda = document.getElementById('corpo-agenda');
const seletorData = document.getElementById('data');
const seletorMaquina = document.getElementById('maquina');
let reservasGlobais = {};

// Função para definir a data de hoje no seletor
function configurarDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
    const dia = String(hoje.getDate()).padStart(2, '0');
    
    const dataFormatada = `${ano}-${mes}-${dia}`;
    document.getElementById('data').value = dataFormatada;
}

// Chame a função imediatamente
configurarDataAtual();

async function carregarReservas() {
    corpoAgenda.innerHTML = '<tr><td colspan="3">Carregando horários...</td></tr>';
    try {
        const response = await fetch(URL_API);
        reservasGlobais = await response.json();
        atualizarAgenda();
    } catch (e) {
        corpoAgenda.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
    }
}

function atualizarAgenda() {
    corpoAgenda.innerHTML = '';
    const dataSelecionada = seletorData.value;
    const maquinaSelecionada = seletorMaquina.value;

    for (let hora = 0; hora < 24; hora++) {
        const horarioFormatado = `${hora}:00 - ${hora + 1}:00`;
        const chaveReserva = `${dataSelecionada}-M${maquinaSelecionada}-${hora}`;
        const nomeReserva = reservasGlobais[chaveReserva];

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${horarioFormatado}</td>
            <td class="${nomeReserva ? 'ocupado' : 'disponivel'}">
                ${nomeReserva ? `Reservado por: ${nomeReserva}` : 'Disponível'}
            </td>
            <td>
                ${nomeReserva 
                    ? '---' 
                    : `<input type="checkbox" class="chk-reserva" value="${chaveReserva}">`
                }
            </td>
        `;
        corpoAgenda.appendChild(tr);
    }
}

async function reservarSelecionados() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const orientador = document.getElementById('orientador').value;
    const senha = document.getElementById('senha-lab').value;
    const dataTxt = seletorData.value;
    const maquinaTxt = seletorMaquina.options[seletorMaquina.selectedIndex].text;

    // Validações
    if (senha !== SENHA_CORRETA) return alert("Senha incorreta!");
    if (!nome || !email || !orientador) return alert("Preencha todos os seus dados!");

    const selecionados = document.querySelectorAll('.chk-reserva:checked');
    if (selecionados.length === 0) return alert("Selecione pelo menos um horário!");

    if (!confirm(`Deseja confirmar ${selecionados.length} reserva(s)?`)) return;

    // Desativa o botão para evitar cliques duplos
    const btn = document.getElementById('btn-confirmar');
    btn.disabled = true;
    btn.innerText = "Processando...";

    // Envia cada reserva para a planilha
    for (let chk of selecionados) {
        try {
            await fetch(URL_API, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'reservar', 
                    chave: chk.value, 
                    nome: nome,
                    email: email,
                    orientador: orientador,
                    dataAgendamento: dataTxt,
                    maquina: maquinaTxt
                })
            });
        } catch (e) {
            console.error("Erro ao reservar bloco: " + chk.value);
        }
    }

    alert("Reservas concluídas!");
    document.getElementById('senha-lab').value = "";
    btn.disabled = false;
    btn.innerText = "Confirmar Reservas Selecionadas";
    carregarReservas();
}

seletorData.addEventListener('change', atualizarAgenda);
seletorMaquina.addEventListener('change', atualizarAgenda);
carregarReservas();
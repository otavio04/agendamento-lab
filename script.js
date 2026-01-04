const SENHA_CORRETA = "LAB123"; // DEFINA SUA SENHA AQUI
const URL_API = "https://script.google.com/macros/s/AKfycbxbLYAFBdVjsyz3P7rQA5WF610FxjWC68ZD-xY9zzBKNgJ98qyBF_iGZD5C2mgJ0rWa/exec";
const corpoAgenda = document.getElementById('corpo-agenda');
const seletorData = document.getElementById('data');
const seletorMaquina = document.getElementById('maquina');

let reservasGlobais = {};

async function carregarReservas() {
    corpoAgenda.innerHTML = '<tr><td colspan="3">Carregando horários...</td></tr>';
    try {
        const response = await fetch(URL_API);
        reservasGlobais = await response.json();
        atualizarAgenda();
    } catch (e) {
        corpoAgenda.innerHTML = '<tr><td colspan="3">Erro ao carregar dados. Verifique a URL da API.</td></tr>';
    }
}

function atualizarAgenda() {
    corpoAgenda.innerHTML = '';
    const dataSelecionada = seletorData.value;
    const maquinaSelecionada = seletorMaquina.value;

    for (let hora = 8; hora < 20; hora++) {
        const horarioFormatado = `${hora}:00 - ${hora + 1}:00`;
        const chaveReserva = `${dataSelecionada}-M${maquinaSelecionada}-${hora}`;
        const nomeReserva = reservasGlobais[chaveReserva];

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${horarioFormatado}</td>
            <td class="${nomeReserva ? 'ocupado' : 'disponivel'}">
                ${nomeReserva ? `Ocupado: ${nomeReserva}` : 'Livre'}
            </td>
            <td>
                ${nomeReserva 
                    ? `<button onclick="acao('cancelar', '${chaveReserva}')">Cancelar</button>` 
                    : `<button onclick="acao('reservar', '${chaveReserva}')">Reservar</button>`
                }
            </td>
        `;
        corpoAgenda.appendChild(tr);
    }
}

async function acao(tipo, chave) {
    // Captura os valores dos campos da página
    const nome = document.getElementById('nome').value;
    const matricula = document.getElementById('matricula').value;
    const orientador = document.getElementById('orientador').value;
    const senhaInformada = document.getElementById('senha-lab').value;

    // 1. Validação de Senha (para qualquer ação)
    if (senhaInformada !== SENHA_CORRETA) {
        alert("Senha do laboratório incorreta!");
        return;
    }

    // 2. Validação de campos vazios (apenas para reserva)
    if (tipo === 'reservar') {
        if (!nome || !matricula || !orientador) {
            alert("Por favor, preencha todos os campos (Nome, Matrícula e Orientador) antes de reservar.");
            return;
        }
    }

    // 3. Confirmação de cancelamento
    if (tipo === 'cancelar') {
        if (!confirm("Deseja realmente cancelar esta reserva?")) return;
    }

    // Exibe um feedback visual simples de carregamento
    corpoAgenda.style.opacity = "0.5";

    // 4. Envio para o Google Sheets
    try {
        await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify({ 
                action: tipo, 
                chave: chave, 
                nome: nome,
                matricula: matricula,
                orientador: orientador
            })
        });

        // Limpa a senha para segurança, mas mantém os dados do aluno para facilitar se ele quiser reservar mais blocos
        document.getElementById('senha-lab').value = ""; 
        
        // Recarrega os dados da planilha
        await carregarReservas();
    } catch (error) {
        alert("Erro ao processar a solicitação. Tente novamente.");
    } finally {
        corpoAgenda.style.opacity = "1";
    }
}

seletorData.addEventListener('change', atualizarAgenda);
seletorMaquina.addEventListener('change', atualizarAgenda);

// Inicia buscando os dados da planilha
carregarReservas();
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. TESTE DE SEGURANÇA DA CHAVE ---
if (!process.env.MINHA_CHAVE_SECRETA) {
    console.error("❌ ERRO GRAVE: A chave API não foi encontrada!");
    console.error("👉 Verifique se o arquivo se chama '.env' e não '.env.txt'");
    process.exit(1); // Mata o servidor se não tiver chave
}

const genAI = new GoogleGenerativeAI(process.env.MINHA_CHAVE_SECRETA);
// Usando o modelo Flash que vimos que funciona na tua conta
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post('/gerar-post', async (req, res) => {
    try {
        const { tema } = req.body;
        console.log(`📩 Recebi pedido sobre: "${tema}"`);

        const prompt = `
        Atue como um Especialista em Social Media.
        Crie 5 posts virais para o tema: "${tema}".
        
        IMPORTANTE:
        Retorne APENAS um JSON válido (Array de Objetos).
        SEM Markdown, SEM explicações antes ou depois.
        
        Estrutura obrigatória:
        [
            {
                "temaPrincipal": "Título chamativo",
                "textoApoio": "Texto curto",
                "cta": "Chamada para ação",
                "sugestaoImagem": "Descrição visual",
                "copy": "Legenda completa"
            }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        console.log("🤖 IA respondeu. Tratando dados...");

        // --- 2. LIMPEZA DE DADOS (Remove ```json e espaços) ---
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Tenta converter para JSON
        let dadosFinais;
        try {
            dadosFinais = JSON.parse(text);
        } catch (jsonError) {
            console.error("❌ A IA mandou texto inválido (não é JSON):", text);
            throw new Error("Falha ao interpretar resposta da IA.");
        }

        console.log("✅ Sucesso! Enviando 5 posts.");
        res.json(dadosFinais);

    } catch (error) {
        console.error("❌ ERRO NO SERVIDOR:", error.message);
        // Retorna erro formatado para o frontend não quebrar
        res.status(500).json({ erro: true, mensagem: error.message });
    }
});

// O Render diz qual porta usar (process.env.PORT) ou usa 3000 se for local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}!`));
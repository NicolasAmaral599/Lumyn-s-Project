import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Setup
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY not found in environment. AI features will be limited.");
  }
  
  const ai = new GoogleGenAI({ 
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context, systemInstruction } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...(context || []), { role: "user", parts: [{ text: message }] }],
        config: {
          systemInstruction: systemInstruction || "Você é o Lumyn, um assistente pessoal premium de IA e ecossistema de produtividade de última geração criado por laboratórios de elite no Vale do Silício. Seu papel é otimizar a performance, inteligência emocional e planejamento estratégico do usuário. Sua comunicação deve ser exclusivamente em português do Brasil, moderna, amigável, humana, empática e focada em visão. Use formatação markdown rica para dar destaque, listas elegantes e estrutura clara.",
        }
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.post("/api/ai/decide", async (req, res) => {
    try {
      const { problem, options } = req.body;
      const prompt = `Task: Perform a deep strategic analysis for the following scenario, in Brazilian Portuguese.
      Problem: "${problem}"
      Candidate Options: ${options.join(", ")}
      
      Required Response Format (JSON matches EXACTLY this schema, strings MUST be in Brazilian Portuguese):
      {
        "recommendation": "Sumário executivo sofisticado do melhor caminho estratégico a seguir",
        "options_analysis": [
          {
            "name": "Nome da Opção",
            "pros": ["Ponto Positivo 1", "Ponto Positivo 2"],
            "cons": ["Ponto Negativo 1", "Ponto Negativo 2"],
            "score": 85
          }
        ]
      }`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Você é um mentor consultivo e estrategista de altíssimo nível. Seu estilo de redação se adapta instantaneamente de acordo com o problema do usuário: Se for um assunto PESSOAL (como relacionamentos, namoro, amizades, saúde mental, dilemas íntimos, bem-estar, medos, hobbies), responda de forma extremamente humana, acolhedora, calorosa, empática, em tom de desenvolvimento pessoal e conexões legítimas, e NUNCA utilize termos como mercado, ROI, networking corporativo ou ações comerciais. Se for profissional, corporativo, acadêmico ou de negócios, utilize uma abordagem lógica e corporativa rica em estratégia, priorização de impacto empresarial e métricas de eficiência. Forneça todo o conteúdo do JSON em português brasileiro impecável, direto e extremamente inspirador.",
        }
      });
      
      res.json(JSON.parse(result.text || "{}"));
    } catch (error) {
      console.error("AI Decision Error:", error);
      res.status(500).json({ error: "Failed to analyze decision" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumyn server running on http://localhost:${PORT}`);
  });
}

startServer();

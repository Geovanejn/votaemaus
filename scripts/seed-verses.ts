import { storage } from "../server/storage";

async function populateBibleVerses() {
  const categories = ["Fé", "Sabedoria", "Esperança", "Amor", "Graça", "Soberania de Deus"];
  const totalTarget = 500;
  const batchSize = 20; // 20 por vez para não travar a IA

  console.log(`🚀 Iniciando população de ${totalTarget} versículos...`);

  for (let i = 0; i < totalTarget; i += batchSize) {
    try {
      // Aqui você chamaria sua função de IA (Gemini/OpenAI) 
      // pedindo: "Gere 20 versículos bíblicos com referência, texto e uma breve reflexão 
      // sob a perspectiva reformada presbiteriana em formato JSON"
      
      // Exemplo de como você inseriria no loop:
      // const verses = await aiProvider.generateVerses(batchSize); 
      // for (const v of verses) {
      //   await storage.createBibleVerse(v.reference, v.text, v.reflection, v.category);
      // }
      
      console.log(`✅ Lote de ${i + batchSize} versículos inserido.`);
    } catch (error) {
      console.error("❌ Erro no lote:", error);
    }
  }
}

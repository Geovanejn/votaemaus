import { useState } from "react";
import { CollectibleCard, CollectibleCardModal, type CardRarity } from "@/components/study/CollectibleCard";

const demoCards = [
  { id: 1, name: "Card Comum", rarity: "common" as CardRarity, description: "Exemplo de card comum sem efeitos" },
  { id: 2, name: "Card Raro", rarity: "rare" as CardRarity, description: "Exemplo de card raro com efeito de raio azul" },
  { id: 3, name: "Card Épico", rarity: "epic" as CardRarity, description: "Exemplo de card épico com efeito neon roxo" },
  { id: 4, name: "Card Lendário", rarity: "legendary" as CardRarity, description: "Exemplo de card lendário com efeito de chama" },
];

export default function DemoCardsPage() {
  const [selectedCard, setSelectedCard] = useState<typeof demoCards[0] | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Demo - Efeitos de Cards</h1>
        <p className="text-gray-400 text-center mb-8">Clique em um card para ver em tamanho maior</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 justify-items-center overflow-visible p-8">
          {demoCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center gap-2 overflow-visible">
              <CollectibleCard
                name={card.name}
                rarity={card.rarity}
                size="md"
                onClick={() => setSelectedCard(card)}
              />
              <span className="text-sm text-gray-300 capitalize">{card.rarity}</span>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-white mb-4">Tamanho Grande (Modal)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 justify-items-center overflow-visible p-8">
            {demoCards.map((card) => (
              <div key={`lg-${card.id}`} className="overflow-visible">
                <CollectibleCard
                  name={card.name}
                  rarity={card.rarity}
                  size="lg"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCard && (
        <CollectibleCardModal
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          card={{
            name: selectedCard.name,
            rarity: selectedCard.rarity,
            description: selectedCard.description,
            sourceType: "season",
            imageUrl: null,
          }}
        />
      )}
    </div>
  );
}

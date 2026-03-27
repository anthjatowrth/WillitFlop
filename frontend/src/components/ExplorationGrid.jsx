import ExplorationCard from "./ExplorationCard";

const CARDS = [
  {
    icon: "🎮",
    title: "Genres",
    href: "/market",
    description:
      "Quel genre indie a le meilleur taux de succès ? Quels tags et tendances le caractérisent ?",
  },
  {
    icon: "💲",
    title: "Prix",
    href: "/price",
    description:
      "À quel prix fixer son jeu ? La tranche de prix influence-t-elle vraiment les chances de succès ?",
  },
  {
    icon: "📅",
    title: "Années",
    description:
      "Comment le marché indie a-t-il évolué de 2015 à 2025 ? Quelles tendances ont émergé ?",
  },
  {
    icon: "🏆",
    title: "Facteurs de succès",
    description:
      "Twitch, DLC, prix, langues… Quels sont les vrais leviers qui font la différence ?",
  },
];

export default function ExplorationGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
      {CARDS.map((card) => (
        <ExplorationCard key={card.title} {...card} />
      ))}
    </div>
  );
}
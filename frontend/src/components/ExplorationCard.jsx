import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ExplorationCard({ icon, title, description, href = "#" }) {
  return (
    <Card className="rounded-none border border-gray-200 bg-white hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-6 flex flex-col gap-3">
        {/* Icon */}
        <div className="text-2xl">{icon}</div>

        {/* Title */}
        <h2 className="font-bold text-base text-black tracking-tight">{title}</h2>

        {/* Description */}
        <p className="text-sm text-gray-500 font-mono leading-relaxed">{description}</p>

        {/* CTA */}
        <Link to={href} className="text-sm text-primary font-mono tracking-wide group-hover:underline mt-1">
          Explorer →
        </Link>
      </CardContent>
    </Card>
  );
}
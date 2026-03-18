import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CardGame({ game }) {
  return (
    <Card key={game.id} className="relative mx-auto w-full max-w-sm pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35 rounded-t-lg" />
      <img
        src={game.header_image ?? 'https://avatar.vercel.sh/shadcn1'}
        alt={game.name}
        className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale dark:brightness-40 rounded-t-lg"
      />
      <CardHeader>
        <CardAction>
          <Badge variant="secondary"></Badge>
        </CardAction>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription>
          {game.short_description_clean}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full">View Game</Button>
      </CardFooter>
    </Card>
  )
}

import { es } from "date-fns/locale"
import { Badge } from "../ui/badge"
import { format } from "date-fns"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card"
import type { Poll } from "#/shared/types"
import { Link } from "@tanstack/react-router"

interface Props {
    poll: Pick<Poll, "name"|"description"|"slug"|"startDate"|"endDate"|"version"|"status">
}

const PollCard = ({poll}: Props) => {
  return (
    <Link to="/poll/update/$slug" params={{
        slug: poll.slug as string
    }} className="w-full h-full min-h-28 transition-transform duration-300 ease-in-out
              group-hover:scale-95 
              hover:scale-105">
    <Card className="p-4 gap-3 w-full h-full flex flex-col items-center justify-between">
            <CardHeader className="w-full p-0.5 gap-1">
              <CardTitle className="font-sgc text-2xl font-medium tracking-wide text-truncate line-clamp-2">{poll.name}</CardTitle>
              <CardDescription className="font-sg text-truncate line-clamp-4">{poll.description}</CardDescription>
            </CardHeader>
            <CardFooter className="w-full p-0.5 gap-1">
              <Badge>{poll.status}</Badge>
              <Badge variant={"secondary"} className="text-xs font-sg font-thin">
              <span className="text-accent-foreground text-xs">{format(poll.startDate, "dd/MM/yyyy", { locale: es })} </span> 
                { poll.endDate && `...` }
                { poll.endDate && 
                <span className="text-accent-foreground"> {format(poll.endDate, "dd/MM/yyyy", { locale: es }).toString()}</span>} 
              </Badge>
              <Badge variant={'outline'} className="font-sg text-xs font-semibold text-accent-foreground">V{poll.version}</Badge>
            </CardFooter>
          </Card>
    </Link>
  )
}

export default PollCard
import { createFileRoute } from "@tanstack/react-router";
import { Bench } from "@/components/circulator/bench";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Bench />;
}

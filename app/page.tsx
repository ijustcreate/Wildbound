import { redirect } from "next/navigation";

export default function Home() {
  redirect("/viewer/index.html");
}

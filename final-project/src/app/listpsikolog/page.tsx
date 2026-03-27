import type { Metadata } from "next"
import ListPsikolog from "@/components/listPsikolog"

export const metadata: Metadata = {
  title: "List Psikolog",
  description: "See list of doctors",
}

export default function ListPsikologPage() {
  return (
    <>
      <ListPsikolog />
    </>
  ) 
}
import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function QuotesListPage() {
  const items = await getListByLabel(FileLabel.QUOTES)
  return <ListPage title="Quotes" items={items} />
}

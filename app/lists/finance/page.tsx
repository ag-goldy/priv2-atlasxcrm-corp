import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function FinanceListPage() {
  const items = await getListByLabel(FileLabel.INVOICES)
  return <ListPage title="Finance" items={items} />
}

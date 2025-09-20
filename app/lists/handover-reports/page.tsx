import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function HandoverReportsListPage() {
  const items = await getListByLabel(FileLabel.HANDOVER_REPORTS)
  return <ListPage title="Handover Reports" items={items} />
}

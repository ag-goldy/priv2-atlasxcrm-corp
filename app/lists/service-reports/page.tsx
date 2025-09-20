import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function ServiceReportsListPage() {
  const items = await getListByLabel(FileLabel.SERVICE_REPORTS)
  return <ListPage title="Service Reports" items={items} />
}

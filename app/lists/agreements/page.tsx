import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function AgreementsListPage() {
  const items = await getListByLabel(FileLabel.AGREEMENTS)
  return <ListPage title="Agreements" items={items} />
}

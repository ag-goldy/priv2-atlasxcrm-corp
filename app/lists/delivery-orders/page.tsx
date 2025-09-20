import { FileLabel } from "@prisma/client"

import { getListByLabel } from "../../../lib/lists/queries"
import { ListPage } from "../components/ListPage"

export default async function DeliveryOrdersListPage() {
  const items = await getListByLabel(FileLabel.DELIVERY_ORDERS)
  return <ListPage title="Delivery Orders" items={items} />
}

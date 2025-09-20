import DealsPageClient from "./pageClient"
import { getDeals } from "../../lib/deals/queries"

export default async function DealsPage() {
  const deals = await getDeals()
  return <DealsPageClient deals={deals} />
}

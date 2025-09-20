"use server"

import { DealStatus, DealType, Prisma } from "@prisma/client"

import { prisma } from "../prisma"

const statusOrder: DealStatus[] = [
  DealStatus.NOT_STARTED,
  DealStatus.PENDING_TO_QUOTE,
  DealStatus.PENDING_VENDOR_QUOTE,
  DealStatus.WAITING_FOR_PO,
  DealStatus.WAITING_FOR_CONFIRMATION,
  DealStatus.IN_PRE_SALES_STAGE,
]

const WAITING_FOR_CONFIRMATION_INDEX = statusOrder.indexOf(DealStatus.WAITING_FOR_CONFIRMATION)

function resolveActor(actorUpn?: string | null) {
  if (actorUpn && actorUpn.trim()) {
    return actorUpn.trim()
  }
  return "system@atlasxcrm.local"
}

async function logAudit(dealId: string, action: string, actorUpn: string, payload: Record<string, unknown>) {
  await prisma.audit.create({
    data: {
      dealId,
      action,
      actorUpn,
      payload: payload as Prisma.JsonObject,
    },
  })
}

function ensureReason(reason: string) {
  if (!reason || !reason.trim()) {
    throw new Error("Lost reason cannot be empty")
  }
}

function assertStatusTransition(current: DealStatus, next: DealStatus) {
  const currentIndex = statusOrder.indexOf(current)
  const nextIndex = statusOrder.indexOf(next)

  if (currentIndex === -1 || nextIndex === -1) {
    throw new Error("Unknown deal status")
  }

  if (nextIndex <= currentIndex) {
    throw new Error("Cannot regress or repeat deal status")
  }

  if (nextIndex !== currentIndex + 1) {
    throw new Error("Invalid status transition")
  }
}

export async function advanceStatus(dealId: string, nextStatus: DealStatus, actorUpn?: string | null) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      status: true,
      isLost: true,
      type: true,
    },
  })

  if (!deal) {
    throw new Error("Deal not found")
  }

  if (deal.isLost) {
    throw new Error("Cannot advance a lost deal")
  }

  assertStatusTransition(deal.status, nextStatus)

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: nextStatus,
    },
  })

  await logAudit(dealId, "advanceStatus", resolveActor(actorUpn), {
    previousStatus: deal.status,
    nextStatus,
  })

  return updated
}

export async function setTypeConfirmed(dealId: string, actorUpn?: string | null) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      type: true,
      status: true,
      isLost: true,
    },
  })

  if (!deal) {
    throw new Error("Deal not found")
  }

  if (deal.isLost) {
    throw new Error("Cannot confirm a lost deal")
  }

  const updates: Prisma.DealUpdateInput = {
    type: DealType.CONFIRMED,
  }

  const currentStatusIndex = statusOrder.indexOf(deal.status)
  if (currentStatusIndex !== -1 && currentStatusIndex < WAITING_FOR_CONFIRMATION_INDEX) {
    updates.status = DealStatus.WAITING_FOR_CONFIRMATION
  }

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: updates,
  })

  await logAudit(dealId, "setTypeConfirmed", resolveActor(actorUpn), {
    previousType: deal.type,
    previousStatus: deal.status,
    newType: DealType.CONFIRMED,
    newStatus: updates.status ?? deal.status,
  })

  return updated
}

export async function setLost(
  dealId: string,
  reason: string,
  altOpportunity?: string | null,
  actorUpn?: string | null
) {
  ensureReason(reason)

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      isLost: true,
    },
  })

  if (!deal) {
    throw new Error("Deal not found")
  }

  if (deal.isLost) {
    throw new Error("Deal already marked as lost")
  }

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      isLost: true,
      isCompleted: false,
      lostReason: reason.trim(),
      altOpportunity: altOpportunity ?? null,
    },
  })

  await logAudit(dealId, "setLost", resolveActor(actorUpn), {
    reason: reason.trim(),
    altOpportunity: altOpportunity ?? null,
  })

  return updated
}

export async function setCompleted(dealId: string, actorUpn?: string | null) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      type: true,
      isCompleted: true,
      isLost: true,
    },
  })

  if (!deal) {
    throw new Error("Deal not found")
  }

  if (deal.isLost) {
    throw new Error("Cannot complete a lost deal")
  }

  if (deal.type !== DealType.CONFIRMED) {
    throw new Error("Deal must be CONFIRMED before completion")
  }

  if (deal.isCompleted) {
    return deal
  }

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      isCompleted: true,
    },
  })

  await logAudit(dealId, "setCompleted", resolveActor(actorUpn), {})

  return updated
}

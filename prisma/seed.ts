import { PrismaClient } from "@prisma/client"
import seedData from "./seed-data.json"

const prisma = new PrismaClient()

async function main() {
  // Check if data already exists
  const existingLoads = await prisma.load.count()
  if (existingLoads > 0) {
    console.log(`Database already has ${existingLoads} loads — skipping seed.`)
    return
  }

  console.log("Seeding database...")

  // Seed loads
  for (const load of seedData.loads) {
    await prisma.load.create({
      data: {
        id: load.id,
        origin: load.origin,
        destination: load.destination,
        pickupDatetime: new Date(load.pickupDatetime),
        deliveryDatetime: new Date(load.deliveryDatetime),
        equipmentType: load.equipmentType,
        loadboardRate: load.loadboardRate,
        notes: load.notes,
        weight: load.weight,
        numOfPieces: load.numOfPieces,
        miles: load.miles,
        dimensions: load.dimensions,
        commodityType: load.commodityType,
      },
    })
  }
  console.log(`  Seeded ${seedData.loads.length} loads`)

  // Seed calls
  for (const call of seedData.calls) {
    await prisma.call.create({
      data: {
        callId: call.callId,
        status: call.status as "started" | "ended",
        outcome: call.outcome,
        durationSeconds: call.durationSeconds,
        carrierName: call.carrierName,
        startedAt: new Date(call.startedAt),
        endedAt: call.endedAt ? new Date(call.endedAt) : null,
        summary: call.summary,
        sentiment: call.sentiment,
        negotiatedRate: call.negotiatedRate,
        stagesReached: call.stagesReached ?? undefined,
        metadata: call.metadata ?? undefined,
      },
    })
  }
  console.log(`  Seeded ${seedData.calls.length} calls`)

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

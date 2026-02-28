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

  console.log("Seed complete.")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter and client
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seeding...");

  // ============================================
  // 1. ADMIN USER
  // ============================================
  const adminEmail = "admin@gymmembership.com";
  const adminPassword = "Admin@123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("⚠️  Admin user already exists, skipping...");
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        fullName: "System Administrator",
        phone: "+6281234567890",
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: ${admin.role}`);
  }

  // ============================================
  // 2. MEMBERSHIP PLANS
  // ============================================
  console.log("\n📋 Seeding Membership Plans...");

  const membershipPlansData = [
    {
      name: "Basic",
      description: "Paket dasar untuk pemula dengan akses gym standar",
      duration: 30,
      price: 150000,
      features: ["Akses Gym", "Locker", "Free Parking"],
      maxCheckInsPerDay: 1,
    },
    {
      name: "Standard",
      description: "Paket standar dengan akses tambahan ke fasilitas",
      duration: 30,
      price: 300000,
      features: [
        "Akses Gym",
        "Locker",
        "Free Parking",
        "Akses Kolam Renang",
        "Towel Service",
      ],
      maxCheckInsPerDay: 2,
    },
    {
      name: "Premium",
      description: "Paket premium dengan semua fasilitas dan personal trainer",
      duration: 30,
      price: 500000,
      features: [
        "Akses Gym 24/7",
        "Locker Premium",
        "Free Parking",
        "Akses Kolam Renang",
        "Sauna & Steam Room",
        "Towel Service",
        "Personal Trainer 2x/minggu",
        "Nutrition Consultation",
      ],
      maxCheckInsPerDay: 3,
    },
    {
      name: "VIP Annual",
      description: "Paket VIP tahunan dengan semua benefit eksklusif",
      duration: 365,
      price: 5000000,
      features: [
        "Akses Gym 24/7",
        "Locker Premium Dedicated",
        "Free Valet Parking",
        "Akses Semua Fasilitas",
        "Sauna & Steam Room",
        "Premium Towel Service",
        "Personal Trainer 4x/minggu",
        "Nutrition & Diet Plan",
        "Body Composition Analysis",
        "Priority Class Booking",
        "Guest Pass 5x/bulan",
      ],
      maxCheckInsPerDay: 5,
    },
    {
      name: "Student",
      description: "Paket khusus untuk mahasiswa dengan harga terjangkau",
      duration: 30,
      price: 100000,
      features: ["Akses Gym (Jam 06:00-16:00)", "Locker", "Free Parking"],
      maxCheckInsPerDay: 1,
    },
  ];

  for (const planData of membershipPlansData) {
    const existingPlan = await prisma.membershipPlan.findFirst({
      where: { name: planData.name },
    });

    if (!existingPlan) {
      await prisma.membershipPlan.create({
        data: planData,
      });
      console.log(`   ✅ Membership Plan "${planData.name}" created`);
    } else {
      console.log(`   ⚠️  Membership Plan "${planData.name}" already exists`);
    }
  }

  // ============================================
  // 3. TRAINERS
  // ============================================
  console.log("\n🏋️ Seeding Trainers...");

  const trainersData = [
    {
      name: "Budi Santoso",
      email: "budi.santoso@gym.com",
      phone: "+6281234567891",
      specialization: ["Weight Training", "Bodybuilding", "Strength Training"],
      bio: "Certified personal trainer dengan pengalaman 8 tahun di industri fitness. Spesialisasi dalam program pembentukan otot dan kekuatan.",
      certifications: [
        "NASM Certified Personal Trainer",
        "ACE Fitness Nutrition Specialist",
        "First Aid & CPR Certified",
      ],
    },
    {
      name: "Siti Rahayu",
      email: "siti.rahayu@gym.com",
      phone: "+6281234567892",
      specialization: ["Yoga", "Pilates", "Meditation"],
      bio: "Yoga instructor bersertifikat internasional dengan fokus pada mind-body connection. Mengajar yoga sejak 2015.",
      certifications: [
        "RYT-500 Yoga Alliance",
        "Pilates Mat Certification",
        "Mindfulness Meditation Teacher",
      ],
    },
    {
      name: "Agus Pratama",
      email: "agus.pratama@gym.com",
      phone: "+6281234567893",
      specialization: ["HIIT", "CrossFit", "Functional Training"],
      bio: "Mantan atlet nasional yang sekarang fokus membantu member mencapai fitness goals melalui high-intensity training.",
      certifications: [
        "CrossFit Level 2 Trainer",
        "HIIT Specialist Certification",
        "TRX Suspension Training",
      ],
    },
    {
      name: "Dewi Lestari",
      email: "dewi.lestari@gym.com",
      phone: "+6281234567894",
      specialization: ["Zumba", "Aerobics", "Dance Fitness"],
      bio: "Dance fitness instructor yang energik dengan passion untuk membuat olahraga menyenangkan melalui musik dan gerakan.",
      certifications: [
        "Zumba Instructor Network (ZIN)",
        "AFAA Group Fitness Instructor",
        "Les Mills BODYJAM Certified",
      ],
    },
    {
      name: "Riko Wijaya",
      email: "riko.wijaya@gym.com",
      phone: "+6281234567895",
      specialization: ["Boxing", "Muay Thai", "MMA"],
      bio: "Former professional boxer dengan 5 tahun pengalaman melatih. Fokus pada teknik, kondisi fisik, dan self-defense.",
      certifications: [
        "USA Boxing Coach",
        "Muay Thai Association Certified",
        "Krav Maga Instructor Level 2",
      ],
    },
    {
      name: "Maya Putri",
      email: "maya.putri@gym.com",
      phone: "+6281234567896",
      specialization: ["Spinning", "Cycling", "Cardio Training"],
      bio: "Spinning instructor dengan energi tinggi yang akan memotivasi Anda untuk mencapai target cardio.",
      certifications: [
        "Schwinn Cycling Certified",
        "ACE Group Fitness Instructor",
        "Heart Rate Training Specialist",
      ],
    },
    {
      name: "Andi Kurniawan",
      email: "andi.kurniawan@gym.com",
      phone: "+6281234567897",
      specialization: ["Swimming", "Aqua Aerobics", "Rehabilitation Training"],
      bio: "Mantan perenang nasional dengan keahlian khusus dalam aquatic fitness dan rehabilitasi cedera melalui latihan air.",
      certifications: [
        "Aquatic Exercise Association Certified",
        "Swimming Instructor License",
        "Aquatic Therapy & Rehab Institute",
      ],
    },
    {
      name: "Linda Sari",
      email: "linda.sari@gym.com",
      phone: "+6281234567898",
      specialization: ["Nutrition", "Weight Loss", "Body Transformation"],
      bio: "Nutrition specialist dan personal trainer dengan fokus pada transformasi tubuh menyeluruh melalui kombinasi diet dan exercise.",
      certifications: [
        "Precision Nutrition Level 2",
        "ISSA Certified Fitness Trainer",
        "Weight Management Specialist",
      ],
    },
  ];

  const createdTrainers: { id: string; name: string }[] = [];

  for (const trainerData of trainersData) {
    const existingTrainer = await prisma.trainer.findUnique({
      where: { email: trainerData.email },
    });

    if (!existingTrainer) {
      const trainer = await prisma.trainer.create({
        data: trainerData,
      });
      createdTrainers.push({ id: trainer.id, name: trainer.name });
      console.log(`   ✅ Trainer "${trainerData.name}" created`);
    } else {
      createdTrainers.push({
        id: existingTrainer.id,
        name: existingTrainer.name,
      });
      console.log(`   ⚠️  Trainer "${trainerData.name}" already exists`);
    }
  }

  // ============================================
  // 4. GYM CLASSES
  // ============================================
  console.log("\n🧘 Seeding Gym Classes...");

  // Get all trainers for class assignment
  const allTrainers = await prisma.trainer.findMany();

  if (allTrainers.length === 0) {
    console.log("   ⚠️  No trainers found, skipping class seeding...");
  } else {
    // Helper function to get next occurrence of a day
    const getNextDayOfWeek = (
      dayOfWeek: number,
      hour: number,
      minute: number
    ): Date => {
      const now = new Date();
      const result = new Date(now);
      result.setDate(now.getDate() + ((dayOfWeek + 7 - now.getDay()) % 7 || 7));
      result.setHours(hour, minute, 0, 0);
      return result;
    };

    // Find trainers by specialization
    const findTrainerBySpec = (spec: string) => {
      return (
        allTrainers.find((t) =>
          t.specialization.some((s) =>
            s.toLowerCase().includes(spec.toLowerCase())
          )
        ) || allTrainers[0]
      );
    };

    const classesData = [
      // YOGA CLASSES
      {
        name: "Morning Yoga Flow",
        description:
          "Mulai hari dengan yoga flow yang menyegarkan. Cocok untuk semua level.",
        trainerId: findTrainerBySpec("yoga").id,
        schedule: getNextDayOfWeek(1, 6, 30), // Monday 06:30
        duration: 60,
        capacity: 20,
        type: "yoga",
      },
      {
        name: "Power Yoga",
        description:
          "Yoga dengan intensitas lebih tinggi untuk membangun kekuatan dan fleksibilitas.",
        trainerId: findTrainerBySpec("yoga").id,
        schedule: getNextDayOfWeek(3, 18, 0), // Wednesday 18:00
        duration: 75,
        capacity: 15,
        type: "yoga",
      },
      {
        name: "Gentle Yoga & Meditation",
        description:
          "Sesi yoga lembut diakhiri dengan meditasi untuk relaksasi total.",
        trainerId: findTrainerBySpec("yoga").id,
        schedule: getNextDayOfWeek(5, 19, 0), // Friday 19:00
        duration: 90,
        capacity: 25,
        type: "yoga",
      },

      // HIIT CLASSES
      {
        name: "HIIT Blast",
        description:
          "High Intensity Interval Training untuk membakar kalori maksimal dalam waktu singkat.",
        trainerId: findTrainerBySpec("hiit").id,
        schedule: getNextDayOfWeek(1, 7, 0), // Monday 07:00
        duration: 45,
        capacity: 25,
        type: "hiit",
      },
      {
        name: "Tabata Challenge",
        description:
          "Latihan Tabata 20 detik on, 10 detik off untuk kardio dan kekuatan.",
        trainerId: findTrainerBySpec("hiit").id,
        schedule: getNextDayOfWeek(3, 6, 30), // Wednesday 06:30
        duration: 30,
        capacity: 20,
        type: "hiit",
      },
      {
        name: "CrossFit WOD",
        description:
          "Workout of the Day dengan variasi gerakan functional fitness.",
        trainerId: findTrainerBySpec("crossfit").id,
        schedule: getNextDayOfWeek(5, 17, 0), // Friday 17:00
        duration: 60,
        capacity: 15,
        type: "crossfit",
      },

      // DANCE & AEROBICS
      {
        name: "Zumba Party",
        description:
          "Latihan kardio yang menyenangkan dengan musik Latin dan internasional.",
        trainerId: findTrainerBySpec("zumba").id,
        schedule: getNextDayOfWeek(2, 18, 30), // Tuesday 18:30
        duration: 60,
        capacity: 30,
        type: "zumba",
      },
      {
        name: "Aerobic Dance",
        description: "Kelas aerobik klasik dengan gerakan dance yang energik.",
        trainerId: findTrainerBySpec("aerobics").id,
        schedule: getNextDayOfWeek(4, 9, 0), // Thursday 09:00
        duration: 50,
        capacity: 35,
        type: "aerobics",
      },
      {
        name: "Body Jam",
        description:
          "Dance workout dengan berbagai genre musik dari hip-hop hingga EDM.",
        trainerId: findTrainerBySpec("dance").id,
        schedule: getNextDayOfWeek(6, 10, 0), // Saturday 10:00
        duration: 55,
        capacity: 30,
        type: "dance",
      },

      // SPINNING/CYCLING
      {
        name: "Spin & Burn",
        description:
          "Indoor cycling dengan interval training untuk membakar lemak efektif.",
        trainerId: findTrainerBySpec("spinning").id,
        schedule: getNextDayOfWeek(1, 18, 0), // Monday 18:00
        duration: 45,
        capacity: 20,
        type: "spinning",
      },
      {
        name: "Rhythm Ride",
        description:
          "Spinning session yang disinkronkan dengan beat musik untuk pengalaman immersive.",
        trainerId: findTrainerBySpec("cycling").id,
        schedule: getNextDayOfWeek(4, 7, 0), // Thursday 07:00
        duration: 50,
        capacity: 20,
        type: "spinning",
      },

      // MARTIAL ARTS
      {
        name: "Boxing Basics",
        description:
          "Pelajari dasar-dasar boxing untuk fitness dan self-defense.",
        trainerId: findTrainerBySpec("boxing").id,
        schedule: getNextDayOfWeek(2, 19, 0), // Tuesday 19:00
        duration: 60,
        capacity: 15,
        type: "boxing",
      },
      {
        name: "Muay Thai Conditioning",
        description:
          "Latihan conditioning dengan teknik Muay Thai untuk full body workout.",
        trainerId: findTrainerBySpec("muay thai").id,
        schedule: getNextDayOfWeek(4, 19, 0), // Thursday 19:00
        duration: 60,
        capacity: 12,
        type: "martial-arts",
      },
      {
        name: "Kickboxing Cardio",
        description:
          "Kombinasi gerakan kickboxing untuk kardio yang intens dan menyenangkan.",
        trainerId: findTrainerBySpec("boxing").id,
        schedule: getNextDayOfWeek(6, 9, 0), // Saturday 09:00
        duration: 50,
        capacity: 20,
        type: "kickboxing",
      },

      // STRENGTH TRAINING
      {
        name: "Pump It Up",
        description:
          "Kelas barbell dengan musik yang memotivasi untuk membentuk otot.",
        trainerId: findTrainerBySpec("weight").id,
        schedule: getNextDayOfWeek(1, 12, 0), // Monday 12:00
        duration: 55,
        capacity: 25,
        type: "strength",
      },
      {
        name: "Core Crusher",
        description:
          "Fokus pada penguatan core dan abs untuk postur yang lebih baik.",
        trainerId: findTrainerBySpec("strength").id,
        schedule: getNextDayOfWeek(3, 12, 0), // Wednesday 12:00
        duration: 30,
        capacity: 20,
        type: "core",
      },
      {
        name: "Total Body Conditioning",
        description:
          "Latihan full body dengan kombinasi cardio dan strength training.",
        trainerId: findTrainerBySpec("functional").id,
        schedule: getNextDayOfWeek(5, 12, 0), // Friday 12:00
        duration: 60,
        capacity: 20,
        type: "conditioning",
      },

      // PILATES
      {
        name: "Mat Pilates",
        description:
          "Pilates di matras untuk core strength dan body awareness.",
        trainerId: findTrainerBySpec("pilates").id,
        schedule: getNextDayOfWeek(2, 10, 0), // Tuesday 10:00
        duration: 50,
        capacity: 15,
        type: "pilates",
      },
      {
        name: "Pilates Fusion",
        description:
          "Kombinasi pilates dengan yoga dan stretching untuk fleksibilitas.",
        trainerId: findTrainerBySpec("pilates").id,
        schedule: getNextDayOfWeek(4, 10, 0), // Thursday 10:00
        duration: 55,
        capacity: 15,
        type: "pilates",
      },

      // AQUA FITNESS
      {
        name: "Aqua Aerobics",
        description:
          "Aerobik di kolam renang, rendah impact tapi tinggi efektivitas.",
        trainerId: findTrainerBySpec("aqua").id,
        schedule: getNextDayOfWeek(2, 8, 0), // Tuesday 08:00
        duration: 45,
        capacity: 15,
        type: "aqua",
      },
      {
        name: "Swim Technique",
        description:
          "Kelas untuk memperbaiki teknik renang, cocok untuk semua level.",
        trainerId: findTrainerBySpec("swimming").id,
        schedule: getNextDayOfWeek(6, 7, 0), // Saturday 07:00
        duration: 60,
        capacity: 10,
        type: "swimming",
      },

      // SPECIAL CLASSES
      {
        name: "Senior Fitness",
        description:
          "Kelas khusus untuk usia 50+ dengan gerakan aman dan efektif.",
        trainerId: findTrainerBySpec("rehabilitation").id,
        schedule: getNextDayOfWeek(3, 9, 0), // Wednesday 09:00
        duration: 45,
        capacity: 15,
        type: "senior",
      },
      {
        name: "Stretching & Recovery",
        description:
          "Sesi stretching dan foam rolling untuk recovery setelah latihan intens.",
        trainerId: findTrainerBySpec("yoga").id,
        schedule: getNextDayOfWeek(0, 16, 0), // Sunday 16:00
        duration: 45,
        capacity: 20,
        type: "recovery",
      },
      {
        name: "Body Transformation Workshop",
        description:
          "Workshop mingguan dengan fokus pada nutrition dan exercise untuk transformasi tubuh.",
        trainerId: findTrainerBySpec("weight loss").id,
        schedule: getNextDayOfWeek(6, 14, 0), // Saturday 14:00
        duration: 90,
        capacity: 20,
        type: "workshop",
      },
    ];

    for (const classData of classesData) {
      // Check if class with same name and schedule exists
      const existingClass = await prisma.gymClass.findFirst({
        where: {
          name: classData.name,
          schedule: classData.schedule,
        },
      });

      if (!existingClass) {
        await prisma.gymClass.create({
          data: classData,
        });
        console.log(`   ✅ Class "${classData.name}" created`);
      } else {
        console.log(`   ⚠️  Class "${classData.name}" already exists`);
      }
    }
  }

  // ============================================
  // 5. SAMPLE USER (for testing)
  // ============================================
  console.log("\n👤 Seeding Sample User...");

  const sampleUserEmail = "user@example.com";
  const sampleUserPassword = "User@123!";

  const existingSampleUser = await prisma.user.findUnique({
    where: { email: sampleUserEmail },
  });

  if (!existingSampleUser) {
    const hashedPassword = await bcrypt.hash(sampleUserPassword, 12);

    await prisma.user.create({
      data: {
        email: sampleUserEmail,
        password: hashedPassword,
        fullName: "John Doe",
        phone: "+6281234500000",
        dateOfBirth: new Date("1995-05-15"),
        gender: "MALE",
        address: "Jl. Contoh No. 123, Jakarta",
        role: "USER",
        status: "ACTIVE",
      },
    });

    console.log(`   ✅ Sample user created`);
    console.log(`      Email: ${sampleUserEmail}`);
    console.log(`      Password: ${sampleUserPassword}`);
  } else {
    console.log(`   ⚠️  Sample user already exists`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Database seeding completed!");
  console.log("=".repeat(50));
  console.log("\n📝 Summary:");
  console.log("   - Admin User: admin@gymmembership.com / Admin@123!");
  console.log("   - Sample User: user@example.com / User@123!");
  console.log("   - Membership Plans: 5 plans");
  console.log("   - Trainers: 8 trainers");
  console.log("   - Gym Classes: 24 classes");
  console.log("\n⚠️  IMPORTANT: Change passwords after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

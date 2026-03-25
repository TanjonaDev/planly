import { PrismaClient, UserRole, DayOfWeek, MissionStatus, AbsenceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean
  await prisma.absence.deleteMany();
  await prisma.checklistResult.deleteMany();
  await prisma.missionPhoto.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.site.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.session.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // ========== GÉRANT ==========
  const gerant = await prisma.user.create({
    data: {
      phone: "+33760388422",
      email: "tanjona.rakotoarisoa@gmail.com",
      firstName: "Mohamed",
      lastName: "B.",
      role: UserRole.GERANT,
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "MB Propreté",
      ownerId: gerant.id,
    },
  });

  // ========== EMPLOYÉS ==========
  // Chaque employé a son propre numéro — requis pour le VerificationToken (webhook SMS)
  // Ahmed garde le vrai numéro Twilio pour tester la vue employé + réception SMS
  const employeesData = [
    { firstName: "Ahmed", lastName: "M.", phone: "+33760388422", email: "tanjonarako@gmail.com", zones: ["Thiais", "Choisy"], skills: ["sols", "vitres", "sanitaires"] },
    { firstName: "Fatima", lastName: "K.", phone: "+33700000002", zones: ["Thiais", "Vitry"], skills: ["sols", "poussière", "sanitaires"] },
    { firstName: "Rachid", lastName: "A.", phone: "+33700000003", zones: ["Créteil", "Thiais"], skills: ["sols", "vitres", "désinfection"] },
    { firstName: "Khadija", lastName: "L.", phone: "+33700000004", zones: ["Créteil", "Choisy"], skills: ["sols", "poussière", "bureaux"] },
    { firstName: "Samir", lastName: "T.", phone: "+33700000005", zones: ["Orly", "Thiais", "Vitry"], skills: ["sols", "sanitaires"] },
    { firstName: "Nadia", lastName: "R.", phone: "+33700000006", zones: ["Thiais", "Créteil"], skills: ["sols", "vitres", "poussière", "sanitaires"] },
  ];

  const employees = [];
  for (const data of employeesData) {
    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        email: "email" in data ? data.email : undefined,
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.EMPLOYE,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        companyId: company.id,
        zones: data.zones,
        skills: data.skills,
        reliabilityScore: 5.0 + Math.random() * 4.5, // 5.0 - 9.5
      },
    });

    // Disponibilités standard lundi-vendredi 6h-14h
    for (const day of [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]) {
      await prisma.availability.create({
        data: {
          employeeId: employee.id,
          dayOfWeek: day,
          startTime: "06:00",
          endTime: "14:00",
        },
      });
    }

    employees.push(employee);
  }

  // ========== SITES ==========
  const sitesData = [
    { name: "Optical Center Thiais", address: "Centre Commercial Belle Épine, Thiais", contactName: "M. Dupont", contactPhone: "+33100000001" },
    { name: "Optical Center Créteil", address: "Centre Commercial Créteil Soleil, Créteil", contactName: "Mme Martin", contactPhone: "+33100000002" },
    { name: "Optical Center Vitry", address: "Rue du Moulin, Vitry-sur-Seine", contactName: "M. Leroy", contactPhone: "+33100000003" },
    { name: "Optical Center Choisy", address: "Avenue de Paris, Choisy-le-Roi", contactName: "Mme Bernard", contactPhone: "+33100000004" },
  ];

  const sites = [];
  for (const data of sitesData) {
    const site = await prisma.site.create({
      data: {
        companyId: company.id,
        ...data,
      },
    });

    // Checklist standard pour chaque site
    const template = await prisma.checklistTemplate.create({
      data: {
        siteId: site.id,
        name: "Nettoyage quotidien",
      },
    });

    const checklistItems = [
      { label: "Vider les poubelles", category: "Général", order: 1 },
      { label: "Passer l'aspirateur", category: "Sols", order: 2 },
      { label: "Laver les sols", category: "Sols", order: 3 },
      { label: "Nettoyer les vitres d'entrée", category: "Vitres", order: 4, photoRequired: true },
      { label: "Dépoussiérer les présentoirs", category: "Surfaces", order: 5 },
      { label: "Nettoyer les sanitaires", category: "Sanitaires", order: 6, photoRequired: true },
      { label: "Vider et nettoyer les lavabos", category: "Sanitaires", order: 7 },
      { label: "Remplir savon et papier", category: "Sanitaires", order: 8 },
      { label: "Nettoyer le comptoir d'accueil", category: "Accueil", order: 9 },
      { label: "Sortir les poubelles", category: "Général", order: 10 },
    ];

    for (const item of checklistItems) {
      await prisma.checklistItem.create({
        data: {
          templateId: template.id,
          ...item,
          photoRequired: item.photoRequired ?? false,
        },
      });
    }

    sites.push(site);
  }

  // ========== MISSIONS : semaine courante + semaine suivante (jusqu'au 3 avril) ==========
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);

  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endDate = new Date(2026, 3, 3); // 3 avril 2026

  let missionCount = 0;
  let dayOffset = 0;
  while (true) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOffset, 8, 0, 0);
    if (date > endDate) break;

    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) { // lundi–vendredi uniquement
      const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const isPast = dateStr < todayStr;

      // Alterner les horaires pour varier
      const slots = [
        { startTime: "06:00", endTime: "09:00" },
        { startTime: "09:30", endTime: "11:30" },
        { startTime: "12:00", endTime: "15:00" },
        { startTime: "15:30", endTime: "18:00" },
      ];

      for (let siteIdx = 0; siteIdx < sites.length; siteIdx++) {
        const slot = slots[siteIdx % slots.length];
        await prisma.mission.create({
          data: {
            siteId: sites[siteIdx].id,
            employeeId: employees[siteIdx % employees.length].id,
            date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: isPast ? MissionStatus.COMPLETED : MissionStatus.PLANNED,
          },
        });
        missionCount++;
      }
    }
    dayOffset++;
  }

  // ========== MISSION + ABSENCE TEST (flow complet) ==========
  // Mission à 12h aujourd'hui pour Ahmed M. — avec absence pré-seedée (statut REPORTED)
  // → La vue employé peut signaler via cette mission
  // → La vue gérant voit l'alerte directement et peut tester suggestion IA + contact remplaçant
  const todayNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const testMission = await prisma.mission.create({
    data: {
      siteId: sites[1].id, // Optical Center Créteil
      employeeId: employees[0].id,
      date: todayNoon,
      startTime: "12:00",
      endTime: "15:00",
      status: MissionStatus.PLANNED,
    },
  });

  await prisma.absence.create({
    data: {
      employeeId: employees[0].id,
      missionId: testMission.id,
      reason: "Je suis malade aujourd'hui",
      status: AbsenceStatus.REPORTED,
    },
  });

  console.log("✅ Seed complete!");
  console.log(`   Gérant: Mohamed B. (${gerant.phone})`);
  console.log(`   Employés: ${employees.length}`);
  console.log(`   Sites: ${sites.length}`);
  console.log(`   Missions: ${missionCount} (lun–ven jusqu'au 3 avril) + 1 mission test absence (Ahmed M. 12h–15h)`);
  console.log(`   Absence pré-seedée : Ahmed M. → Optical Center Créteil 12h–15h (REPORTED)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

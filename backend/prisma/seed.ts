import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seeds baseline data: subscription plans, an admin user, and a couple of public
 * design templates. Safe to run repeatedly (idempotent upserts).
 */
async function main() {
  // ── Plans ─────────────────────────────────────────────
  // `features` is a JSON string (NVARCHAR(MAX)) on SQL Server — stringify it.
  const plans = [
    { name: 'Free', priceCents: 0, maxEvents: 1, maxGuests: 50, features: ['rsvp', 'basic_templates'] },
    { name: 'Pro', priceCents: 2900, maxEvents: 5, maxGuests: 500, features: ['rsvp', 'ai', 'whatsapp', 'reminders', 'analytics'] },
    { name: 'Business', priceCents: 9900, maxEvents: 50, maxGuests: 5000, features: ['rsvp', 'ai', 'whatsapp', 'reminders', 'analytics', 'priority_support'] },
  ];

  for (const p of plans) {
    const data = {
      name: p.name,
      priceCents: p.priceCents,
      maxEvents: p.maxEvents,
      maxGuests: p.maxGuests,
      features: JSON.stringify(p.features),
    };
    await prisma.plan.upsert({
      where: { name: p.name },
      update: data,
      create: data,
    });
  }
  console.log(`✓ Seeded ${plans.length} plans`);

  // ── Admin user ────────────────────────────────────────
  const adminEmail = 'admin@inviteflow.app';
  const adminPasswordHash = await bcrypt.hash('admin12345', 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: { email: adminEmail, name: 'Platform Admin', role: 'ADMIN', passwordHash: adminPasswordHash },
  });
  console.log(`✓ Seeded admin user (${adminEmail} / admin12345)`);

  // ── Public templates ──────────────────────────────────
  const templates = [
    {
      name: 'Classic Gold',
      category: 'classic',
      design: {
        background: '#fdf6e3',
        blocks: [
          { id: 'title', type: 'text', text: 'You are invited', x: 40, y: 60, font: 'Playfair Display', size: 32, color: '#b8860b' },
          { id: 'names', type: 'text', text: '{{couple}}', x: 40, y: 130, font: 'Playfair Display', size: 48, color: '#222' },
        ],
      },
    },
    {
      name: 'Modern Minimal',
      category: 'modern',
      design: {
        background: '#ffffff',
        blocks: [
          { id: 'names', type: 'text', text: '{{couple}}', x: 50, y: 80, font: 'Inter', size: 40, color: '#111' },
          { id: 'date', type: 'text', text: '{{date}}', x: 50, y: 160, font: 'Inter', size: 20, color: '#666' },
        ],
      },
    },
  ];

  for (const t of templates) {
    // `design` is a JSON string (NVARCHAR(MAX)) on SQL Server — stringify it.
    const design = JSON.stringify(t.design);
    const existing = await prisma.template.findFirst({ where: { name: t.name, isPublic: true } });
    if (existing) {
      await prisma.template.update({ where: { id: existing.id }, data: { design, category: t.category } });
    } else {
      await prisma.template.create({ data: { name: t.name, category: t.category, design, isPublic: true } });
    }
  }
  console.log(`✓ Seeded ${templates.length} public templates`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

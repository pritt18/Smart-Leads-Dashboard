/**
 * seed.ts — Database seed script.
 *
 * Populates MongoDB with a demo user and realistic leads
 * so the dashboard and MongoDB Compass immediately show data.
 */
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User.model';
import { Lead, LeadStatus, LeadSource } from '../models/Lead.model';

const DEMO_EMAIL = 'admin@example.com';
const DEMO_PASSWORD = 'Password123!';
const DEMO_NAME = 'Alex Demo';

interface SampleLead {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  notes: string;
  expectedCloseDate: Date;
}

const SAMPLE_LEADS: SampleLead[] = [
  {
    company: 'Acme Corp',
    contactName: 'Sarah Jenkins',
    email: 'sjenkins@acmecorp.com',
    phone: '+1 (555) 234-5678',
    status: 'Won',
    source: 'Website',
    value: 45000,
    notes: 'Closed annual enterprise contract. Kickoff scheduled for next Monday.',
    expectedCloseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Starlight Media',
    contactName: 'Marcus Chen',
    email: 'marcus@starlightmedia.io',
    phone: '+1 (555) 345-6789',
    status: 'Proposal',
    source: 'Referral',
    value: 28000,
    notes: 'Submitted RFP response. Decision expected by end of month.',
    expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'TechNova Solutions',
    contactName: 'Elena Rostova',
    email: 'elena.r@technova.dev',
    phone: '+1 (555) 456-7890',
    status: 'Qualified',
    source: 'LinkedIn',
    value: 62000,
    notes: 'High intent buyer. Budget confirmed with VP of Engineering.',
    expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Global Logistics Inc',
    contactName: 'David Miller',
    email: 'dmiller@globallogistics.com',
    phone: '+1 (555) 567-8901',
    status: 'Contacted',
    source: 'Cold Call',
    value: 15000,
    notes: 'Introductory call completed. Follow-up demo scheduled next week.',
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Apex Financial Services',
    contactName: 'Jessica Taylor',
    email: 'jtaylor@apexfinancial.com',
    phone: '+1 (555) 678-9012',
    status: 'New',
    source: 'Event',
    value: 85000,
    notes: 'Met at FinTech Expo 2026. Requested product information packet.',
    expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Quantum Dynamics',
    contactName: 'Robert Vance',
    email: 'rvance@quantumdynamics.org',
    phone: '+1 (555) 789-0123',
    status: 'Won',
    source: 'Referral',
    value: 34000,
    notes: 'Signed 2-year subscription tier.',
    expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Horizon Retail',
    contactName: 'Emily Davis',
    email: 'emily.d@horizonretail.store',
    phone: '+1 (555) 890-1234',
    status: 'Lost',
    source: 'Website',
    value: 12000,
    notes: 'Went with an in-house open-source solution due to budget constraints.',
    expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'BlueWave Analytics',
    contactName: 'Nathaniel Drake',
    email: 'ndrake@bluewave.ai',
    phone: '+1 (555) 901-2345',
    status: 'Proposal',
    source: 'LinkedIn',
    value: 50000,
    notes: 'Presented proposal deck to CTO and CFO. Under final review.',
    expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Nexus Robotics',
    contactName: 'Priya Sharma',
    email: 'psharma@nexusrobotics.io',
    phone: '+1 (555) 012-3456',
    status: 'Qualified',
    source: 'Other',
    value: 75000,
    notes: 'Technical evaluation passed. Security review in progress.',
    expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Summit Health Network',
    contactName: 'Dr. Gregory House',
    email: 'ghouse@summithealth.med',
    phone: '+1 (555) 123-4567',
    status: 'Contacted',
    source: 'Website',
    value: 22000,
    notes: 'Inbound lead form submitted. Interested in clinic workflow management.',
    expectedCloseDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Vanguard Logistics',
    contactName: 'Samantha Ray',
    email: 'sray@vanguardlogistics.com',
    phone: '+1 (555) 234-8901',
    status: 'New',
    source: 'Referral',
    value: 18000,
    notes: 'Referred by Apex Financial. Reaching out tomorrow morning.',
    expectedCloseDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
  },
  {
    company: 'Ironclad Cyber Security',
    contactName: 'Victor Stone',
    email: 'vstone@ironcladsec.net',
    phone: '+1 (555) 345-9012',
    status: 'Lost',
    source: 'Cold Call',
    value: 9500,
    notes: 'Postponed project indefinitely due to organizational restructuring.',
    expectedCloseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

async function seed(): Promise<void> {
  try {
    console.log('Connecting to database...');
    await connectDB(env.MONGODB_URI);

    console.log(`Checking demo user (${DEMO_EMAIL})...`);
    let user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
      user = await User.create({
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash,
      });
      console.log(`Created demo user: ${DEMO_EMAIL}`);
    } else {
      console.log(`Found existing demo user: ${DEMO_EMAIL}`);
    }

    // Clear existing leads for this demo user to avoid duplicates on re-run
    const deleted = await Lead.deleteMany({ userId: user._id });
    console.log(`Cleared ${deleted.deletedCount} previous sample leads for demo user.`);

    const leadsWithUserId = SAMPLE_LEADS.map((lead) => ({
      ...lead,
      userId: user!._id,
    }));

    const inserted = await Lead.insertMany(leadsWithUserId);
    console.log(`Successfully seeded ${inserted.length} sample leads!`);

    console.log('\n=============================================');
    console.log('🎉 Database seeding complete!');
    console.log('Credentials to log in:');
    console.log(`  Email:    ${DEMO_EMAIL}`);
    console.log(`  Password: ${DEMO_PASSWORD}`);
    console.log('=============================================\n');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('Disconnected from database.');
    process.exit(0);
  }
}

void seed();

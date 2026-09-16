import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qpms';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Inline helpers for standalone seed script execution
function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encrypt(text: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

async function seed() {
  console.log('🌱 Starting QPMS Database Seeding...');
  console.log(`Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  if (!db) throw new Error('Database connection failed');

  // Clear existing collections
  await db.collection('users').deleteMany({});
  await db.collection('questionpapers').deleteMany({});
  await db.collection('auditlogs').deleteMany({});
  console.log('🧹 Cleaned existing collections');

  // 1. Seed Demo Accounts
  console.log('👤 Seeding 4 Demo Roles...');
  const salt = await bcrypt.genSalt(10);

  const users = [
    {
      name: 'System Administrator',
      email: 'admin@qpms.com',
      password: await bcrypt.hash('Admin@123', salt),
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Prof. Question Setter',
      email: 'setter@qpms.com',
      password: await bcrypt.hash('Setter@123', salt),
      role: 'QUESTION_SETTER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Dr. Exam Reviewer',
      email: 'reviewer@qpms.com',
      password: await bcrypt.hash('Reviewer@123', salt),
      role: 'REVIEWER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Officer In-Charge',
      email: 'officer@qpms.com',
      password: await bcrypt.hash('Officer@123', salt),
      role: 'EXAM_OFFICER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const insertedUsers = await db.collection('users').insertMany(users);
  const setterId = insertedUsers.insertedIds[1].toString();
  const reviewerId = insertedUsers.insertedIds[2].toString();
  const officerId = insertedUsers.insertedIds[3].toString();

  console.log('✅ Created Demo Accounts:');
  console.log('   - ADMIN: admin@qpms.com / Admin@123');
  console.log('   - QUESTION SETTER: setter@qpms.com / Setter@123');
  console.log('   - REVIEWER: reviewer@qpms.com / Reviewer@123');
  console.log('   - EXAM OFFICER: officer@qpms.com / Officer@123');

  // 2. Sample Question Papers
  console.log('📄 Seeding Sample Question Papers with AES-256-GCM and SHA-256...');

  const paper1Content = `NATIONAL COMPETITIVE EXAMINATION
SUBJECT: COMPUTER SCIENCE & ENGINEERING
TIME: 3 HOURS | TOTAL MARKS: 100

SECTION A (Multiple Choice Questions)
1. What is the average time complexity of searching an element in a balanced Binary Search Tree?
   (A) O(1)    (B) O(log n)    (C) O(n)    (D) O(n log n)

2. Which of the following normal forms deals with multivalued dependency?
   (A) 2NF     (B) 3NF         (C) BCNF    (D) 4NF

3. In an operating system, which condition is NOT required for a deadlock to occur?
   (A) Mutual Exclusion
   (B) Hold and Wait
   (C) Preemption allowed
   (D) Circular Wait

SECTION B (Descriptive Questions)
4. Explain the Zero-Trust Security Architecture and its significance in cloud-based examination systems.
5. Derive Dijkstra's algorithm for Single-Source Shortest Path using a Min-Heap.
--- END OF QUESTION PAPER ---`;

  const paper2Content = `STATE RECRUITMENT COMMISSION
SUBJECT: DATABASE MANAGEMENT SYSTEMS
TIME: 2 HOURS | TOTAL MARKS: 75

SECTION A (Technical Evaluation)
1. Explain the ACID properties with real-time transactional examples.
2. Differentiate between Optimistic and Pessimistic concurrency control.
3. Write SQL statements to demonstrate window functions and partition by clause.
4. Explain B+ Tree indexing and how leaf node chaining enhances range queries.
--- END OF QUESTION PAPER ---`;

  const paper3Content = `ALL INDIA TECHNICAL BOARD
SUBJECT: DATA STRUCTURES & ALGORITHMS
TIME: 3 HOURS | TOTAL MARKS: 100

SECTION A
1. Implement an LRU Cache with O(1) get and put time complexity.
2. Formulate dynamic programming recurrence for 0/1 Knapsack problem.
3. Compare Red-Black Tree versus AVL Tree rebalancing overhead during insertions.
--- END OF QUESTION PAPER ---`;

  const now = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const papers = [
    {
      title: 'Computer Science Engineering – Model Examination',
      subject: 'Computer Science',
      examName: 'National Competitive Technical Entrance 2026',
      examDate: '2026-10-15',
      content: encrypt(paper1Content),
      integrityHash: sha256(paper1Content),
      status: 'APPROVED',
      createdBy: {
        id: setterId,
        name: 'Prof. Question Setter',
        email: 'setter@qpms.com',
      },
      reviewedBy: {
        id: reviewerId,
        name: 'Dr. Exam Reviewer',
        email: 'reviewer@qpms.com',
      },
      reviewedAt: new Date(Date.now() - 3600000),
      reviewRemarks: 'All questions thoroughly reviewed and verified against syllabus standards.',
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      title: 'Database Management Systems – Competitive Examination',
      subject: 'Database Engineering',
      examName: 'State Recruitment Service Exam 2026',
      examDate: '2026-10-20',
      content: encrypt(paper2Content),
      integrityHash: sha256(paper2Content),
      status: 'SUBMITTED',
      createdBy: {
        id: setterId,
        name: 'Prof. Question Setter',
        email: 'setter@qpms.com',
      },
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      title: 'Data Structures – Technical Examination',
      subject: 'Data Structures',
      examName: 'Technical Service Eligibility Test 2026',
      examDate: '2026-11-01',
      content: encrypt(paper3Content),
      integrityHash: sha256(paper3Content),
      status: 'SCHEDULED',
      createdBy: {
        id: setterId,
        name: 'Prof. Question Setter',
        email: 'setter@qpms.com',
      },
      reviewedBy: {
        id: reviewerId,
        name: 'Dr. Exam Reviewer',
        email: 'reviewer@qpms.com',
      },
      reviewedAt: new Date(Date.now() - 5000000),
      reviewRemarks: 'Approved for scheduled release on exam day.',
      releaseTime: tomorrow,
      createdAt: new Date(Date.now() - 6000000),
      updatedAt: new Date(Date.now() - 1000000),
    },
  ];

  await db.collection('questionpapers').insertMany(papers);
  console.log('✅ Created 3 Sample Question Papers (APPROVED, SUBMITTED, SCHEDULED)');

  // 3. Initial Audit Logs
  console.log('🛡️ Creating Initial Audit Logs...');
  const auditLogs = [
    {
      userId: setterId,
      userName: 'Prof. Question Setter',
      action: 'CREATE_QUESTION_PAPER',
      resource: 'QUESTION_PAPER',
      resourceId: 'QP-001',
      details: 'Created Computer Science Model Examination draft and encrypted with AES-256-GCM',
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 7200000),
    },
    {
      userId: setterId,
      userName: 'Prof. Question Setter',
      action: 'SUBMIT_QUESTION_PAPER',
      resource: 'QUESTION_PAPER',
      resourceId: 'QP-001',
      details: 'Submitted paper for multi-level review',
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 7100000),
    },
    {
      userId: reviewerId,
      userName: 'Dr. Exam Reviewer',
      action: 'INTEGRITY_CHECK_PASS',
      resource: 'QUESTION_PAPER',
      resourceId: 'QP-001',
      details: 'Verified SHA-256 hash match before approval. Document intact.',
      ipAddress: '192.168.1.102',
      timestamp: new Date(Date.now() - 3700000),
    },
    {
      userId: reviewerId,
      userName: 'Dr. Exam Reviewer',
      action: 'APPROVE_QUESTION_PAPER',
      resource: 'QUESTION_PAPER',
      resourceId: 'QP-001',
      details: 'Approved Computer Science Engineering Model Exam',
      ipAddress: '192.168.1.102',
      timestamp: new Date(Date.now() - 3600000),
    },
  ];

  await db.collection('auditlogs').insertMany(auditLogs);
  console.log('✅ Created Audit Logs');

  console.log('🎉 Seeding successfully completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

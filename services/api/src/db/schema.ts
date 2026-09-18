import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  integer,
  decimal,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'ADMIN',
  'STAFF',
  'PARENT',
  'CORPORATE_ADMIN',
  'COOPERATIVE_STAFF',
  'MEMBER',
])

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
])

export const genderEnum = pgEnum('gender', [
  'MALE',
  'FEMALE',
  'OTHER',
])

export const employmentTypeEnum = pgEnum('employment_type', [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
])

export const verificationStatusEnum = pgEnum('verification_status', [
  'PENDING',
  'VERIFIED',
  'REJECTED',
])

export const transactionTypeEnum = pgEnum('bank_transaction_type', [
  'DEPOSIT',
  'WITHDRAWAL',
  'TRANSFER',
])

export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REVERSED',
])

export const cooperativeStatusEnum = pgEnum('cooperative_status', [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_phone_unique').on(table.phoneNumber),
  ],
)

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    address: text('address').notNull(),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('branches_code_unique').on(table.code),
  ],
)

export const staff = pgTable(
  'staff',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    staffId: varchar('staff_id', { length: 50 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    otherName: varchar('other_name', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    email: varchar('email', { length: 255 }),
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum('gender'),
    address: text('address'),
    department: varchar('department', { length: 150 }),
    position: varchar('position', { length: 150 }),
    employmentType: employmentTypeEnum('employment_type'),
    dateEmployed: date('date_employed'),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    emergencyContactName: varchar('emergency_contact_name', { length: 150 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 30 }),
    bankName: varchar('bank_name', { length: 150 }),
    bankAccountNumber: varchar('bank_account_number', { length: 30 }),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('staff_staff_id_unique').on(table.staffId),
    uniqueIndex('staff_phone_unique').on(table.phoneNumber),
  ],
)

export const parents = pgTable(
  'parents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    otherName: varchar('other_name', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('parents_phone_unique').on(table.phoneNumber),
  ],
)

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: varchar('student_id', { length: 50 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    otherName: varchar('other_name', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum('gender'),
    address: text('address'),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    parentId: uuid('parent_id').references(() => parents.id, { onDelete: 'set null' }),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('students_student_id_unique').on(table.studentId),
    index('students_phone_index').on(table.phoneNumber),
  ],
)

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    branchId: uuid('branch_id').references(() => branches.id, { onDelete: 'set null' }),
    teacherId: uuid('teacher_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('classes_code_unique').on(table.code),
  ],
)

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'set null' }),
    attendanceDate: date('attendance_date').notNull(),
    present: boolean('present').notNull(),
    recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    dueDate: date('due_date'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const results = pgTable(
  'results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'set null' }),
    subject: varchar('subject', { length: 150 }).notNull(),
    score: decimal('score', { precision: 6, scale: 2 }).notNull(),
    grade: varchar('grade', { length: 10 }),
    term: varchar('term', { length: 50 }),
    session: varchar('session', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
    recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'set null' }),
    subject: varchar('subject', { length: 200 }),
    body: text('body').notNull(),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const cooperatives = pgTable(
  'cooperatives',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    registrationNumber: varchar('registration_number', { length: 100 }),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    status: cooperativeStatusEnum('status').default('PENDING').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const cooperativeMembers = pgTable(
  'cooperative_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cooperativeId: uuid('cooperative_id').references(() => cooperatives.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    memberNumber: varchar('member_number', { length: 50 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
  },
  (table) => [
    uniqueIndex('cooperative_member_number_unique').on(table.memberNumber),
  ],
)

export const savings = pgTable(
  'savings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').references(() => cooperativeMembers.id, { onDelete: 'cascade' }).notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    reference: varchar('reference', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const loans = pgTable(
  'loans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    memberId: uuid('member_id').references(() => cooperativeMembers.id, { onDelete: 'cascade' }).notNull(),
    principal: decimal('principal', { precision: 18, scale: 2 }).notNull(),
    interestRate: decimal('interest_rate', { precision: 7, scale: 4 }).notNull(),
    termMonths: integer('term_months').notNull(),
    status: varchar('status', { length: 50 }).default('PENDING').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

export const bankAccounts = pgTable(
  'bank_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cooperativeId: uuid('cooperative_id').references(() => cooperatives.id, { onDelete: 'set null' }),
    bankName: varchar('bank_name', { length: 150 }).notNull(),
    accountName: varchar('account_name', { length: 200 }).notNull(),
    accountNumber: varchar('account_number', { length: 30 }).notNull(),
    balance: decimal('balance', { precision: 18, scale: 2 }).default('0').notNull(),
    currency: varchar('currency', { length: 10 }).default('NGN').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('bank_account_number_unique').on(table.accountNumber),
  ],
)

export const bankTransactions = pgTable(
  'bank_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id, { onDelete: 'cascade' }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    status: transactionStatusEnum('status').default('PENDING').notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    reference: varchar('reference', { length: 120 }).notNull(),
    description: text('description'),
    destinationAccount: varchar('destination_account', { length: 30 }),
    transactionDate: timestamp('transaction_date', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('bank_transaction_reference_unique').on(table.reference),
    index('bank_transactions_account_index').on(table.bankAccountId),
  ],
)

export const kycVerifications = pgTable(
  'kyc_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    cooperativeId: uuid('cooperative_id').references(() => cooperatives.id, { onDelete: 'set null' }),
    provider: varchar('provider', { length: 100 }).notNull(),
    status: verificationStatusEnum('status').default('PENDING').notNull(),
    nameMatchCount: integer('name_match_count').default(0).notNull(),
    firstNameMatched: boolean('first_name_matched').default(false).notNull(),
    lastNameMatched: boolean('last_name_matched').default(false).notNull(),
    otherNameMatched: boolean('other_name_matched').default(false).notNull(),
    phoneMatched: boolean('phone_matched').default(false).notNull(),
    dateOfBirthMatched: boolean('date_of_birth_matched').default(false).notNull(),
    bankAccountMatched: boolean('bank_account_matched').default(false).notNull(),
    providerReference: varchar('provider_reference', { length: 150 }),
    maskedBvn: varchar('masked_bvn', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
)

export const cooperativeStaff = pgTable(
  'cooperative_staff',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cooperativeId: uuid('cooperative_id').references(() => cooperatives.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
    position: varchar('position', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
)

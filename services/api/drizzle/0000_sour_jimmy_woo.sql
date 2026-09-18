CREATE TYPE "public"."cooperative_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."bank_transaction_type" AS ENUM('DEPOSIT', 'WITHDRAWAL', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'STAFF', 'PARENT', 'CORPORATE_ADMIN', 'COOPERATIVE_STAFF', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"due_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid,
	"attendance_date" date NOT NULL,
	"present" boolean NOT NULL,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperative_id" uuid,
	"bank_name" varchar(150) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"account_number" varchar(30) NOT NULL,
	"balance" numeric(18, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'NGN' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"type" "bank_transaction_type" NOT NULL,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"reference" varchar(120) NOT NULL,
	"description" text,
	"destination_account" varchar(30),
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"address" text NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50) NOT NULL,
	"branch_id" uuid,
	"teacher_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooperative_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperative_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"member_number" varchar(50) NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooperative_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperative_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"position" varchar(150),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cooperatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"registration_number" varchar(100),
	"phone_number" varchar(30) NOT NULL,
	"email" varchar(255),
	"address" text,
	"status" "cooperative_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"cooperative_id" uuid,
	"provider" varchar(100) NOT NULL,
	"status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"name_match_count" integer DEFAULT 0 NOT NULL,
	"first_name_matched" boolean DEFAULT false NOT NULL,
	"last_name_matched" boolean DEFAULT false NOT NULL,
	"other_name_matched" boolean DEFAULT false NOT NULL,
	"phone_matched" boolean DEFAULT false NOT NULL,
	"date_of_birth_matched" boolean DEFAULT false NOT NULL,
	"bank_account_matched" boolean DEFAULT false NOT NULL,
	"provider_reference" varchar(150),
	"masked_bvn" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"principal" numeric(18, 2) NOT NULL,
	"interest_rate" numeric(7, 4) NOT NULL,
	"term_months" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid,
	"recipient_id" uuid,
	"subject" varchar(200),
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"other_name" varchar(100),
	"phone_number" varchar(30) NOT NULL,
	"email" varchar(255),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"class_id" uuid,
	"subject" varchar(150) NOT NULL,
	"score" numeric(6, 2) NOT NULL,
	"grade" varchar(10),
	"term" varchar(50),
	"session" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"reference" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"staff_id" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"other_name" varchar(100),
	"phone_number" varchar(30) NOT NULL,
	"email" varchar(255),
	"date_of_birth" date,
	"gender" "gender",
	"address" text,
	"department" varchar(150),
	"position" varchar(150),
	"employment_type" "employment_type",
	"date_employed" date,
	"branch_id" uuid,
	"emergency_contact_name" varchar(150),
	"emergency_contact_phone" varchar(30),
	"bank_name" varchar(150),
	"bank_account_number" varchar(30),
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"other_name" varchar(100),
	"phone_number" varchar(30) NOT NULL,
	"date_of_birth" date,
	"gender" "gender",
	"address" text,
	"branch_id" uuid,
	"parent_id" uuid,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_staff_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_members" ADD CONSTRAINT "cooperative_members_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_members" ADD CONSTRAINT "cooperative_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_staff" ADD CONSTRAINT "cooperative_staff_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperative_staff" ADD CONSTRAINT "cooperative_staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_cooperative_id_cooperatives_id_fk" FOREIGN KEY ("cooperative_id") REFERENCES "public"."cooperatives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_member_id_cooperative_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."cooperative_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings" ADD CONSTRAINT "savings_member_id_cooperative_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."cooperative_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_number_unique" ON "bank_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_transaction_reference_unique" ON "bank_transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "bank_transactions_account_index" ON "bank_transactions" USING btree ("bank_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_code_unique" ON "branches" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_code_unique" ON "classes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "cooperative_member_number_unique" ON "cooperative_members" USING btree ("member_number");--> statement-breakpoint
CREATE UNIQUE INDEX "parents_phone_unique" ON "parents" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_staff_id_unique" ON "staff" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_phone_unique" ON "staff" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "students_student_id_unique" ON "students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "students_phone_index" ON "students" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone_number");
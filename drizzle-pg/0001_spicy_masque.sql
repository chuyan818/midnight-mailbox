CREATE TABLE "login_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"email" varchar(320) NOT NULL,
	"ipAddress" varchar(128) NOT NULL,
	"userAgent" varchar(512),
	"success" boolean DEFAULT false NOT NULL,
	"failureReason" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);

import {sqliteTable,integer,text,uniqueIndex} from "drizzle-orm/sqlite-core";
export const users=sqliteTable("users",{id:integer("id").primaryKey({autoIncrement:true}),username:text("username").notNull(),salt:text("salt").notNull(),passwordHash:text("password_hash").notNull(),role:text("role").notNull(),departmentId:text("department_id")},t=>[uniqueIndex("users_username_unique").on(t.username)]);
export const sessions=sqliteTable("sessions",{tokenHash:text("token_hash").primaryKey(),userId:integer("user_id").notNull().references(()=>users.id),expires:integer("expires").notNull()});
export const attempts=sqliteTable("attempts",{id:text("id").primaryKey(),count:integer("count").notNull(),until:integer("until").notNull()});
export const appData=sqliteTable("app_data",{id:integer("id").primaryKey(),payload:text("payload").notNull(),revision:integer("revision").notNull()});

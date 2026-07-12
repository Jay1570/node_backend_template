import { timestampsColumns } from "@/db/schemas/commonColumns.schema.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import { pgTable, uuid, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";

export const refreshTokensTable = pgTable(
    "refresh_tokens",
    {
        id: uuid().defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        token: text().notNull().unique(),
        deviceId: varchar("device_id", { length: 255 }).notNull(),
        deviceName: varchar("device_name", { length: 255 }),
        os: varchar("os", { length: 255 }),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        ...timestampsColumns,
    },
    (table) => [
        unique("refresh_tokens_user_device_unique").on(
            table.userId,
            table.deviceId,
        ),
    ],
);

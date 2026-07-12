import { eq, and } from "drizzle-orm";
import { type DB } from "@/db/db.js";
import {
    refreshTokensTable,
} from "@/db/schemas/auth.schema.js";
import type { ResultAsync } from "@/types/Result.js";
import { HttpStatusCode } from "@/config/HttpStatusCodes.js";
import { internalError } from "@/core/resultHandlers.js";

const module = "auth.service";

export type RefreshToken = typeof refreshTokensTable.$inferSelect;

export const createOrUpdateRefreshToken = async (
    userId: string,
    deviceId: string,
    tokenHash: string,
    expiresAt: Date,
    deviceName: string | undefined,
    os: string | undefined,
    conn: DB,
): ResultAsync<RefreshToken> => {
    try {

        const [refreshToken] = await conn
            .insert(refreshTokensTable)
            .values({
                userId,
                deviceId,
                token: tokenHash,
                expiresAt,
                deviceName,
                os,
            })
            .onConflictDoUpdate({
                target: [
                    refreshTokensTable.userId,
                    refreshTokensTable.deviceId,
                ],
                set: {
                    token: tokenHash,
                    expiresAt,
                    deviceName,
                    os,
                    updatedAt: new Date(),
                },
            })
            .returning();

        if (!refreshToken) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.INTERNAL_SERVER_ERROR,
                    message: "Failed to create/update refresh token",
                },
            };
        }

        return {
            success: true,
            data: refreshToken,
        };
    } catch (err) {
        return internalError(module, "createOrUpdateRefreshToken", err);
    }
};

export const getRefreshTokenByToken = async (
    tokenHash: string,
    conn: DB,
): ResultAsync<RefreshToken> => {
    try {
        const [session] = await conn
            .select()
            .from(refreshTokensTable)
            .where(eq(refreshTokensTable.token, tokenHash))
            .limit(1);

        if (!session) {
            return {
                success: false,
                error: {
                    code: HttpStatusCode.UNAUTHORIZED,
                    message: "Invalid refresh token",
                },
            };
        }

        return { success: true, data: session };
    } catch (err) {
        return internalError(module, "getRefreshTokenByToken", err);
    }
};

export const revokeRefreshToken = async (
    userId: string,
    deviceId: string,
    conn: DB,
): ResultAsync<boolean> => {
    try {
        await conn
            .delete(refreshTokensTable)
            .where(
                and(
                    eq(refreshTokensTable.userId, userId),
                    eq(refreshTokensTable.deviceId, deviceId),
                ),
            );
        return { success: true, data: true };
    } catch (err) {
        return internalError(module, "revokeRefreshToken", err);
    }
};

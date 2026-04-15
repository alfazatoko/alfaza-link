"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoResetBalances = exports.autoLockReports = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
exports.autoLockReports = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Asia/Jakarta")
    .onRun(async () => {
    var _a, _b;
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(now.getTime() + wibOffset);
    const currentHour = wibDate.getUTCHours();
    const currentMinute = wibDate.getUTCMinutes();
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (!settingsDoc.exists)
        return null;
    const settings = settingsDoc.data();
    if (!settings)
        return null;
    const lockHour = (_a = settings.autoLockHour) !== null && _a !== void 0 ? _a : 22;
    const lockMinute = (_b = settings.autoLockMinute) !== null && _b !== void 0 ? _b : 0;
    if (currentHour === lockHour && currentMinute === lockMinute) {
        const usersSnap = await db.collection("users").get();
        const batch = db.batch();
        usersSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.role === "kasir" && data.isActive) {
                batch.update(doc.ref, { reportLocked: true });
            }
        });
        await batch.commit();
        console.log(`Reports locked at ${currentHour}:${currentMinute} WIB`);
    }
    return null;
});
exports.autoResetBalances = functions.pubsub
    .schedule("every 1 minutes")
    .timeZone("Asia/Jakarta")
    .onRun(async () => {
    var _a, _b;
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const wibDate = new Date(now.getTime() + wibOffset);
    const currentHour = wibDate.getUTCHours();
    const currentMinute = wibDate.getUTCMinutes();
    const settingsDoc = await db.collection("settings").doc("main").get();
    if (!settingsDoc.exists)
        return null;
    const settings = settingsDoc.data();
    if (!settings)
        return null;
    const resetHour = (_a = settings.autoResetHour) !== null && _a !== void 0 ? _a : 6;
    const resetMinute = (_b = settings.autoResetMinute) !== null && _b !== void 0 ? _b : 0;
    if (currentHour === resetHour && currentMinute === resetMinute) {
        const usersSnap = await db.collection("users").get();
        const batch = db.batch();
        usersSnap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.role === "kasir" && data.isActive) {
                batch.update(doc.ref, {
                    balance: 0,
                    reportLocked: false,
                });
            }
        });
        await batch.commit();
        console.log(`Balances reset at ${currentHour}:${currentMinute} WIB`);
    }
    return null;
});
//# sourceMappingURL=index.js.map
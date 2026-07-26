// ============================================================================
// agoraRoutes.js — Agora RTC Token Generation
// ============================================================================
// Generates short-lived RTC tokens for Agora voice channels.
// The frontend calls this before joining a voice channel.
//
// GET /api/agora/token?channel=playrave-<roomId>&uid=<uid>
// ============================================================================

const express = require('express');
const router = express.Router();

// Agora credentials — set these in your environment variables
const APP_ID  = process.env.AGORA_APP_ID  || 'f258296bc0cd4d729d2a1f2f8b8df5b2';
const APP_CERT = process.env.AGORA_APP_CERT || null; // Set in production via env var

router.get('/token', (req, res) => {
    const { channel, uid = 0 } = req.query;

    if (!channel) {
        return res.status(400).json({ error: 'channel is required' });
    }

    // If no certificate is set (test mode), return null token — Agora allows this
    // when the project is in Testing Mode on the Agora Console.
    if (!APP_CERT) {
        console.log(`[Agora] No APP_CERT set — returning null token for channel: ${channel}`);
        return res.json({ token: null, appId: APP_ID, channel, uid: Number(uid) });
    }

    try {
        const { RtcTokenBuilder, RtcRole } = require('agora-token');

        const expirationTimeInSeconds = 3600; // 1 hour
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERT,
            channel,
            Number(uid),
            RtcRole.PUBLISHER,
            privilegeExpiredTs,
            privilegeExpiredTs
        );

        console.log(`[Agora] Generated token for channel: ${channel}, uid: ${uid}`);
        res.json({ token, appId: APP_ID, channel, uid: Number(uid) });
    } catch (err) {
        console.error('[Agora] Token generation error:', err);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

module.exports = router;

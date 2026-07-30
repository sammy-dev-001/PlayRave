class VoiceService { async init() { return false; } async joinChannel() { return false; } async leaveChannel() { return true; } async toggleMute() { return false; } setCallbacks() {} isAvailable() { return false; } destroy() {} }
export default new VoiceService();

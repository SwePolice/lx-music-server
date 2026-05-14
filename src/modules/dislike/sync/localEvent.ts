// CF Workers: local event bridge is a no-op (DO instance is single-user, no inter-process IPC needed)

export const registerEvent = (_wss: LX.SocketServer) => {}
export const unregisterEvent = () => {}

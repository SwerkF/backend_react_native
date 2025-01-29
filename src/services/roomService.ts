import { Room, RoomSettings, Player } from "../interfaces/werewolfInterface";

class RoomService {
  private rooms: Map<string, Room> = new Map(); // Stocke toutes les rooms

  /**
   * Creates a new room.
   * @param {string} roomId - Unique room identifier.
   * @param {string} hostId - ID of the player who creates the room.
   * @param {number} maxPlayers - Maximum number of players.
   * @returns {Room} - The created room object.
   */
  createRoom(roomId: string, hostId: string, maxPlayers: number): Room {
    const room: Room = {
      id: roomId,
      name: `Room ${roomId}`,
      gameType: "werewolf",
      players: [],
      maxPlayers,
      status: "waiting",
      hostId,
      settings: this.getDefaultSettings(),
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Retrieves a room by ID.
   * @param {string} roomId - Unique room identifier.
   * @returns {Room | undefined} - The room object if found.
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Updates the room settings.
   * @param {string} roomId - Unique room identifier.
   * @param {string} hostId - ID of the host (only the host can update settings).
   * @param {RoomSettings} newSettings - The updated room settings.
   * @returns {boolean} - Whether the update was successful.
   */
  updateRoomSettings(roomId: string, hostId: string, newSettings: RoomSettings): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostId) return false;

    room.settings = { ...room.settings, ...newSettings };
    return true;
  }

  /**
   * Adds a player to a room.
   * @param {string} roomId - Unique room identifier.
   * @param {Player} player - The player to be added.
   * @returns {boolean} - Whether the player was successfully added.
   */
  addPlayer(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) return false;

    room.players.push(player);
    return true;
  }

  /**
   * Removes a player from a room.
   * @param {string} roomId - Unique room identifier.
   * @param {string} playerId - The player ID to be removed.
   */
  removePlayer(roomId: string, playerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
  }

  /**
   * Deletes a room.
   * @param {string} roomId - Unique room identifier.
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Returns the default settings for a room.
   * @returns {RoomSettings} - Default room settings.
   */
  private getDefaultSettings(): RoomSettings {
    return {
      minPlayers: 4,
      maxPlayers: 12,
      rolesConfig: {
        "Loup-Garou": { min: 1, max: 3, current: 2 },
        "Voyante": { min: 0, max: 1, current: 1 },
        "Villageois": { min: 2, max: 8, current: 5 },
        "Sorcière": { min: 0, max: 1, current: 1 },
        "Chasseur": { min: 0, max: 1, current: 0 },
        "Cupidon": { min: 0, max: 1, current: 0 }
      },
      phaseDurations: {
        day: 45,
        night: 30
      },
      votingMode: "public",
      discussionEnabled: true,
      werewolfChatEnabled: true
    };
  }
}

export default new RoomService();

import { Player, Game, Role } from "../models/game";

class WerewolfService {
  private games: Map<string, Game> = new Map(); // Stores ongoing games
  private roleTimers: Map<string, NodeJS.Timeout> = new Map(); // Stocke les timers des rôles

  /**
   * Creates a new game instance.
   * @param {string} gameId - The unique ID of the game.
   * @param {Player[]} players - List of players participating in the game.
   * @returns {Game} - The created game instance.
   */
  createGame(gameId: string, players: Player[]): Game {
    const game: Game = {
      id: gameId,
      players,
      phase: "lobby",
      votes: new Map(),
      actions: new Map(),
      couple: [],
      isGameOver: false,
    };
    this.games.set(gameId, game);
    return game;
  }

   /**
   * Starts a game session and assigns roles.
   * Initializes the first night phase with role-based timers.
   * @param gameId - Unique game identifier.
   * @returns The updated game object or null if the game does not exist.
   */
   startGame(gameId: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    this.assignRoles(game);
    game.phase = "night"; // Commence par la nuit
    game.votes.clear();
    game.remainingRoles = this.getRolesForPhase("night", game);

    // Démarrer la phase avec les rôles actifs
    this.startNextRoleTimer(gameId);

    return game;
  }

  /**
   * Assigns roles to players randomly.
   * @param game - The game object.
   */
  private assignRoles(game: Game): void {
    const roles: Role[] = ["Loup-Garou", "Villageois", "Voyante", "Sorcière", "Chasseur", "Cupidon"];
    let shuffledRoles = [...roles, ...new Array(game.players.length - roles.length).fill("Villageois")];
    shuffledRoles = shuffledRoles.sort(() => Math.random() - 0.5); // Mélanger les rôles

    game.players.forEach((player, index) => {
      player.role = shuffledRoles[index];
      player.alive = true;
    });
  }

  /**
   * Retrieves roles that should act during a specific phase.
   * @param phase - The current phase ("night" or "day").
   * @param game - The game object.
   * @returns An array of roles that will act in this phase.
   */
  private getRolesForPhase(phase: "night" | "day", game: Game): Role[] {
    if (phase === "night") {
      return ["Loup-Garou", "Voyante", "Sorcière", "Cupidon"];
    } else {
      return ["Villageois", "Chasseur"];
    }
  }

  /**
   * Assigns two players as a couple (Cupidon role effect).
   * @param {string} gameId - The unique ID of the game.
   * @param {string} player1Id - ID of the first player.
   * @param {string} player2Id - ID of the second player.
   * @returns {void}
   */
  setCouple(gameId: string, player1Id: string, player2Id: string): void {
    const game = this.games.get(gameId);
    if (!game) return;
    
    game.couple = [player1Id, player2Id];
  }

  /**
   * Registers a player's vote for elimination.
   * @param {string} gameId - The unique ID of the game.
   * @param {string} voterId - ID of the player casting the vote.
   * @param {string} targetId - ID of the player being voted against.
   * @returns {void}
   */
  registerVote(gameId: string, voterId: string, targetId: string): void {
    const game = this.games.get(gameId);
    if (!game || !game.players.find(p => p.id === voterId)?.alive) return;

    game.votes.set(voterId, targetId);
    
    // If all alive players have voted, resolve the votes
    if (game.votes.size === game.players.filter(p => p.alive).length) {
      this.resolveVotes(game);
    }
  }

  /**
   * Resolves the village voting phase, eliminating the most voted player.
   * @param {Game} game - The game instance.
   * @returns {void}
   */
  private resolveVotes(game: Game): void {
    const results = new Map<string, number>();
    game.votes.forEach((target, voter) => {
      results.set(target, (results.get(target) || 0) + 1);
    });

    let eliminatedPlayerId: string | null = null;
    let maxVotes = 0;
    
    results.forEach((votes, playerId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
      }
    });

    if (eliminatedPlayerId) {
      const eliminatedPlayer = game.players.find(p => p.id === eliminatedPlayerId);
      if (eliminatedPlayer) {
        eliminatedPlayer.alive = false;
        this.handleSpecialRoles(game, eliminatedPlayer);
      }
    }

    game.votes.clear();
    game.phase = "night"; // Switch to night phase after voting
    this.checkGameOver(game);
  }

  /**
   * Handles special role effects upon player elimination (e.g., Chasseur, Cupidon).
   * @param {Game} game - The game instance.
   * @param {Player} eliminatedPlayer - The eliminated player instance.
   * @returns {void}
   */
  private handleSpecialRoles(game: Game, eliminatedPlayer: Player): void {
    if (eliminatedPlayer.role === "Chasseur") {
      // The Hunter shoots a player before dying
      const targetId = this.getRandomAlivePlayer(game, eliminatedPlayer.id);
      if (targetId) {
        const target = game.players.find(p => p.id === targetId);
        if (target) target.alive = false;
      }
    }

    if (game.couple.includes(eliminatedPlayer.id)) {
      // If one lover dies, the other dies too
      const loverId = game.couple.find(id => id !== eliminatedPlayer.id);
      if (loverId) {
        const lover = game.players.find(p => p.id === loverId);
        if (lover) lover.alive = false;
      }
    }
  }

  /**
   * Checks if the game has ended based on winning conditions.
   * @param {Game} game - The game instance.
   * @returns {void}
   */
  private checkGameOver(game: Game): void {
    const nbLoups = game.players.filter(p => p.role === "Loup-Garou" && p.alive).length;
    const nbVillageois = game.players.filter(p => p.role !== "Loup-Garou" && p.alive).length;
    const nbCoupleAlive = game.couple.filter(id => game.players.find(p => p.id === id)?.alive).length;

    if (nbLoups === 0) {
      game.isGameOver = true;
      console.log("The Villagers have won!");
    } else if (nbLoups >= nbVillageois) {
      game.isGameOver = true;
      console.log("The Werewolves have won!");
    } else if (nbCoupleAlive === 2 && nbLoups === 0) {
      game.isGameOver = true;
      console.log("The Lovers have won!");
    }
  }

  /**
   * Returns a random alive player, excluding a given player.
   * @param {Game} game - The game instance.
   * @param {string} excludeId - The player ID to exclude.
   * @returns {string | null} - Returns the ID of a random alive player or null if none available.
   */
  private getRandomAlivePlayer(game: Game, excludeId?: string): string | null {
    const alivePlayers = game.players.filter(p => p.alive && p.id !== excludeId);
    return alivePlayers.length ? alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id : null;
  }

  /**
   * Starts a timer for each role during a phase.
   * Each role has 20 seconds to perform their action.
   * @param gameId - Unique game identifier.
   */
  private startNextRoleTimer(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game || game.remainingRoles.length === 0) {
      this.nextPhase(gameId);
      return;
    }

    const currentRole = game.remainingRoles.shift(); // Prend le rôle suivant
    console.log(`It's now the turn of ${currentRole} in game ${gameId}`);

    const timer = setTimeout(() => {
      console.log(`${currentRole} time is up.`);
      this.startNextRoleTimer(gameId); // Passe au rôle suivant
    }, 20000); // 20 secondes par rôle

    this.roleTimers.set(gameId, timer);
  }

  /**
   * Switches to the next game phase after all roles have acted.
   * @param gameId - Unique game identifier.
   */
  private nextPhase(gameId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    game.phase = game.phase === "night" ? "day" : "night";
    console.log(`Game ${gameId} is now in phase: ${game.phase}`);

    game.remainingRoles = this.getRolesForPhase(game.phase, game);
    this.startNextRoleTimer(gameId);
  }

  /**
   * Handles a player's action during their role's turn.
   * @param gameId - Unique game identifier.
   * @param playerId - The player's ID.
   * @param action - The action being performed.
   * @returns Boolean indicating success.
   */
  handleRoleAction(gameId: string, playerId: string, action: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const player = game.players.find(p => p.id === playerId);
    if (!player || !player.alive) return false;

    const currentRole = game.remainingRoles[0]; // Rôle actuellement en jeu
    if (player.role !== currentRole) return false;

    console.log(`${player.name} performed action: ${action}`);
    this.startNextRoleTimer(gameId); // Passe au rôle suivant

    return true;
  }

  /**
   * Retrieves the game state.
   * @param {string} gameId - The unique ID of the game.
   * @returns {Game | undefined} - Returns the game instance if found.
   */
  getGame(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }
}

export default new WerewolfService();

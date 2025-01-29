// Interface RoomSettings: Contient les paramètres personnalisables de la room
export interface RoomSettings {
    minPlayers: number;
    maxPlayers: number;
    rolesConfig: {
      [key in RoleName]: { 
        min: number; 
        max: number; 
        current: number; // Nombre actuel de ce rôle
      };
    };
    phaseDurations: {
      day: number; // Temps en secondes
      night: number;
    };
    votingMode: "public" | "anonymous";
    discussionEnabled: boolean;
    werewolfChatEnabled: boolean;
  }
  
  // Interface Room: Gère une room de jeu
  export interface Room {
    id: string;
    name: string;
    gameType: "werewolf" | "other"; // Type de jeu
    players: Player[];
    game?: Game; // Présent seulement si une partie est en cours
    maxPlayers: number;
    status: "waiting" | "inGame" | "finished"; // Statut de la room
    hostId: string; // Joueur administrateur de la Room
    settings: RoomSettings; // Paramètres de la Room
  }
  
  // Interface RoleName: Enum pour éviter les erreurs de saisie
  export type RoleName = "Loup-Garou" | "Villageois" | "Voyante" | "Sorcière" | "Chasseur" | "Cupidon";
  
  // Interface Role: Définit chaque rôle du jeu
  export interface Role {
    name: RoleName;
    phase: "night" | "day"; // Quand le rôle joue
    actionTime: number; // Temps d'action (ms)
    current: number; // Nombre d'instances de ce rôle dans la partie
    powers?: string[]; // Pouvoirs du rôle (ex: ["see_role", "kill", "save"])
  }
  
  // Interface Player: Représente un joueur
  export interface Player {
    id: string;
    name: string;
    role: Role | null; // Le rôle est défini après le début de la partie
    alive: boolean;
    isReady: boolean; // Indique si le joueur est prêt dans la Room
    roomId: string;
  }
  
  // Interface Action: Gère les actions des joueurs
  export interface Action {
    playerId: string;
    actionType: "vote" | "use_power";
    targetId?: string;
    timestamp: number; // Horodatage pour suivre l'ordre des actions
  }
  
  // Interface Game: Gère l’état d’une partie en cours
  export interface Game {
    id: string;
    roomId: string;
    phase: "night" | "day"; // Phase actuelle
    players: Player[];
    roles: Role[];
    votes: Map<string, string>; // voterId -> targetId
    actions: Action[];
    isGameOver: boolean;
    remainingRoles: Role[]; // Liste des rôles qui doivent encore jouer
    settings: RoomSettings; // Ajouté pour éviter la dépendance à Room
  }
  
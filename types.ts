
export enum GameStatus {
  Start,
  Loading,
  Playing,
  GameOver,
  Error,
}

export interface StorySegment {
  id: number;
  text: string;
  source: 'ai' | 'player';
}

export interface GameData {
  sceneDescription: string;
  actions: string[];
  imagePrompt: string;
}

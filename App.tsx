import React, { useState, useCallback } from 'react';
import { GameStatus } from './types';
import type { StorySegment } from './types';
import { getInitialScene, getNextScene, generateSceneImage } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import SceneImage from './components/SceneImage';
import StoryDisplay from './components/StoryDisplay';
import ActionButtons from './components/ActionButtons';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.Start);
  const [history, setHistory] = useState<StorySegment[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsyncError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "An unknown error occurred.";
    setError(message);
    setStatus(GameStatus.Error);
  };

  const startGame = useCallback(async () => {
    setStatus(GameStatus.Loading);
    setError(null);
    setHistory([]);
    setActions([]);
    setImageUrl(null);
    try {
      const initialData = await getInitialScene();
      const firstImagePromise = generateSceneImage(initialData.imagePrompt);

      setActions(initialData.actions);
      setHistory([{ id: Date.now(), text: initialData.sceneDescription, source: 'ai' }]);
      
      const newImageUrl = await firstImagePromise;
      setImageUrl(newImageUrl);

      setStatus(GameStatus.Playing);
    } catch (err) {
      handleAsyncError(err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayerAction = useCallback(async (action: string) => {
    setStatus(GameStatus.Loading);
    const newHistory: StorySegment[] = [...history, { id: Date.now(), source: 'player', text: action }];
    setHistory(newHistory);
    setActions([]);

    try {
      const nextData = await getNextScene(newHistory, action);
      const nextImagePromise = generateSceneImage(nextData.imagePrompt);

      setActions(nextData.actions);
      setHistory(prev => [...prev, { id: Date.now() + 1, text: nextData.sceneDescription, source: 'ai' }]);

      if (nextData.actions.length === 0) {
        setStatus(GameStatus.GameOver);
      } else {
        setStatus(GameStatus.Playing);
      }
      
      const newImageUrl = await nextImagePromise;
      setImageUrl(newImageUrl);

    } catch (err) {
      handleAsyncError(err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const renderContent = () => {
    switch (status) {
      case GameStatus.Start:
        return (
          <div className="text-center animate-fadeIn">
            <h1 className="text-5xl font-bold font-serif mb-4 text-brand-secondary">AI Dungeon Master</h1>
            <p className="text-xl text-brand-subtle mb-8 max-w-2xl mx-auto">
              Welcome, adventurer. A world of magic, mystery, and danger awaits. Your choices will shape the story. Are you ready to begin?
            </p>
            <button
              onClick={startGame}
              className="px-10 py-4 bg-brand-secondary text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 animate-pulseGlow"
            >
              Begin Your Adventure
            </button>
          </div>
        );
      case GameStatus.Error:
        return (
            <div className="text-center animate-fadeIn bg-brand-surface p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold font-serif text-red-400 mb-4">An Unforeseen Calamity!</h2>
                <p className="text-brand-subtle mb-6">{error}</p>
                <button
                    onClick={startGame}
                    className="px-8 py-3 bg-brand-secondary text-white font-bold rounded-lg hover:bg-opacity-80 transition-colors"
                >
                    Try to Weave Fate Anew
                </button>
            </div>
        );
      case GameStatus.GameOver:
          return (
              <div className="text-center animate-fadeIn bg-brand-surface p-8 rounded-lg shadow-xl">
                  <h2 className="text-4xl font-bold font-serif text-brand-secondary mb-4">The Tale Concludes</h2>
                  <p className="text-brand-subtle mb-8 font-serif text-lg leading-relaxed">
                    {history.length > 0 ? history[history.length - 1].text : "Your journey has reached its end."}
                  </p>
                  <button
                      onClick={startGame}
                      className="px-10 py-4 bg-brand-secondary text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200"
                  >
                      Start a New Adventure
                  </button>
              </div>
          )
      case GameStatus.Playing:
      case GameStatus.Loading:
        return (
          <div className="flex flex-col lg:flex-row h-full w-full gap-8 p-4">
            <SceneImage imageUrl={imageUrl} isLoading={status === GameStatus.Loading} />
            <div className="w-full lg:w-1/2 flex flex-col gap-4 h-full">
              <StoryDisplay history={history} />
              {status === GameStatus.Loading ? (
                  <div className="flex-shrink-0 pt-4 flex justify-center items-center h-48">
                      <LoadingSpinner />
                  </div>
              ) : (
                  <ActionButtons actions={actions} onAction={handlePlayerAction} isDisabled={false} />
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen w-full p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-brand-bg via-brand-primary to-brand-bg">
        <div className="w-full max-w-7xl h-[85vh] bg-brand-surface bg-opacity-75 rounded-2xl shadow-2xl backdrop-blur-sm p-4">
            {renderContent()}
        </div>
    </main>
  );
};

export default App;

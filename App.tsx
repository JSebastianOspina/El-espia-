import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GameState, ViewState, Player, RoundHistory } from './types';
import { WORD_BANK, STORAGE_KEY } from './constants';
import { parsePlayers, getRandomWord, getRandomSpy } from './utils';
import { Button, Card, Input, Screen } from './components/UI';
import { User, Trophy, History, RefreshCcw, Settings, Eye, EyeOff, ChevronRight, CheckCircle2, Edit2 } from 'lucide-react';

const App = () => {
  // --- STATE ---
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      players: [],
      history: [],
      view: ViewState.SETUP,
      currentRound: null,
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // --- ACTIONS ---

  const handleStartGame = (playerNames: string) => {
    const players = parsePlayers(playerNames);
    if (players.length < 3) {
      alert("Se necesitan mínimo 3 jugadores.");
      return;
    }
    setState(prev => ({
      ...prev,
      players,
      view: ViewState.PLAYER_PREVIEW // Go to preview instead of straight to word select
    }));
  };

  const confirmPlayers = () => {
    setState(prev => ({ ...prev, view: ViewState.WORD_SELECT }));
  };

  const editPlayers = () => {
    setState(prev => ({ ...prev, view: ViewState.SETUP }));
  };

  const handleStartRound = (selectedWord: string) => {
    const word = selectedWord.trim() || getRandomWord(WORD_BANK);
    const spyId = getRandomSpy(state.players);
    
    setState(prev => ({
      ...prev,
      view: ViewState.REVEAL,
      currentRound: {
        word,
        spyId,
        revealIndex: 0,
        isRevealed: false
      }
    }));
  };

  const handleRevealNext = () => {
    if (!state.currentRound) return;

    if (state.currentRound.isRevealed) {
      // Hide and move to next or finish
      const nextIndex = state.currentRound.revealIndex + 1;
      if (nextIndex >= state.players.length) {
        setState(prev => ({ ...prev, view: ViewState.IN_PROGRESS }));
      } else {
        setState(prev => ({
          ...prev,
          currentRound: { ...prev.currentRound!, isRevealed: false, revealIndex: nextIndex }
        }));
      }
    } else {
      // Reveal current card
      setState(prev => ({
        ...prev,
        currentRound: { ...prev.currentRound!, isRevealed: true }
      }));
    }
  };

  const handleEndRound = () => {
    setState(prev => ({ ...prev, view: ViewState.RESULTS }));
  };

  const handleSaveResults = (accusedId: string | null, spyGuessed: boolean) => {
    if (!state.currentRound) return;

    const { spyId, word } = state.currentRound;
    
    // Scoring Rules
    // 1. Spy Found (Accused == Spy): Citizens +0.5, Spy +0
    // 2. Spy Not Found (Accused != Spy or Null): Citizens +0, Spy +0
    // 3. Spy Guessed Word: Spy +4 (Independent)
    
    const wasSpyFound = accusedId === spyId;
    
    const updatedPlayers = state.players.map(p => {
      let delta = 0;
      const isSpy = p.id === spyId;

      if (isSpy) {
        if (spyGuessed) delta += 4;
      } else {
        // Citizen
        if (wasSpyFound) delta += 0.5;
      }

      return { ...p, score: p.score + delta };
    });

    // History Logic
    const spyName = state.players.find(p => p.id === spyId)?.name || 'Desconocido';
    const accusedName = accusedId ? state.players.find(p => p.id === accusedId)?.name || '?' : null;

    const newHistoryItem: RoundHistory = {
      id: crypto.randomUUID(),
      word,
      spyName,
      accusedName,
      spyGuessed,
      date: new Date().toISOString()
    };

    const newHistory = [newHistoryItem, ...state.history].slice(0, 50);

    setState(prev => ({
      ...prev,
      players: updatedPlayers,
      history: newHistory,
      currentRound: null,
      view: ViewState.LEADERBOARD
    }));
  };

  const resetGame = () => {
    if (confirm("¿Estás seguro de borrar todo el historial y puntajes?")) {
      setState({
        players: [],
        history: [],
        view: ViewState.SETUP,
        currentRound: null
      });
    }
  };

  const resetScoresAndEdit = () => {
    if (confirm("Volver a editar jugadores. ¿Quieres reiniciar los puntajes a 0?")) {
      setState(prev => ({
        ...prev,
        players: prev.players.map(p => ({...p, score: 0})),
        history: [], // Clear history on reset
        view: ViewState.SETUP,
        currentRound: null
      }));
    } else {
      setState(prev => ({
        ...prev,
        view: ViewState.SETUP,
        currentRound: null
      }));
    }
  };

  const newRound = () => {
    setState(prev => ({ ...prev, view: ViewState.WORD_SELECT }));
  };

  // --- VIEWS ---

  if (state.view === ViewState.SETUP) {
    const defaultNames = state.players.length > 0 
      ? state.players.map(p => p.name).join(', ')
      : '';
    
    return (
      <Screen title="Configurar Partida">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Jugadores</h2>
          </div>
          <p className="text-slate-500 text-sm">Escribe los nombres separados por coma. Mínimo 3.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem('players') as HTMLInputElement).value;
            handleStartGame(input);
          }}>
            <textarea
              name="players"
              defaultValue={defaultNames}
              placeholder="Ej: Sebas, Mariana, Sofía, Luis"
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-lg min-h-[120px] resize-none"
            />
            <Button type="submit" className="mt-4">Siguiente</Button>
          </form>
        </Card>
      </Screen>
    );
  }

  if (state.view === ViewState.PLAYER_PREVIEW) {
    return (
      <Screen title="Confirmar Jugadores">
        <Card className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-slate-900">¿Están todos?</h2>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-500 mb-3 font-medium uppercase tracking-wider">
              {state.players.length} jugadores detectados
            </p>
            <div className="flex flex-wrap gap-2">
              {state.players.map((p) => (
                <div 
                  key={p.id} 
                  className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-800 font-bold"
                >
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={editPlayers} className="flex items-center justify-center gap-2">
              <Edit2 className="w-4 h-4" /> Editar
            </Button>
            <Button onClick={confirmPlayers}>
              Iniciar Partida
            </Button>
          </div>
        </Card>
      </Screen>
    );
  }

  if (state.view === ViewState.WORD_SELECT) {
    return (
      <Screen title="Elegir Palabra">
        <div className="flex flex-col gap-4 h-full justify-center">
          <Card className="text-center py-10">
            <h3 className="text-2xl font-bold mb-4 text-slate-800">Banco de Palabras</h3>
            <p className="text-slate-500 mb-6">Elige una palabra al azar de nuestra lista de {WORD_BANK.length} palabras.</p>
            <Button onClick={() => handleStartRound('')} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              Usar Palabra Aleatoria
            </Button>
          </Card>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">O escribe una</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <Card>
             <form onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('customWord') as HTMLInputElement).value;
              if (input) handleStartRound(input);
            }}>
              <Input name="customWord" placeholder="Palabra personalizada..." />
              <Button type="submit" variant="secondary" className="mt-4">Usar Personalizada</Button>
            </form>
          </Card>
        </div>
      </Screen>
    );
  }

  if (state.view === ViewState.REVEAL) {
    if (!state.currentRound) return null;
    const currentPlayer = state.players[state.currentRound.revealIndex];
    const isSpy = currentPlayer.id === state.currentRound.spyId;
    const isRevealed = state.currentRound.isRevealed;

    return (
      <Screen title="Asignación de Roles">
        <div className="flex-1 flex flex-col justify-center items-center pb-12">
           <div className="w-full max-w-sm">
             {!isRevealed ? (
               <Card className="bg-gradient-to-br from-indigo-600 to-blue-800 text-white text-center py-16 flex flex-col items-center gap-8 shadow-blue-900/20 shadow-xl overflow-hidden relative">
                  {/* Decorative background circle */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                  
                  <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm relative z-10">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  
                  <div className="w-full relative z-10">
                    <p className="text-blue-100 text-lg font-medium mb-4 uppercase tracking-wider">Turno de</p>
                    <h2 className="text-5xl font-black text-white drop-shadow-md break-words leading-tight px-4">
                      {currentPlayer.name}
                    </h2>
                  </div>

                  <div className="mt-4 w-full px-8 relative z-10">
                    <Button onClick={handleRevealNext} className="bg-white text-blue-900 hover:bg-blue-50 w-full shadow-lg border-0 transform transition-transform hover:-translate-y-1">
                      <Eye className="w-5 h-5 mr-2 inline" />
                      Ver mi rol
                    </Button>
                  </div>
               </Card>
             ) : (
               <Card className={`text-center py-12 flex flex-col items-center gap-6 border-t-8 ${isSpy ? 'border-red-500' : 'border-blue-500'}`}>
                  <div className="mb-2">
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Tu rol secreto</p>
                    {isSpy ? (
                      <>
                        <h2 className="text-4xl font-black text-red-600 mb-2">¡ERES EL ESPÍA!</h2>
                        <p className="text-slate-600 text-lg">No conoces la palabra.</p>
                        <p className="text-slate-500 text-sm mt-2">Intenta pasar desapercibido y adivinar el tema.</p>
                      </>
                    ) : (
                      <>
                         <h2 className="text-xl font-bold text-slate-600 mb-1">La palabra es:</h2>
                         <h2 className="text-4xl font-black text-blue-600 break-words">{state.currentRound.word}</h2>
                         <p className="text-slate-500 text-sm mt-4">Encuentra al espía.</p>
                      </>
                    )}
                  </div>
                  <Button onClick={handleRevealNext} variant="primary">
                    <EyeOff className="w-5 h-5 mr-2 inline" />
                    Ocultar y Pasar
                  </Button>
               </Card>
             )}
             
             <div className="mt-8 flex justify-center gap-2">
               {state.players.map((_, idx) => (
                 <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === state.currentRound?.revealIndex ? 'bg-blue-600 scale-125' : (idx < (state.currentRound?.revealIndex || 0) ? 'bg-slate-300' : 'bg-slate-200')}`} />
               ))}
             </div>
           </div>
        </div>
      </Screen>
    );
  }

  if (state.view === ViewState.IN_PROGRESS) {
    return (
      <Screen title="Ronda en Curso">
        <div className="flex-1 flex flex-col justify-center items-center pb-20">
          <Card className="w-full text-center py-10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-blue-500 animate-pulse" />
             <h2 className="text-3xl font-black text-slate-800 mb-4">¡A Jugar!</h2>
             <p className="text-lg text-slate-600 mb-8">
               Hagan preguntas por turnos. <br/>
               El objetivo es encontrar al espía.
             </p>
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 mb-2">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Palabra Secreta</span>
               <div className="h-6 w-32 bg-slate-200 mx-auto rounded mt-2"></div>
             </div>
          </Card>
        </div>
        <div className="sticky bottom-4">
           <Button onClick={handleEndRound} variant="danger" className="shadow-lg shadow-red-200">
             Finalizar Ronda
           </Button>
        </div>
      </Screen>
    );
  }

  if (state.view === ViewState.RESULTS) {
    return <ResultsScreen players={state.players} onSave={handleSaveResults} />;
  }

  if (state.view === ViewState.LEADERBOARD) {
    return (
      <Screen title="Marcador">
        <div className="space-y-6 pb-24">
           {/* Current Leaderboard */}
           <Card className="p-0 overflow-hidden">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="font-bold flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Clasificación</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[...state.players].sort((a, b) => b.score - a.score).map((p, idx) => (
                  <div key={p.id} className="flex justify-between items-center p-4">
                     <div className="flex items-center gap-3">
                       <span className={`flex justify-center items-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                         {idx + 1}
                       </span>
                       <span className="font-medium text-slate-800">{p.name}</span>
                     </div>
                     <span className="font-bold text-lg text-blue-600">{p.score}</span>
                  </div>
                ))}
              </div>
           </Card>

           {/* History */}
           {state.history.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider flex items-center gap-2 px-1">
                <History className="w-4 h-4" /> Historial Reciente
              </h3>
              {state.history.map(h => (
                <Card key={h.id} className="p-4 flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                     <span className="font-bold text-slate-900">Palabra: {h.word}</span>
                     <span className="text-xs text-slate-400">{new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                   </div>
                   <div className="text-sm text-slate-600 grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <span className="text-xs text-slate-400 block">Espía</span>
                        <span className="font-medium">{h.spyName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Acusado</span>
                        <span className={`${h.accusedName === h.spyName ? 'text-green-600' : 'text-red-500'} font-medium`}>
                          {h.accusedName || 'Nadie'}
                        </span>
                      </div>
                   </div>
                   <div className="mt-2 pt-2 border-t border-slate-50 text-xs">
                     {h.spyGuessed ? (
                       <span className="text-green-600 font-bold">⚠️ El espía adivinó la palabra (+4 pts)</span>
                     ) : (
                       <span className="text-slate-400">El espía no adivinó la palabra</span>
                     )}
                   </div>
                </Card>
              ))}
            </div>
           )}
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 flex gap-3 z-50">
           <button 
            onClick={() => document.getElementById('settings-modal')?.classList.remove('hidden')}
            className="p-4 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
           >
             <Settings className="w-6 h-6" />
           </button>
           <Button onClick={newRound} className="flex-1 shadow-lg shadow-blue-200">
             Nueva Ronda <ChevronRight className="w-5 h-5 ml-1 inline" />
           </Button>
        </div>

        {/* Settings Modal (Simple implementation) */}
        <div id="settings-modal" className="hidden fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-10 fade-in">
             <h3 className="text-xl font-bold">Ajustes</h3>
             <Button variant="outline" onClick={resetScoresAndEdit} className="justify-start px-4">
                <User className="w-5 h-5 mr-3" /> Editar Jugadores
             </Button>
             <Button variant="outline" onClick={resetGame} className="justify-start px-4 text-red-600 border-red-100 hover:bg-red-50">
                <RefreshCcw className="w-5 h-5 mr-3" /> Reiniciar Partida Completa
             </Button>
             <Button variant="secondary" onClick={() => document.getElementById('settings-modal')?.classList.add('hidden')}>
                Cerrar
             </Button>
          </div>
        </div>
      </Screen>
    );
  }

  return null;
};

// Subcomponent for Results to keep main clean
const ResultsScreen: React.FC<{ players: Player[], onSave: (accusedId: string | null, spyGuessed: boolean) => void }> = ({ players, onSave }) => {
  const [accusedId, setAccusedId] = useState<string | 'nobody' | null>(null);
  const [spyGuessed, setSpyGuessed] = useState(false);

  const handleSubmit = () => {
    if (accusedId === null) {
      alert("Por favor selecciona quién fue acusado.");
      return;
    }
    onSave(accusedId === 'nobody' ? null : accusedId, spyGuessed);
  };

  return (
    <Screen title="Resultados de la Ronda">
      <Card className="flex flex-col gap-6">
        {/* Question A */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">1. ¿A quién acusaron?</h3>
          <div className="grid grid-cols-2 gap-2">
            {players.map(p => (
              <button
                key={p.id}
                onClick={() => setAccusedId(p.id)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${accusedId === p.id ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
              >
                {p.name}
              </button>
            ))}
            <button
               onClick={() => setAccusedId('nobody')}
               className={`p-3 rounded-lg border text-sm font-medium transition-all col-span-2 ${accusedId === 'nobody' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
            >
              Nadie / Indecisos
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100"></div>

        {/* Question B */}
        <div>
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-lg font-bold text-slate-800">2. ¿El Espía adivinó la palabra?</h3>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setSpyGuessed(false)}
               className={`flex-1 p-4 rounded-xl border font-bold transition-all ${!spyGuessed ? 'bg-slate-200 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-400'}`}
             >
               NO
             </button>
             <button 
               onClick={() => setSpyGuessed(true)}
               className={`flex-1 p-4 rounded-xl border font-bold transition-all ${spyGuessed ? 'bg-green-500 border-green-600 text-white shadow-green-200 shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
             >
               SÍ
             </button>
          </div>
        </div>

        <Button onClick={handleSubmit} className="mt-4">
          Guardar y Ver Puntajes
        </Button>
      </Card>
    </Screen>
  );
};

export default App;
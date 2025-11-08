import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Home, Music, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { sendModFoundTransaction, requestNFTMint, getExplorerLink, checkBalance } from '@/lib/carv';
import CharacterReaction from './CharacterReaction';
import type { Character } from './CharacterCreation';
import modIcon from '@/assets/mod-icon-new.png';
import trapIcon from '@/assets/trap-icon-new.png';
import hpIcon from '@/assets/hp-icon-new.png';
import randomIcon from '@/assets/random-icon-new.png';
import emptyIcon from '@/assets/empty-icon-new.png';
import { soundManager } from '@/lib/sounds';

type TileType = 'mod' | 'trap' | 'hp' | 'random' | 'empty';

interface Tile {
  id: number;
  type: TileType;
  revealed: boolean;
}

interface GameStats {
  hp: number;
  modsFound: number;
  tilesRevealed: number;
}

interface CharacterMessage {
  message: string;
  emotion: 'neutral' | 'happy' | 'hurt' | 'excited' | 'thinking';
}

interface GameGridProps {
  character: Character;
  onBackToMenu: () => void;
}

const GRID_SIZE = 5;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

const initializeGrid = (): Tile[] => {
  const tiles: Tile[] = [];
  const types: TileType[] = [
    ...Array(3).fill('mod'),
    ...Array(10).fill('trap'),
    ...Array(3).fill('hp'),
    ...Array(3).fill('random'),
    ...Array(6).fill('empty'),
  ];
  
  // Shuffle types
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  
  for (let i = 0; i < TOTAL_TILES; i++) {
    tiles.push({
      id: i,
      type: types[i],
      revealed: false,
    });
  }
  
  return tiles;
};

const getTileIcon = (type: TileType) => {
  switch (type) {
    case 'mod': return <img src={modIcon} alt="Mod" className="w-14 h-14 object-contain tile-bounce" />;
    case 'trap': return <img src={trapIcon} alt="Trap" className="w-14 h-14 object-contain tile-shake" />;
    case 'hp': return <img src={hpIcon} alt="HP" className="w-14 h-14 object-contain animate-glow-pulse" />;
    case 'random': return <img src={randomIcon} alt="Random" className="w-14 h-14 object-contain animate-rotate-glow" />;
    case 'empty': return <img src={emptyIcon} alt="Empty" className="w-12 h-12 object-contain opacity-40" />;
  }
};

const getTileColor = (type: TileType) => {
  switch (type) {
    case 'mod': return 'bg-neon-cyan shadow-glow-cyan';
    case 'trap': return 'bg-destructive shadow-glow-pink';
    case 'hp': return 'bg-success shadow-glow-cyan';
    case 'random': return 'bg-neon-purple shadow-glow-purple';
    case 'empty': return 'bg-muted';
  }
};

const characterReactions = {
  modFound: [
    { message: "Yes! One mod down! Keep up the pressure!", emotion: 'excited' as const },
    { message: "Got 'em! These mods can't hide from us!", emotion: 'happy' as const },
    { message: "Excellent work! The CARVverse thanks you!", emotion: 'happy' as const },
  ],
  trapHit: [
    { message: "Ugh! That hurt... Stay focused!", emotion: 'hurt' as const },
    { message: "Damn! I need to be more careful...", emotion: 'hurt' as const },
    { message: "These traps are no joke. Watch your step!", emotion: 'hurt' as const },
  ],
  hpGain: [
    { message: "Nice! That boost came at the right time.", emotion: 'happy' as const },
    { message: "Feeling better already. Let's keep hunting!", emotion: 'happy' as const },
  ],
  randomGood: [
    { message: "Interesting... This might help us.", emotion: 'thinking' as const },
    { message: "A lucky break! I'll take it.", emotion: 'happy' as const },
  ],
  randomBad: [
    { message: "What the... That wasn't supposed to happen!", emotion: 'hurt' as const },
    { message: "This is getting unpredictable...", emotion: 'thinking' as const },
  ],
  empty: [
    { message: "Nothing here. Keep searching.", emotion: 'neutral' as const },
    { message: "All clear. Moving on.", emotion: 'neutral' as const },
  ],
  lowHp: [
    { message: "HP is getting critical! Be careful!", emotion: 'hurt' as const },
    { message: "I can't take many more hits...", emotion: 'hurt' as const },
  ],
  nearVictory: [
    { message: "Just one more mod to go! We're almost there!", emotion: 'excited' as const },
    { message: "Victory is within reach! Stay sharp!", emotion: 'excited' as const },
  ],
};

const getRandomReaction = (reactions: CharacterMessage[]) => 
  reactions[Math.floor(Math.random() * reactions.length)];

export default function GameGrid({ character, onBackToMenu }: GameGridProps) {
  const [tiles, setTiles] = useState<Tile[]>(initializeGrid());
  const [stats, setStats] = useState<GameStats>({ hp: 5, modsFound: 0, tilesRevealed: 0 });
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [characterMessage, setCharacterMessage] = useState<CharacterMessage>({ message: '', emotion: 'neutral' });
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(soundManager.getMusicVolume());
  
  // Wallet hooks
  const wallet = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (gameStatus === 'won') {
      soundManager.win();
      soundManager.stopBackgroundMusic();
    } else if (gameStatus === 'lost') {
      soundManager.lose();
      soundManager.stopBackgroundMusic();
    }
  }, [gameStatus]);

  useEffect(() => {
    // شروع موزیک پس‌زمینه وقتی بازی شروع می‌شود
    soundManager.startBackgroundMusic();
    setIsMusicPlaying(true);

    return () => {
      // توقف موزیک وقتی component unmount می‌شود
      soundManager.stopBackgroundMusic();
    };
  }, []);

  const showCharacterReaction = (reaction: CharacterMessage) => {
    setCharacterMessage(reaction);
  };

  const handleTileClick = (tileId: number) => {
    if (gameStatus !== 'playing') return;
    
    const tile = tiles[tileId];
    if (tile.revealed) return;

    soundManager.click();

    const newTiles = [...tiles];
    newTiles[tileId].revealed = true;
    setTiles(newTiles);

    let newStats = { ...stats, tilesRevealed: stats.tilesRevealed + 1 };

    switch (tile.type) {
      case 'mod':
        soundManager.success();
        newStats.modsFound += 1;
        const modReaction = getRandomReaction(characterReactions.modFound);
        showCharacterReaction(modReaction);
        toast.success('🎉 Mod Captured!', { description: modReaction.message });
        
        // ✨ ارسال تراکنش به CARV Testnet (فقط برای Mod 1 و 2)
        if (wallet.connected && wallet.publicKey && newStats.modsFound < 3) {
          // بررسی موجودی قبل از تراکنش
          checkBalance(wallet.publicKey).then((balance) => {
            const requiredBalance = 0.002; // 0.001 for transfer + fees
            
            if (balance < requiredBalance) {
              toast.warning('Insufficient SOL Balance', {
                description: (
                  <a 
                    href="https://bridge.testnet.carv.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 underline"
                  >
                    Get testnet SOL from CARV Bridge <ExternalLink className="h-3 w-3" />
                  </a>
                ),
                duration: 8000,
              });
            } else {
              // موجودی کافی است، ارسال تراکنش
              // استراتژی "Fire and Forget": به محض دریافت signature موفقیت نمایش داده می‌شود
              sendModFoundTransaction(wallet, newStats.modsFound).then((signature) => {
                // بلافاصله موفقیت و لینک explorer نمایش داده می‌شود
                toast.success('Transaction Sent! 🎉', {
                  description: (
                    <a 
                      href={getExplorerLink(signature)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 underline"
                    >
                      View on CARV Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  ),
                  duration: 7000,
                });
              }).catch((error: any) => {
                console.error('Transaction failed:', error);
                
                // نمایش پیام خطای دقیق‌تر
                let errorMessage = 'Please check console for details';
                if (error.message?.includes('Wallet not connected')) {
                  errorMessage = 'Wallet not connected. Please reconnect your wallet.';
                } else if (error.message?.includes('User rejected')) {
                  errorMessage = 'Transaction was rejected';
                } else if (error.message?.includes('insufficient')) {
                  errorMessage = 'Insufficient SOL balance';
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                toast.error('Transaction failed - Game continues!', {
                  description: errorMessage,
                  duration: 7000,
                });
              });
            }
          }).catch((error) => {
            console.error('Balance check failed:', error);
            // اگر چک موجودی شکست خورد، همچنان بازی ادامه می‌یابد
          });
        }
        
        if (newStats.modsFound === 3) {
          setGameStatus('won');
          
          // ✨ Mint NFT
          if (wallet.connected && wallet.publicKey) {
            toast.info('Minting your Victory NFT...');
            
            requestNFTMint(
              wallet.publicKey.toString(),
              newStats
            ).then((result) => {
              toast.success('🏆 Victory NFT Minted!', {
                description: (
                  <a 
                    href={result.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 underline"
                  >
                    View your NFT in CARV Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                ),
                duration: 10000,
              });
            }).catch((error) => {
              console.error('NFT mint failed:', error);
              toast.error('NFT minting failed, but you still won! 🎉');
            });
          }
        } else if (newStats.modsFound === 2) {
          setTimeout(() => {
            showCharacterReaction(getRandomReaction(characterReactions.nearVictory));
          }, 3500);
        }
        break;

      case 'trap':
        soundManager.explosion();
        newStats.hp -= 1;
        const trapReaction = getRandomReaction(characterReactions.trapHit);
        showCharacterReaction(trapReaction);
        toast.error('💥 Trap Triggered!', { description: `-1 HP. ${newStats.hp} HP remaining.` });
        
        if (newStats.hp <= 0) {
          setGameStatus('lost');
        } else if (newStats.hp <= 2) {
          setTimeout(() => {
            showCharacterReaction(getRandomReaction(characterReactions.lowHp));
          }, 3500);
        }
        break;

      case 'hp':
        soundManager.hpGain();
        newStats.hp = Math.min(newStats.hp + 1, 10);
        const hpReaction = getRandomReaction(characterReactions.hpGain);
        showCharacterReaction(hpReaction);
        toast.success('❤️ HP Restored!', { description: hpReaction.message });
        break;

      case 'random':
        soundManager.random();
        const effect = Math.random();
        if (effect < 0.3) {
          newStats.hp = Math.min(newStats.hp + 1, 10);
          const goodReaction = getRandomReaction(characterReactions.randomGood);
          showCharacterReaction(goodReaction);
          toast(goodReaction.message, { description: '+1 HP' });
        } else if (effect < 0.5) {
          newStats.hp -= 1;
          const badReaction = getRandomReaction(characterReactions.randomBad);
          showCharacterReaction(badReaction);
          toast(badReaction.message, { description: '-1 HP' });
          if (newStats.hp <= 0) setGameStatus('lost');
        } else {
          const thinkReaction = getRandomReaction(characterReactions.randomGood);
          showCharacterReaction(thinkReaction);
          toast.info(thinkReaction.message, { description: 'Random encounter!' });
        }
        break;

      case 'empty':
        const emptyReaction = getRandomReaction(characterReactions.empty);
        showCharacterReaction(emptyReaction);
        toast('Nothing here!', { description: 'Safe tile.' });
        break;
    }

    setStats(newStats);
  };

  const resetGame = () => {
    setTiles(initializeGrid());
    setStats({ hp: 5, modsFound: 0, tilesRevealed: 0 });
    setGameStatus('playing');
    setCharacterMessage({ message: '', emotion: 'neutral' });
    soundManager.startBackgroundMusic();
    setIsMusicPlaying(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <CharacterReaction 
        avatar={character.avatar}
        name={character.name}
        message={characterMessage.message}
        emotion={characterMessage.emotion}
      />

      <div className="w-full max-w-2xl space-y-6">
        {/* Header with Character */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBackToMenu}
                className="rounded-full bg-background/80 backdrop-blur-sm"
                title="بازگشت به منو"
              >
                <Home className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const playing = soundManager.toggleBackgroundMusic();
                  setIsMusicPlaying(playing);
                  toast(playing ? 'Music enabled' : 'Music disabled');
                }}
                className="rounded-full bg-background/80 backdrop-blur-sm"
                title="موزیک پس‌زمینه"
              >
                <Music className={`h-5 w-5 ${isMusicPlaying ? '' : 'opacity-40'}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const newMuted = soundManager.toggleMute();
                  setIsMuted(newMuted);
                  toast(newMuted ? 'Sound muted' : 'Sound unmuted');
                }}
                className="rounded-full bg-background/80 backdrop-blur-sm"
                title="جلوه‌های صوتی"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-neon bg-clip-text text-transparent">
              CARV Mod Hunt
            </h1>

            <div className="w-32"></div>
          </div>

          {/* Volume Control Slider */}
          <div className="flex items-center justify-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/20 w-fit mx-auto">
            <Volume2 className="w-4 h-4 text-primary" />
            <Slider
              value={[musicVolume * 100]}
              onValueChange={(value) => {
                const newVolume = value[0] / 100;
                setMusicVolume(newVolume);
                soundManager.setMusicVolume(newVolume);
              }}
              max={100}
              step={1}
              className="w-24"
              disabled={!isMusicPlaying}
            />
            <span className="text-xs text-primary/70 w-8 text-right">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          
          {/* Character Display */}
          <Card className="p-4 border-2 border-primary/30 bg-card/50 backdrop-blur mx-auto max-w-md">
            <div className="flex items-center gap-4">
              <img 
                src={character.avatar}
                alt={character.name}
                className="w-16 h-16 rounded-xl ring-2 ring-primary shadow-glow-cyan object-cover"
              />
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">Active Hunter</p>
                <h3 className="text-xl font-bold">{character.name}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Wallet Status Badge */}
        {wallet.connected && wallet.publicKey && (
          <Card className="p-3 bg-secondary/20 border-secondary/50 backdrop-blur">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-foreground">
                Connected: {wallet.publicKey.toString().slice(0, 4)}...
                {wallet.publicKey.toString().slice(-4)}
              </span>
              <a
                href="https://bridge.testnet.carv.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline flex items-center gap-1"
              >
                Get Test SOL <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </Card>
        )}

        {/* Stats */}
        <Card className="p-4 border-2 border-primary/30 bg-card/50 backdrop-blur">
          <div className="flex justify-around items-center">
            <div className="flex items-center gap-2">
              <img src={hpIcon} alt="HP" className="w-8 h-8" />
              <span className="text-xl font-bold">{stats.hp} HP</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={modIcon} alt="Mods" className="w-8 h-8" />
              <span className="text-xl font-bold">{stats.modsFound}/3 Mods</span>
            </div>
            <div className="flex items-center gap-2">
              <img src={emptyIcon} alt="Tiles" className="w-7 h-7 opacity-60" />
              <span className="text-xl font-bold">{stats.tilesRevealed} Tiles</span>
            </div>
          </div>
        </Card>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-3 p-4 bg-card/30 backdrop-blur rounded-xl border-2 border-primary/20 shadow-glow-cyan">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              disabled={tile.revealed || gameStatus !== 'playing'}
              className={`
                aspect-square rounded-lg transition-all duration-500
                ${tile.revealed 
                  ? `${getTileColor(tile.type)} tile-flip` 
                  : 'bg-gradient-cyber hover:scale-110 hover:shadow-glow-cyan hover:rotate-3'
                }
                ${tile.revealed ? '' : 'cursor-pointer active:scale-95'}
                disabled:cursor-not-allowed
                flex items-center justify-center
                border-2 border-primary/40
                relative overflow-hidden
              `}
            >
              {!tile.revealed && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              )}
              {tile.revealed && getTileIcon(tile.type)}
            </button>
          ))}
        </div>

        {/* Game Over Overlay - Centered Modal */}
        {gameStatus !== 'playing' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <Card className="p-8 text-center space-y-6 border-2 border-primary animate-pulse-glow bg-card/95 backdrop-blur max-w-md w-full animate-scale-in">
              {gameStatus === 'won' ? (
                <>
                  <div className="text-6xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-4xl font-bold bg-gradient-success bg-clip-text text-transparent">
                    Mission Complete!
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <img 
                      src={character.avatar}
                      alt={character.name}
                      className="w-20 h-20 rounded-xl ring-2 ring-success shadow-glow-cyan object-cover"
                    />
                    <div className="text-left">
                      <p className="text-xl font-bold">{character.name}</p>
                      <p className="text-sm text-muted-foreground">All mods captured!</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    HP Remaining: {stats.hp} | Tiles Revealed: {stats.tilesRevealed}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">💀</div>
                  <h2 className="text-4xl font-bold bg-gradient-danger bg-clip-text text-transparent">
                    Mission Failed
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <img 
                      src={character.avatar}
                      alt={character.name}
                      className="w-20 h-20 rounded-xl ring-2 ring-destructive object-cover grayscale"
                    />
                    <div className="text-left">
                      <p className="text-xl font-bold">{character.name}</p>
                      <p className="text-sm text-muted-foreground">HP depleted...</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Mods Found: {stats.modsFound}/3 | Tiles Revealed: {stats.tilesRevealed}
                  </p>
                </>
              )}
              <div className="flex gap-3">
                <Button 
                  onClick={resetGame}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={onBackToMenu}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  Change Hunter
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Blockchain Features */}
        <Card className="p-4 bg-secondary/10 backdrop-blur border-secondary/30">
          <CardContent className="p-0">
            <h3 className="font-bold mb-2 text-secondary">🔗 Blockchain Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Connect your Backpack wallet to earn rewards</li>
              <li>• Each Mod found = On-chain transaction on CARV</li>
              <li>• Win the game = Victory NFT minted!</li>
              <li>• Need test SOL? Use <a href="https://bridge.testnet.carv.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">CARV Bridge</a></li>
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="p-4 bg-card/30 backdrop-blur border-border">
          <h3 className="font-bold mb-2 text-neon-cyan">How to Play:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Click tiles to reveal what's hidden</li>
            <li>• Find all 3 <span className="text-neon-cyan">Mods</span> to win</li>
            <li>• Avoid <span className="text-destructive">Traps</span> (-1 HP)</li>
            <li>• Collect <span className="text-success">HP tiles</span> (+1 HP)</li>
            <li>• <span className="text-neon-purple">Random characters</span> have unpredictable effects</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import GameGrid from '@/components/GameGrid';
import CharacterCreation, { Character } from '@/components/CharacterCreation';

const Index = () => {
  const [character, setCharacter] = useState<Character | null>(null);

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* دکمه Wallet در گوشه */}
        <div className="absolute top-4 right-4 z-50">
          <WalletMultiButton className="!bg-secondary hover:!bg-secondary/90" />
        </div>
        <CharacterCreation onComplete={setCharacter} />
      </div>
    );
  }

  return (
    <>
      {/* دکمه Wallet در صفحه بازی */}
      <div className="absolute top-4 right-4 z-50">
        <WalletMultiButton className="!bg-secondary hover:!bg-secondary/90" />
      </div>
      <GameGrid character={character} onBackToMenu={() => setCharacter(null)} />
    </>
  );
};

export default Index;

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import avatar1 from '@/assets/avatar-1.png';
import avatar2 from '@/assets/avatar-2.png';
import avatar3 from '@/assets/avatar-3.png';
import avatar4 from '@/assets/avatar-4.png';

export interface Character {
  name: string;
  avatar: string;
  avatarId: number;
}

interface CharacterCreationProps {
  onComplete: (character: Character) => void;
}

const avatars = [
  { id: 1, src: avatar1, name: 'Nova' },
  { id: 2, src: avatar2, name: 'Vex' },
  { id: 3, src: avatar3, name: 'Shadow' },
  { id: 4, src: avatar4, name: 'Cypher' },
];

export default function CharacterCreation({ onComplete }: CharacterCreationProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [name, setName] = useState('');

  const handleStart = () => {
    const avatar = avatars.find(a => a.id === selectedAvatar);
    if (!avatar) return;
    
    onComplete({
      name: name.trim() || avatar.name,
      avatar: avatar.src,
      avatarId: selectedAvatar,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6 border-2 border-primary/30 bg-card/50 backdrop-blur animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-neon bg-clip-text text-transparent animate-float">
            Create Your Hunter
          </h1>
          <p className="text-muted-foreground">Choose your avatar and name to begin the hunt</p>
        </div>

        {/* Avatar Selection */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-neon-cyan">Select Your Avatar</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {avatars.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`
                  relative aspect-square rounded-xl overflow-hidden transition-all duration-300
                  ${selectedAvatar === avatar.id 
                    ? 'ring-4 ring-primary shadow-glow-cyan scale-105' 
                    : 'ring-2 ring-border hover:ring-primary/50 hover:scale-102'
                  }
                `}
              >
                <img 
                  src={avatar.src} 
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatar.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-lg">Hunter Name (Optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={avatars.find(a => a.id === selectedAvatar)?.name || 'Enter your name'}
            className="text-lg h-12 bg-background/50 border-primary/30 focus:border-primary"
            maxLength={20}
          />
        </div>

        {/* Character Preview */}
        <Card className="p-6 bg-gradient-cyber border-2 border-primary/30">
          <div className="flex items-center gap-4">
            <img 
              src={avatars.find(a => a.id === selectedAvatar)?.src} 
              alt="Selected avatar"
              className="w-20 h-20 rounded-xl ring-2 ring-primary shadow-glow-cyan"
            />
            <div>
              <p className="text-sm text-muted-foreground">Your Hunter</p>
              <h3 className="text-2xl font-bold text-foreground">
                {name.trim() || avatars.find(a => a.id === selectedAvatar)?.name}
              </h3>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <Button 
          onClick={handleStart}
          size="lg"
          className="w-full h-14 text-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-cyan"
        >
          Begin the Hunt
        </Button>

        {/* Mission Brief */}
        <Card className="p-4 bg-card/30 backdrop-blur border-border">
          <h4 className="font-bold mb-2 text-neon-cyan">Mission Brief:</h4>
          <p className="text-sm text-muted-foreground">
            Three rogue moderators have gone into hiding across the digital grid. 
            Your mission: locate and capture all three before your HP runs out. 
            Stay sharp, hunter. The CARVverse is counting on you.
          </p>
        </Card>
      </Card>
    </div>
  );
}

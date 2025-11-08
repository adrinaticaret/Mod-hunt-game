import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface CharacterReactionProps {
  avatar: string;
  name: string;
  message: string;
  emotion: 'neutral' | 'happy' | 'hurt' | 'excited' | 'thinking';
}

const emotionStyles = {
  neutral: 'border-border',
  happy: 'border-success shadow-glow-cyan animate-pulse-glow',
  hurt: 'border-destructive shadow-glow-pink',
  excited: 'border-neon-cyan shadow-glow-cyan',
  thinking: 'border-neon-purple shadow-glow-purple',
};

const emotionMessages = {
  neutral: '',
  happy: '😊',
  hurt: '😖',
  excited: '🔥',
  thinking: '🤔',
};

export default function CharacterReaction({ avatar, name, message, emotion }: CharacterReactionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!show || !message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-scale-in">
      <Card className={`p-4 border-2 ${emotionStyles[emotion]} bg-card/95 backdrop-blur max-w-xs`}>
        <div className="flex items-start gap-3">
          <img 
            src={avatar} 
            alt={name}
            className={`w-16 h-16 rounded-lg ring-2 ring-primary object-cover ${
              emotion === 'hurt' ? 'animate-pulse' : ''
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-sm">{name}</h4>
              {emotionMessages[emotion] && (
                <span className="text-lg">{emotionMessages[emotion]}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-tight">{message}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

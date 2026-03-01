'use client'

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSpeechOptions {
  voice?: string;
  autoPlay?: boolean;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      setIsLoading(true);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const response = await fetch('/api/elevenlabs/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 500 && errorData.error === 'ElevenLabs API key not configured') {
          throw new Error('ElevenLabs API key not configured. Please add your API key to enable speech generation.');
        }
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => setIsLoading(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        toast({
          title: "Audio playback failed",
          description: "There was an error playing the generated speech.",
          variant: "destructive",
        });
      };

      if (options.autoPlay !== false) {
        await audio.play();
      }

      return audio;

    } catch (error) {
      console.error('Speech generation error:', error);
      setIsLoading(false);
      toast({
        title: "Speech generation failed",
        description: "Unable to generate speech. Please try again.",
        variant: "destructive",
      });
    }
  }, [options.voice, options.autoPlay, toast]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Resume playback error:', error);
      }
    }
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isLoading,
    isPlaying,
  };
}
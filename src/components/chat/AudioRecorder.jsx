import React, { useState, useRef } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioRecorder({ onAudioRecorded, disabled = false }) {
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const handleSend = () => {
    if (recordedBlob) {
      onAudioRecorded(recordedBlob);
      setRecordedBlob(null);
      setDuration(0);
    }
  };

  const handleCancel = () => {
    setRecordedBlob(null);
    setDuration(0);
    clearInterval(timerIntervalRef.current);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
        <Mic className="w-5 h-5 text-red-500" />
        <span className="text-sm font-medium text-red-600">{formatDuration(duration)}</span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={stopRecording}
          className="ml-auto"
        >
          <Square className="w-4 h-4" />
          Stop
        </Button>
      </div>
    );
  }

  if (recordedBlob) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
        <Mic className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-medium text-blue-600">
          Audio: {formatDuration(duration)}
        </span>
        <Button
          type="button"
          size="sm"
          onClick={handleSend}
          className="ml-auto bg-teal-500 hover:bg-teal-600"
        >
          <Send className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      className="text-slate-500 hover:text-teal-600"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}

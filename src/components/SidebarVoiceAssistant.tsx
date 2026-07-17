import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2, HelpCircle, Volume2, Radio } from 'lucide-react';
import { Quotation, VoiceLogEntry } from '../types';

interface SidebarVoiceAssistantProps {
  onProcessTranscript: (text: string) => Promise<void>;
  aiLoading: boolean;
  lastExplanation: string | null;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  voiceLogs: VoiceLogEntry[];
  onOpenHelp: () => void;
  currentQuote: Quotation;
  onApplyLiveUpdate: (updatedData: any) => void;
  onAddVoiceLog: (log: VoiceLogEntry) => void;
}

export const SidebarVoiceAssistant: React.FC<SidebarVoiceAssistantProps> = ({
  onProcessTranscript,
  aiLoading,
  lastExplanation,
  isListening,
  setIsListening,
  voiceLogs,
  onOpenHelp,
  currentQuote,
  onApplyLiveUpdate,
  onAddVoiceLog,
}) => {
  const [inputText, setInputText] = useState('');
  const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'connected' | 'active'>('idle');
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveModelTranscript, setLiveModelTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentQuoteRef = useRef(currentQuote);
  const onApplyLiveUpdateRef = useRef(onApplyLiveUpdate);
  const onAddVoiceLogRef = useRef(onAddVoiceLog);

  // WebSockets and Audio context refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    currentQuoteRef.current = currentQuote;
  }, [currentQuote]);

  useEffect(() => {
    onApplyLiveUpdateRef.current = onApplyLiveUpdate;
  }, [onApplyLiveUpdate]);

  useEffect(() => {
    onAddVoiceLogRef.current = onAddVoiceLog;
  }, [onAddVoiceLog]);

  // Sync isListening from prop with our Live session
  useEffect(() => {
    if (isListening) {
      if (liveStatus === 'idle') {
        startLiveSession();
      }
    } else {
      if (liveStatus !== 'idle') {
        stopLiveSession();
      }
    }
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const playAudioChunk = (base64Data: string) => {
    const outputCtx = outputAudioCtxRef.current;
    if (!outputCtx) return;

    try {
      const binary = atob(base64Data);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const numSamples = len / 2;
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = outputCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);

      const currentTime = outputCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.05;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((src) => src !== source);
      };
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  };

  const stopPlayback = () => {
    if (activeSourcesRef.current) {
      activeSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch (e) {}
      });
      activeSourcesRef.current = [];
    }
    nextStartTimeRef.current = 0;
  };

  const stopLiveSession = () => {
    setIsListening(false);
    setLiveStatus('idle');
    setLiveUserTranscript('');
    setLiveModelTranscript('');

    stopPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {}
      processorRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch (e) {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch (e) {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      } catch (e) {}
      wsRef.current = null;
    }
  };

  const startLiveSession = async () => {
    try {
      setError(null);
      setLiveStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?quote=${encodeURIComponent(JSON.stringify(currentQuoteRef.current))}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Client WebSocket connected to server Live bridge');
        setLiveStatus('connected');

        try {
          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          inputAudioCtxRef.current = inputCtx;
          outputAudioCtxRef.current = outputCtx;
          nextStartTimeRef.current = 0;
          activeSourcesRef.current = [];

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const channelData = e.inputBuffer.getChannelData(0);
              const pcmBuffer = floatTo16BitPCM(channelData);
              const base64 = arrayBufferToBase64(pcmBuffer);
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };
        } catch (err: any) {
          console.error('Audio initialization error:', err);
          setError('Failed to access microphone or initialize audio contexts.');
          stopLiveSession();
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.error) {
            setError(msg.error);
            stopLiveSession();
            return;
          }

          if (msg.status === 'connected') {
            setLiveStatus('active');
          }

          if (msg.audio) {
            playAudioChunk(msg.audio);
          }

          if (msg.interrupted) {
            stopPlayback();
          }

          if (msg.userTranscript) {
            setLiveUserTranscript(msg.userTranscript);
            setLiveModelTranscript('');
          }

          if (msg.modelTranscript) {
            setLiveModelTranscript((prev) => prev + msg.modelTranscript);
          }

          if (msg.toolCall) {
            const { name, args } = msg.toolCall;
            if (name === 'update_quotation') {
              onApplyLiveUpdateRef.current(args);

              const explanationText = args.explanation || 'Updated quote fields via Gemini Live conversational updates.';
              
              const logEntry: VoiceLogEntry = {
                id: 'log-live-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                transcript: 'Conversational edit',
                explanation: explanationText,
                type: 'success',
              };

              onAddVoiceLogRef.current(logEntry);
            }
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        console.log('Client WebSocket closed');
        stopLiveSession();
      };

      ws.onerror = (err) => {
        console.error('Client WebSocket error:', err);
        setError('WebSocket connection error.');
        stopLiveSession();
      };

    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setError(err.message || 'Failed to start Gemini Live.');
      stopLiveSession();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopLiveSession();
    } else {
      setIsListening(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || aiLoading) return;
    const textToProcess = inputText;
    setInputText('');
    await onProcessTranscript(textToProcess);
  };

  const handleQuickPrompt = async (promptText: string) => {
    if (aiLoading) return;
    await onProcessTranscript(promptText);
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      <div className="p-6 flex flex-col h-full overflow-hidden">
        
        {/* Voice Assistant Box */}
        <div className="mb-6 shrink-0">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-indigo-600 font-bold mb-3 flex items-center justify-between">
            <span>Gemini Live Voice</span>
            <span className="flex h-2 w-2 relative">
              {isListening ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300"></span>
              )}
            </span>
          </h2>

          <div className="bg-slate-950 rounded-xl p-5 relative overflow-hidden shadow-lg border border-slate-800 text-white">
            {/* Visualizer Simulation */}
            <div className="flex items-center justify-center gap-1.5 h-10 mb-3">
              <div className={`w-1.5 bg-indigo-500 rounded-full transition-all duration-150 ${liveStatus === 'active' ? 'animate-bounce h-6' : 'h-3 bg-slate-700'}`}></div>
              <div className={`w-1.5 bg-indigo-400 rounded-full transition-all duration-150 ${liveStatus === 'active' ? 'animate-bounce h-10 delay-75' : 'h-4 bg-slate-700'}`}></div>
              <div className={`w-1.5 bg-purple-400 rounded-full transition-all duration-150 ${liveStatus === 'active' ? 'animate-bounce h-12 delay-100' : 'h-3 bg-slate-700'}`}></div>
              <div className={`w-1.5 bg-indigo-300 rounded-full transition-all duration-150 ${liveStatus === 'active' ? 'animate-bounce h-8 delay-150' : 'h-5 bg-slate-700'}`}></div>
              <div className={`w-1.5 bg-purple-500 rounded-full transition-all duration-150 ${liveStatus === 'active' ? 'animate-bounce h-5 delay-200' : 'h-2 bg-slate-700'}`}></div>
            </div>

            <div className="min-h-[64px] flex flex-col justify-center">
              {error ? (
                <p className="text-rose-400 text-xs text-center leading-relaxed font-semibold">
                  {error}
                </p>
              ) : liveStatus === 'idle' ? (
                <p className="text-slate-400 text-xs leading-relaxed text-center italic">
                  "Start Gemini Live to edit this quote with dynamic voice conversation..."
                </p>
              ) : liveStatus === 'connecting' ? (
                <p className="text-indigo-200 text-xs leading-relaxed text-center animate-pulse flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  Connecting to Gemini Live...
                </p>
              ) : liveStatus === 'connected' ? (
                <p className="text-indigo-100 text-xs leading-relaxed text-center italic animate-pulse">
                  Initializing conversation...
                </p>
              ) : (
                <div className="space-y-1">
                  {liveUserTranscript && (
                    <p className="text-indigo-200 text-[11px] leading-tight font-medium">
                      <span className="text-indigo-400 font-bold uppercase text-[9px] tracking-wider block">You</span>
                      "{liveUserTranscript}"
                    </p>
                  )}
                  {liveModelTranscript && (
                    <p className="text-purple-100 text-[11px] leading-tight font-medium">
                      <span className="text-purple-400 font-bold uppercase text-[9px] tracking-wider block">Gemini</span>
                      {liveModelTranscript}
                    </p>
                  )}
                  {!liveUserTranscript && !liveModelTranscript && (
                    <p className="text-indigo-300 text-xs text-center animate-pulse flex items-center justify-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      Gemini Live is listening...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                disabled={aiLoading}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'End Session' : 'Start Live'}</span>
              </button>
            </div>
          </div>

          {/* Type Instruction Form */}
          <form onSubmit={handleSubmit} className="mt-3 flex gap-1.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type quote command..."
              disabled={aiLoading || isListening}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans disabled:opacity-55"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || aiLoading || isListening}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors"
              title="Send to AI"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Quick Prompts */}
          <div className="mt-3 flex flex-wrap gap-1">
            {[
              'Add 5 hours dev @ $150',
              'Apply 10% discount',
              'Set Net 30 terms',
              'Add 8.5% tax'
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={aiLoading || isListening}
                onClick={() => handleQuickPrompt(p)}
                className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-1 rounded border border-slate-200 transition-colors truncate max-w-[140px] disabled:opacity-50"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Parsing History */}
        <div className="flex-1 overflow-y-auto flex flex-col pr-1 space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1 sticky top-0 bg-white py-1">
            Parsing History ({voiceLogs.length})
          </h3>
          {voiceLogs.length === 0 ? (
            <div className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-md border border-slate-100">
              Voice commands & edits will appear here in real-time.
            </div>
          ) : (
            <div className="space-y-2.5">
              {voiceLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2.5 rounded-r-md border-l-2 text-xs transition-all ${
                    log.type === 'error'
                      ? 'bg-rose-50 border-rose-500 text-rose-900'
                      : 'bg-slate-50 border-indigo-500 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                    <span className="font-mono">{log.timestamp}</span>
                    <span className="truncate max-w-[120px] italic">“{log.transcript}”</span>
                  </div>
                  <p className="font-medium text-slate-800 text-[11px] leading-tight">
                    {log.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Command List Button */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          <button
            onClick={onOpenHelp}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-slate-200"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Voice Command Guide</span>
          </button>
        </div>

      </div>
    </aside>
  );
};

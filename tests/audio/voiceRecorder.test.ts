import { describe, it, expect, beforeEach } from 'vitest';
import { VoiceRecorderService } from '../../src/services/audio/voiceRecorder';

describe('Phase 58: Voice Memos, Dictation & Audio Transcriber (voiceRecorder)', () => {
  let service: VoiceRecorderService;

  beforeEach(() => {
    service = new VoiceRecorderService();
  });

  it('initializes with inactive state and empty recordings', () => {
    expect(service.getState()).toBe('inactive');
    expect(service.isRecordingActive()).toBe(false);
    expect(service.isPaused()).toBe(false);
    expect(service.getRecordings()).toHaveLength(0);
  });

  it('starts and manages recording lifecycle', async () => {
    await service.startRecording('Karakter Notu');
    expect(service.getState()).toBe('recording');
    expect(service.isRecordingActive()).toBe(true);

    service.pauseRecording();
    expect(service.getState()).toBe('paused');
    expect(service.isPaused()).toBe(true);

    service.resumeRecording();
    expect(service.getState()).toBe('recording');

    const rec = await service.stopRecording('Karakter Notu');
    expect(service.getState()).toBe('inactive');
    expect(rec.id).toBeDefined();
    expect(rec.title).toBe('Karakter Notu');
    expect(rec.durationSeconds).toBeGreaterThanOrEqual(0);
    expect(service.getRecordings()).toHaveLength(1);
  });

  it('throws error when trying to start recording twice or stop when inactive', async () => {
    await service.startRecording('Deneme');
    await expect(service.startRecording('İkinci')).rejects.toThrow();

    await service.stopRecording();
    await expect(service.stopRecording()).rejects.toThrow();
  });

  it('deletes recordings correctly', async () => {
    await service.startRecording('Kayıt 1');
    const rec1 = await service.stopRecording('Kayıt 1');

    await service.startRecording('Kayıt 2');
    const rec2 = await service.stopRecording('Kayıt 2');

    expect(service.getRecordings()).toHaveLength(2);

    service.deleteRecording(rec1.id);
    const remaining = service.getRecordings();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(rec2.id);
  });

  it('provides waveform amplitudes for visualization', async () => {
    const inactiveWave = service.getWaveformData();
    expect(Array.isArray(inactiveWave)).toBe(true);
    expect(inactiveWave.length).toBeGreaterThan(0);

    await service.startRecording();
    const activeWave = service.getWaveformData();
    expect(activeWave.length).toBeGreaterThan(0);
    expect(activeWave[0]).toBeGreaterThanOrEqual(0);

    await service.stopRecording();
  });

  it('manages dictation status', () => {
    expect(service.isDictatingActive()).toBe(false);
    service.startDictation('tr-TR');
    expect(service.isDictatingActive()).toBe(true);

    service.stopDictation();
    expect(service.isDictatingActive()).toBe(false);
  });
});

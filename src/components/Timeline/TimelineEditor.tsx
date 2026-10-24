import React, { useState } from 'react';
import { TimelineEvent, Plotline } from '../../types/timeline';
import { timelineStore } from '../../services/timelineStore';

interface TimelineEditorProps {
  onClose: () => void;
  existingEvent?: TimelineEvent;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ onClose, existingEvent }) => {
  const [formData, setFormData] = useState<any>(
    existingEvent || {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `event_${Date.now()}`,
      title: '',
      description: '',
      timelinePosition: 0,
      timelineLabel: '',
      narrativeOrder: 0,
      category: 'plot',
      color: '#3B82F6',
      isMajorEvent: false,
      isDraft: false,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characterIds: [],
      date: '',
      time: '',
      position: 'chronological',
      chapterOrder: 0,
      categoryId: '',
      plotlineIds: [],
      tags: [],
      binderDocId: '',
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingEvent) {
      timelineStore.dispatch({ type: 'UPDATE_EVENT', payload: formData });
    } else {
      timelineStore.dispatch({ type: 'ADD_EVENT', payload: formData });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} className="editor-form" style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px' }}>
        <h3>{existingEvent ? 'Edit Event' : 'Add New Event'}</h3>
        
        <label>Title:</label>
        <input name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', marginBottom: '10px' }} />

        <label>Description:</label>
        <textarea name="description" value={formData.description} onChange={handleChange} style={{ width: '100%', height: '80px', marginBottom: '10px' }} />

        <label>Date:</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} style={{ width: '100%', marginBottom: '10px' }} />

        <label>Chapter Order:</label>
        <input type="number" name="chapterOrder" value={formData.chapterOrder} onChange={handleChange} style={{ width: '100%', marginBottom: '10px' }} />

        <label>Tags (comma separated):</label>
        <input 
          name="tagsInput" 
          defaultValue={formData.tags.join(',')} 
          onChange={(e) => setFormData((prev: any) => ({...prev, tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean)}))} 
          style={{ width: '100%', marginBottom: '10px' }} 
        />

        <div className="actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
};

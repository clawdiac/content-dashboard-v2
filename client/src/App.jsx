import React, { useState, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchFilters from './components/SearchFilters';
import Gallery from './components/Gallery';
import ImageModal from './components/ImageModal';
import FeedbackForm from './components/FeedbackForm';
import StatsPanel from './components/StatsPanel';
import { useSocket } from './hooks/useSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    close: 0,
    success_rate: 0,
  });
  const [theme, setTheme] = useState('dark');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [filters, setFilters] = useState({
    status: null,
    batch: null,
    from: null,
    to: null,
    search: '',
  });
  const [statusFilter, setStatusFilter] = useState('All');

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Socket.IO initialization
  const { socket, connected } = useSocket('http://localhost:3000', (event, data) => {
    if (event === 'image:new') {
      setImages(prev => [data, ...prev]);
    } else if (event === 'image:updated') {
      setImages(prev =>
        prev.map(img =>
          img.filename === data.filename
            ? { ...img, approval_status: data.approval_status }
            : img
        )
      );
    } else if (event === 'stats:updated') {
      setStats(data);
    }
  });

  // Fetch initial images
  useEffect(() => {
    fetchImages();
  }, [filters, statusFilter]);

  const fetchImages = async () => {
    try {
      const params = new URLSearchParams();
      
      if (statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const response = await fetch(`/api/images?${params.toString()}`);
      const data = await response.json();
      
      let filtered = data.images;
      if (filters.search) {
        filtered = filtered.filter(img =>
          img.filename.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setImages(data.images);
      setFilteredImages(filtered);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  };

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onApprove: () => {
      if (selectedImage) handleApprove('APPROVED');
    },
    onReject: () => {
      if (selectedImage) handleApprove('REJECTED');
    },
    onFeedback: () => {
      if (selectedImage) setShowFeedbackForm(true);
    },
    onClose: () => {
      setSelectedImage(null);
      setShowFeedbackForm(false);
    },
  });

  const handleApprove = async (status) => {
    if (!selectedImage) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedImage.filename,
          status,
          feedback_text: '',
        }),
      });

      if (response.ok) {
        setImages(prev =>
          prev.map(img =>
            img.filename === selectedImage.filename
              ? { ...img, approval_status: status }
              : img
          )
        );
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleFeedback = async (status, feedback_text) => {
    if (!selectedImage) return;

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedImage.filename,
          status,
          feedback_text,
        }),
      });

      if (response.ok) {
        setImages(prev =>
          prev.map(img =>
            img.filename === selectedImage.filename
              ? { ...img, approval_status: status }
              : img
          )
        );
        setShowFeedbackForm(false);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Header 
        onRefresh={fetchImages} 
        onToggleTheme={toggleTheme}
        theme={theme}
        stats={stats}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        <main className="flex-1 overflow-auto flex flex-col">
          <SearchFilters 
            filters={filters}
            onFiltersChange={setFilters}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
          
          <div className="flex-1 overflow-auto">
            <Gallery 
              images={filteredImages}
              onSelectImage={setSelectedImage}
            />
          </div>
          
          <StatsPanel stats={stats} />
        </main>
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onApprove={() => handleApprove('APPROVED')}
          onReject={() => handleApprove('REJECTED')}
          onFeedback={() => setShowFeedbackForm(true)}
          onNext={() => {
            const currentIndex = images.findIndex(img => img.filename === selectedImage.filename);
            if (currentIndex < images.length - 1) {
              setSelectedImage(images[currentIndex + 1]);
            }
          }}
          onPrev={() => {
            const currentIndex = images.findIndex(img => img.filename === selectedImage.filename);
            if (currentIndex > 0) {
              setSelectedImage(images[currentIndex - 1]);
            }
          }}
        />
      )}

      {showFeedbackForm && selectedImage && (
        <FeedbackForm
          image={selectedImage}
          onClose={() => setShowFeedbackForm(false)}
          onSubmit={handleFeedback}
        />
      )}
    </div>
  );
}

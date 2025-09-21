import React, { useState, useEffect } from 'react';
import { Search, Upload, Download, User, LogIn, LogOut, BookOpen, FileText, Calendar, School, Menu, X, Filter, Plus, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SmartCampusApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    college: '',
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    years: [],
    colleges: [],
    types: []
  });

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('synapse_token');
    if (token) {
      fetchUserProfile(token);
    }
    fetchResources();
    fetchFilterOptions();
  }, []);

  // Update filtered resources when search or filters change
  useEffect(() => {
    fetchResources();
  }, [searchQuery, filters]);

  // API call helper
  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('synapse_token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const fetchUserProfile = async (token) => {
    try {
      const data = await apiCall('/auth/profile');
      setUser(data.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Profile fetch failed:', error);
      localStorage.removeItem('synapse_token');
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchQuery) params.append('search', searchQuery);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.year) params.append('year', filters.year);
      if (filters.college) params.append('college', filters.college);
      if (filters.type) params.append('type', filters.type);
      
      const data = await apiCall(`/resources?${params}`);
      setResources(data.resources);
      setFilteredResources(data.resources);
    } catch (error) {
      setError('Failed to fetch resources');
      console.error('Resources fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const data = await apiCall('/filters');
      setFilterOptions(data);
    } catch (error) {
      console.error('Filter options fetch error:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('synapse_token', data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      setSuccess('Login successful!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password, college) => {
    try {
      setLoading(true);
      setError('');
      
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, college })
      });

      localStorage.setItem('synapse_token', data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      setSuccess('Registration successful!');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('synapse_token');
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('home');
    setSuccess('Logged out successfully!');
  };

  const handleUpload = async (formData) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('synapse_token');
      const response = await fetch(`${API_BASE_URL}/resources/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData // FormData object, don't set Content-Type
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Resource uploaded successfully!');
      fetchResources(); // Refresh resources list
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resourceId, fileName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Download failed');
      console.error('Download error:', error);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const SynapseLogo = () => (
    <div className="w-8 h-8 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g fill="currentColor">
          <rect x="44" y="15" width="12" height="12" transform="rotate(45 50 21)" />
          <rect x="70" y="25" width="8" height="8" transform="rotate(45 74 29)" />
          <rect x="25" y="35" width="30" height="8" transform="rotate(45 40 39)" />
          <rect x="18" y="45" width="8" height="8" transform="rotate(45 22 49)" />
          <rect x="55" y="45" width="30" height="8" transform="rotate(45 70 49)" />
          <rect x="25" y="55" width="30" height="8" transform="rotate(45 40 59)" />
          <rect x="18" y="65" width="8" height="8" transform="rotate(45 22 69)" />
          <rect x="44" y="73" width="12" height="12" transform="rotate(45 50 79)" />
          <rect x="70" y="65" width="8" height="8" transform="rotate(45 74 69)" />
        </g>
      </svg>
    </div>
  );

  const Alert = ({ type, message, onClose }) => (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
    }`}>
      <div className="flex items-center space-x-2">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <header className="bg-white/90 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="text-gray-900">
              <SynapseLogo />
            </div>
            <h1 className="text-xl font-normal text-gray-900 tracking-wide" 
                style={{fontFamily: '"Inter", system-ui, sans-serif', fontWeight: '400', letterSpacing: '0.02em'}}>
              Synapse
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8" style={{fontFamily: 'system-ui, sans-serif'}}>
            <button 
              onClick={() => { setCurrentPage('home'); clearMessages(); }} 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => { setCurrentPage('browse'); clearMessages(); }} 
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
            >
              Browse
            </button>
            {isLoggedIn && (
              <button 
                onClick={() => { setCurrentPage('upload'); clearMessages(); }} 
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
              >
                Upload
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-4" style={{fontFamily: 'system-ui, sans-serif'}}>
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setCurrentPage('login'); clearMessages(); }} 
                className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </button>
            )}
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100" style={{fontFamily: 'system-ui, sans-serif'}}>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); clearMessages(); }} 
                className="text-left py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Home
              </button>
              <button 
                onClick={() => { setCurrentPage('browse'); setIsMenuOpen(false); clearMessages(); }} 
                className="text-left py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                Browse
              </button>
              {isLoggedIn && (
                <button 
                  onClick={() => { setCurrentPage('upload'); setIsMenuOpen(false); clearMessages(); }} 
                  className="text-left py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  Upload
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" style={{fontFamily: 'system-ui, sans-serif'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="mb-12">
            <div className="flex justify-center mb-8">
              <div className="text-gray-900 w-20 h-20">
                <SynapseLogo />
              </div>
            </div>
            <h2 className="text-6xl md:text-7xl font-light text-gray-900 mb-8 tracking-wide leading-tight" 
                style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontWeight: '300',
                  letterSpacing: '0.02em'
                }}>
              Synapse
            </h2>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent mx-auto mb-8"></div>
            <p className="text-lg text-gray-600 font-light" style={{fontFamily: '"Inter", system-ui, sans-serif'}}>
              Smart Campus Control
            </p>
          </div>
          <p className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            A collaborative platform for students to share, find, and access subject materials and previous year question papers. Foster academic growth through peer-to-peer support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => { setCurrentPage('browse'); clearMessages(); }}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
              disabled={loading}
            >
              Browse Resources
            </button>
            {!isLoggedIn && (
              <button 
                onClick={() => { setCurrentPage('login'); clearMessages(); }}
                className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Get Started
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300">
              <FileText className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Share Resources</h3>
            <p className="text-gray-600 leading-relaxed text-sm">Upload and share question papers, notes, and study materials with your peers.</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300">
              <Search className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Find Materials</h3>
            <p className="text-gray-600 leading-relaxed text-sm">Search and browse resources by subject, year, or college to find exactly what you need.</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300 group">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors duration-300">
              <School className="h-5 w-5 text-gray-700" />
            </div>
            <h3 className="text-lg font-medium mb-3 text-gray-900">Build Community</h3>
            <p className="text-gray-600 leading-relaxed text-sm">Connect with students from your college and contribute to academic excellence.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-medium text-center mb-6 text-gray-900">Search Resources</h3>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for question papers, notes, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
              />
            </div>
            {searchQuery && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  {loading ? 'Searching...' : `Found ${filteredResources.length} results for "${searchQuery}"`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [college, setCollege] = useState('');
    const [isSignup, setIsSignup] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      clearMessages();
      
      if (!email || !password) {
        setError('Email and password are required');
        return;
      }

      if (isSignup) {
        if (!name) {
          setError('Name is required for registration');
          return;
        }
        await handleRegister(name, email, password, college);
      } else {
        await handleLogin(email, password);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{fontFamily: 'system-ui, sans-serif'}}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 text-gray-900 mx-auto mb-6">
              <SynapseLogo />
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-2" style={{fontFamily: '"Inter", system-ui, sans-serif'}}>
              {isSignup ? 'Create your account' : 'Sign in to your account'}
            </h2>
            <p className="text-gray-600 text-sm">Join the academic community</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {isSignup && (
                  <>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="College/University (optional)"
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                      disabled={loading}
                    />
                  </>
                )}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                  disabled={loading}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  minLength="6"
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (isSignup ? 'Sign Up' : 'Sign In')}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    clearMessages();
                    setEmail('');
                    setPassword('');
                    setName('');
                    setCollege('');
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200 text-sm"
                  disabled={loading}
                >
                  {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const BrowsePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12" style={{fontFamily: 'system-ui, sans-serif'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-medium text-gray-900 mb-4" style={{fontFamily: '"Inter", system-ui, sans-serif'}}>Browse Resources</h2>
          <div className="w-16 h-px bg-gray-400"></div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-xl mb-8 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({...filters, subject: e.target.value})}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              disabled={loading}
            >
              <option value="">All Subjects</option>
              {filterOptions.subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              disabled={loading}
            >
              <option value="">All Years</option>
              {filterOptions.years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select
              value={filters.college}
              onChange={(e) => setFilters({...filters, college: e.target.value})}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              disabled={loading}
            >
              <option value="">All Colleges</option>
              {filterOptions.colleges.map(college => <option key={college} value={college}>{college}</option>)}
            </select>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              disabled={loading}
            >
              <option value="">All Types</option>
              {filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <button
              onClick={() => setFilters({subject: '', year: '', college: '', type: ''})}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              disabled={loading}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Loading resources...</p>
          </div>
        )}

        <div className="grid gap-4">
          {filteredResources.map(resource => (
            <div key={resource.id} className="bg-white border border-gray-200 p-6 rounded-xl hover:shadow-lg transition-all duration-300 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 group-hover:text-gray-700 transition-colors duration-200">{resource.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{resource.subject}</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{resource.year}</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <School className="h-4 w-4" />
                      <span>{resource.college}</span>
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium border">
                      {resource.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Uploaded by {resource.uploadedBy} • {resource.downloadCount} downloads • {resource.uploadDate}
                  </p>
                </div>
                <div className="mt-6 md:mt-0 md:ml-6">
                  <button 
                    onClick={() => handleDownload(resource.id, resource.title)}
                    className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredResources.length === 0 && (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-6">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );

  const UploadPage = () => {
    const [formData, setFormData] = useState({
      title: '',
      subject: '',
      year: '2024',
      college: '',
      type: 'Question Paper',
      description: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const handleSubmit = async (e) => {
      e.preventDefault();
      clearMessages();
      
      if (!formData.title || !formData.subject || !formData.college) {
        setError('Title, subject, and college are required');
        return;
      }

      if (!selectedFile) {
        setError('Please select a file to upload');
        return;
      }

      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      uploadData.append('title', formData.title);
      uploadData.append('subject', formData.subject);
      uploadData.append('year', formData.year);
      uploadData.append('college', formData.college);
      uploadData.append('type', formData.type);
      uploadData.append('description', formData.description);

      const success = await handleUpload(uploadData);
      if (success) {
        setFormData({
          title: '',
          subject: '',
          year: '2024',
          college: '',
          type: 'Question Paper',
          description: ''
        });
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB');
          return;
        }

        // Check file type
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExt = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
          setError('Only PDF, DOC, and DOCX files are allowed');
          return;
        }

        setSelectedFile(file);
        clearMessages();
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-12" style={{fontFamily: 'system-ui, sans-serif'}}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-medium text-gray-900 mb-4" style={{fontFamily: '"Inter", system-ui, sans-serif'}}>Upload Resource</h2>
            <div className="w-16 h-px bg-gray-400"></div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Data Structures Final Exam 2024"
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                  disabled={loading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                    disabled={loading}
                  >
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College *</label>
                  <input
                    type="text"
                    required
                    value={formData.college}
                    onChange={(e) => setFormData({...formData, college: e.target.value})}
                    placeholder="e.g., MIT"
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
                    disabled={loading}
                  >
                    <option value="Question Paper">Question Paper</option>
                    <option value="Notes">Notes</option>
                    <option value="Solutions">Solutions</option>
                    <option value="Syllabus">Syllabus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Brief description of the resource..."
                  className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-all duration-200 bg-gray-50">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-gray-700 mb-1 text-sm">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop your file here'}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    PDF, DOC, DOCX up to 10MB
                  </p>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage('browse')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:text-gray-900 hover:border-gray-400 transition-all duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Uploading...' : 'Upload Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'login':
        return <LoginPage />;
      case 'browse':
        return <BrowsePage />;
      case 'upload':
        return isLoggedIn ? <UploadPage /> : <LoginPage />;
      case 'dashboard':
        return <BrowsePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      {error && <Alert type="error" message={error} onClose={clearMessages} />}
      {success && <Alert type="success" message={success} onClose={clearMessages} />}
      {renderCurrentPage()}
    </div>
  );
};

export default SmartCampusApp;
                
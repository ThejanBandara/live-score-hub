import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Trophy, Plus, Edit, Trash2, Eye, Copy, CheckCircle, X, Save } from 'lucide-react';

// Extended types for dashboard (extends your actual types with id field)
interface TeamCard {
  teamName: string;
  teamTriCode: string;
  logoUrl: string;
  color_1: string;
  color_2: string;
  players: rugbyPlayer[];
  packWeight: number;
  yellowCards: number;
  redCards: number;
  tries: number;
  conversions: number;
  panelties: number;
  dropGoals: number;
  replacements: any[];
}

interface rugbyPlayer {
  playerID: number;
  PlayerName: string;
  PlayerJerseyNumber: number;
  Position: string;
  isCaption: boolean;
  isSubstitiudePlayer: boolean;
}

// Base MatchDoc from your types
interface MatchDocBase {
  rugbyMatchID: string;
  matchDate: string;
  venue: string;
  status: "scheduled" | "live" | "ended" | "cancelled";
  homeTeam: TeamCard;
  awayTeam: TeamCard;
  matchOfficials: string[];
  matchCommentators: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Extended version with Firebase ID for dashboard use
interface MatchDoc extends MatchDocBase {
  id: string;
}

interface MatchStateDoc {
  homeScore: number;
  awayScore: number;
  weather: {
    condition: string;
    temp: number;
    humidity: number;
    windSpeed: number;
  };
  timer: {
    startedAt: number | null;
    pausedAt: number | null;
    isRunning: boolean;
    offset: number;
    currentHalf: 1 | 2 | "HT" | "FT";
    totalGameTime: number;
    timerType: "countup" | "countdown";
  };
  yellowCardsHome: number;
  redCardsHome: number;
  yellowCardsAway: number;
  redCardsAway: number;
}

// Mock API functions (replace with your actual API calls)
const mockMatches: MatchDoc[] = [
  {
    id: '1',
    rugbyMatchID: 'MATCH_2024_001',
    matchDate: '2024-08-20T15:00:00.000Z',
    venue: 'Wembley Stadium',
    status: 'scheduled',
    homeTeam: {
      teamName: 'All Blacks',
      teamTriCode: 'NZL',
      logoUrl: 'https://via.placeholder.com/50x50/000000/FFFFFF?text=NZL',
      color_1: '#000000',
      color_2: '#FFFFFF',
      players: [],
      packWeight: 850,
      yellowCards: 0,
      redCards: 0,
      tries: 0,
      conversions: 0,
      panelties: 0,
      dropGoals: 0,
      replacements: []
    },
    awayTeam: {
      teamName: 'Springboks',
      teamTriCode: 'RSA',
      logoUrl: 'https://via.placeholder.com/50x50/FFD700/006A4E?text=RSA',
      color_1: '#FFD700',
      color_2: '#006A4E',
      players: [],
      packWeight: 870,
      yellowCards: 0,
      redCards: 0,
      tries: 0,
      conversions: 0,
      panelties: 0,
      dropGoals: 0,
      replacements: []
    },
    matchOfficials: ['Wayne Barnes', 'Pascal Gauzere'],
    matchCommentators: ['Stuart Barnes'],
    createdAt: '2024-08-12T10:30:00.000Z',
    updatedAt: '2024-08-12T10:30:00.000Z'
  },
  {
    id: '2',
    rugbyMatchID: 'MATCH_2024_002',
    matchDate: '2024-08-18T14:00:00.000Z',
    venue: 'Eden Park',
    status: 'live',
    homeTeam: {
      teamName: 'England',
      teamTriCode: 'ENG',
      logoUrl: 'https://via.placeholder.com/50x50/FFFFFF/FF0000?text=ENG',
      color_1: '#FFFFFF',
      color_2: '#FF0000',
      players: [],
      packWeight: 840,
      yellowCards: 1,
      redCards: 0,
      tries: 2,
      conversions: 1,
      panelties: 1,
      dropGoals: 0,
      replacements: []
    },
    awayTeam: {
      teamName: 'Wales',
      teamTriCode: 'WAL',
      logoUrl: 'https://via.placeholder.com/50x50/FF0000/FFFFFF?text=WAL',
      color_1: '#FF0000',
      color_2: '#FFFFFF',
      players: [],
      packWeight: 835,
      yellowCards: 0,
      redCards: 0,
      tries: 1,
      conversions: 1,
      panelties: 2,
      dropGoals: 0,
      replacements: []
    },
    matchOfficials: ['Nigel Owens'],
    matchCommentators: ['Eddie Butler'],
    createdAt: '2024-08-10T10:30:00.000Z',
    updatedAt: '2024-08-18T14:30:00.000Z'
  }
];

const RugbyDashboard = () => {
  const [matches, setMatches] = useState<MatchDoc[]>(mockMatches);
  const [selectedMatch, setSelectedMatch] = useState<MatchDoc | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [copySuccess, setCopySuccess] = useState<string>('');

  // Form state for creating/editing matches
  const [formData, setFormData] = useState<Partial<MatchDocBase>>({
    rugbyMatchID: '',
    matchDate: '',
    venue: '',
    status: 'scheduled',
    homeTeam: {
      teamName: '',
      teamTriCode: '',
      logoUrl: '',
      color_1: '#000000',
      color_2: '#FFFFFF',
      players: [],
      packWeight: 0,
      yellowCards: 0,
      redCards: 0,
      tries: 0,
      conversions: 0,
      panelties: 0,
      dropGoals: 0,
      replacements: []
    },
    awayTeam: {
      teamName: '',
      teamTriCode: '',
      logoUrl: '',
      color_1: '#000000',
      color_2: '#FFFFFF',
      players: [],
      packWeight: 0,
      yellowCards: 0,
      redCards: 0,
      tries: 0,
      conversions: 0,
      panelties: 0,
      dropGoals: 0,
      replacements: []
    },
    matchOfficials: [''],
    matchCommentators: ['']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter matches based on status
  const filteredMatches = filter === 'all' 
    ? matches 
    : matches.filter(match => match.status === filter);

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'live': return 'bg-green-100 text-green-800 border-green-200 animate-pulse';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.rugbyMatchID?.trim()) {
      newErrors.rugbyMatchID = 'Match ID is required';
    }
    if (!formData.matchDate) {
      newErrors.matchDate = 'Match date is required';
    }
    if (!formData.venue?.trim()) {
      newErrors.venue = 'Venue is required';
    }
    if (!formData.homeTeam?.teamName?.trim()) {
      newErrors.homeTeamName = 'Home team name is required';
    }
    if (!formData.homeTeam?.teamTriCode?.trim()) {
      newErrors.homeTeamTriCode = 'Home team code is required';
    }
    if (!formData.awayTeam?.teamName?.trim()) {
      newErrors.awayTeamName = 'Away team name is required';
    }
    if (!formData.awayTeam?.teamTriCode?.trim()) {
      newErrors.awayTeamTriCode = 'Away team code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // In real app, call your API here
      const newMatch: MatchDoc = {
        ...formData as MatchDocBase,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMatches(prev => [...prev, newMatch]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      rugbyMatchID: '',
      matchDate: '',
      venue: '',
      status: 'scheduled',
      homeTeam: {
        teamName: '',
        teamTriCode: '',
        logoUrl: '',
        color_1: '#000000',
        color_2: '#FFFFFF',
        players: [],
        packWeight: 0,
        yellowCards: 0,
        redCards: 0,
        tries: 0,
        conversions: 0,
        panelties: 0,
        dropGoals: 0,
        replacements: []
      },
      awayTeam: {
        teamName: '',
        teamTriCode: '',
        logoUrl: '',
        color_1: '#000000',
        color_2: '#FFFFFF',
        players: [],
        packWeight: 0,
        yellowCards: 0,
        redCards: 0,
        tries: 0,
        conversions: 0,
        panelties: 0,
        dropGoals: 0,
        replacements: []
      },
      matchOfficials: [''],
      matchCommentators: ['']
    });
    setErrors({});
  };

  // Delete match
  const handleDelete = async (matchId: string) => {
    if (window.confirm('Are you sure you want to delete this match?')) {
      try {
        // In real app, call your API here
        setMatches(prev => prev.filter(match => match.id !== matchId));
      } catch (error) {
        console.error('Error deleting match:', error);
      }
    }
  };

  // Copy link to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  // Match Card Component
  const MatchCard = ({ match }: { match: MatchDoc }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(match.status)}`}>
              {match.status.toUpperCase()}
            </span>
            {match.status === 'live' && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMatch(match);
                setShowMatchDetails(true);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle edit
              }}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Edit Match"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(match.id!);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Match"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={match.homeTeam.logoUrl} 
              alt={match.homeTeam.teamName}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold text-gray-900">{match.homeTeam.teamName}</p>
              <p className="text-sm text-gray-500">{match.homeTeam.teamTriCode}</p>
            </div>
          </div>
          
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 mb-1">VS</p>
            {match.status === 'live' || match.status === 'ended' ? (
              <p className="text-2xl font-bold text-gray-900">
                {match.homeTeam.tries * 5 + match.homeTeam.conversions * 2 + match.homeTeam.panelties * 3} - {match.awayTeam.tries * 5 + match.awayTeam.conversions * 2 + match.awayTeam.panelties * 3}
              </p>
            ) : null}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{match.awayTeam.teamName}</p>
              <p className="text-sm text-gray-500">{match.awayTeam.teamTriCode}</p>
            </div>
            <img 
              src={match.awayTeam.logoUrl} 
              alt={match.awayTeam.teamName}
              className="w-12 h-12 rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Match Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar size={16} />
            <span>{formatDate(match.matchDate)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin size={16} />
            <span>{match.venue}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} />
            <span>{match.matchOfficials.join(', ')}</span>
          </div>
        </div>

        {/* Match ID */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">ID: {match.rugbyMatchID}</p>
        </div>
      </div>
    </div>
  );

  // Create Match Form Component
  const CreateMatchForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Match</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match ID *
              </label>
              <input
                type="text"
                value={formData.rugbyMatchID || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rugbyMatchID: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.rugbyMatchID ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="MATCH_2024_001"
              />
              {errors.rugbyMatchID && <p className="mt-1 text-sm text-red-600">{errors.rugbyMatchID}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Match Date *
              </label>
              <input
                type="datetime-local"
                value={formData.matchDate ? new Date(formData.matchDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData(prev => ({ ...prev, matchDate: new Date(e.target.value).toISOString() }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.matchDate ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.matchDate && <p className="mt-1 text-sm text-red-600">{errors.matchDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <input
                type="text"
                value={formData.venue || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.venue ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Stadium Name"
              />
              {errors.venue && <p className="mt-1 text-sm text-red-600">{errors.venue}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status || 'scheduled'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Home Team */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.homeTeam?.teamName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    homeTeam: { ...prev.homeTeam!, teamName: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.homeTeamName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Team Name"
                />
                {errors.homeTeamName && <p className="mt-1 text-sm text-red-600">{errors.homeTeamName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Code *
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={formData.homeTeam?.teamTriCode || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    homeTeam: { ...prev.homeTeam!, teamTriCode: e.target.value.toUpperCase() }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.homeTeamTriCode ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="ABC"
                />
                {errors.homeTeamTriCode && <p className="mt-1 text-sm text-red-600">{errors.homeTeamTriCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.homeTeam?.logoUrl || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    homeTeam: { ...prev.homeTeam!, logoUrl: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Away Team */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Away Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.awayTeam?.teamName || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    awayTeam: { ...prev.awayTeam!, teamName: e.target.value }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.awayTeamName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Team Name"
                />
                {errors.awayTeamName && <p className="mt-1 text-sm text-red-600">{errors.awayTeamName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Code *
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={formData.awayTeam?.teamTriCode || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    awayTeam: { ...prev.awayTeam!, teamTriCode: e.target.value.toUpperCase() }
                  }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.awayTeamTriCode ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="XYZ"
                />
                {errors.awayTeamTriCode && <p className="mt-1 text-sm text-red-600">{errors.awayTeamTriCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.awayTeam?.logoUrl || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    awayTeam: { ...prev.awayTeam!, logoUrl: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Officials */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Officials
                </label>
                <input
                  type="text"
                  value={formData.matchOfficials?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    matchOfficials: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe, Jane Smith (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentators
                </label>
                <input
                  type="text"
                  value={formData.matchCommentators?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    matchCommentators: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mike Johnson, Sarah Wilson (comma separated)"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Create Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Match Details Modal
  const MatchDetailsModal = () => {
    if (!selectedMatch) return null;

    const liveScoreUrl = `${window.location.origin}/live/${selectedMatch.id}`;
    const scorekeeperUrl = `${window.location.origin}/scorekeeper/${selectedMatch.id}`;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Match Details</h2>
              <button
                onClick={() => setShowMatchDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Match Header */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-8 mb-4">
                <div className="text-center">
                  <img 
                    src={selectedMatch.homeTeam.logoUrl} 
                    alt={selectedMatch.homeTeam.teamName}
                    className="w-20 h-20 mx-auto mb-3 rounded-xl object-cover"
                  />
                  <h3 className="text-xl font-bold">{selectedMatch.homeTeam.teamName}</h3>
                  <p className="text-gray-500">{selectedMatch.homeTeam.teamTriCode}</p>
                </div>

                <div className="text-center px-8">
                  {selectedMatch.status === 'live' || selectedMatch.status === 'ended' ? (
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {selectedMatch.homeTeam.tries * 5 + selectedMatch.homeTeam.conversions * 2 + selectedMatch.homeTeam.panelties * 3} - {selectedMatch.awayTeam.tries * 5 + selectedMatch.awayTeam.conversions * 2 + selectedMatch.awayTeam.panelties * 3}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900 mb-2">VS</div>
                  )}
                  <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedMatch.status)}`}>
                    {selectedMatch.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-center">
                  <img 
                    src={selectedMatch.awayTeam.logoUrl} 
                    alt={selectedMatch.awayTeam.teamName}
                    className="w-20 h-20 mx-auto mb-3 rounded-xl object-cover"
                  />
                  <h3 className="text-xl font-bold">{selectedMatch.awayTeam.teamName}</h3>
                  <p className="text-gray-500">{selectedMatch.awayTeam.teamTriCode}</p>
                </div>
              </div>

              <div className="text-gray-600 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Calendar size={16} />
                  <span>{formatDate(selectedMatch.matchDate)}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <MapPin size={16} />
                  <span>{selectedMatch.venue}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center space-x-2">
                <Edit size={16} />
                <span>Edit Match</span>
              </button>
              <button 
                onClick={() => handleDelete(selectedMatch.id!)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Delete Match</span>
              </button>
            </div>

            {/* Copy Links Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Live Score HUD</h4>
                  <p className="text-sm text-gray-600 mb-3">Public-facing live score display</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={liveScoreUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(liveScoreUrl, 'hud')}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {copySuccess === 'hud' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  {copySuccess === 'hud' && (
                    <p className="text-sm text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium text-gray-900 mb-2">Scorekeeper Dashboard</h4>
                  <p className="text-sm text-gray-600 mb-3">Match management and scoring interface</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={scorekeeperUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(scorekeeperUrl, 'scorekeeper')}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      {copySuccess === 'scorekeeper' ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  {copySuccess === 'scorekeeper' && (
                    <p className="text-sm text-green-600 mt-1">Copied to clipboard!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Team Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Home Team */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>Home Team</span>
                  <span className="text-sm font-normal text-gray-500">({selectedMatch.homeTeam.teamTriCode})</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Tries</p>
                      <p className="text-2xl font-bold text-green-600">{selectedMatch.homeTeam.tries}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Conversions</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedMatch.homeTeam.conversions}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Penalties</p>
                      <p className="text-2xl font-bold text-orange-600">{selectedMatch.homeTeam.panelties}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Drop Goals</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedMatch.homeTeam.dropGoals}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Cards</p>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                        <span className="text-sm">{selectedMatch.homeTeam.yellowCards} Yellow</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">{selectedMatch.homeTeam.redCards} Red</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Pack Weight</p>
                    <p className="text-lg font-semibold">{selectedMatch.homeTeam.packWeight} kg</p>
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <span>Away Team</span>
                  <span className="text-sm font-normal text-gray-500">({selectedMatch.awayTeam.teamTriCode})</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Tries</p>
                      <p className="text-2xl font-bold text-green-600">{selectedMatch.awayTeam.tries}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Conversions</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedMatch.awayTeam.conversions}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Penalties</p>
                      <p className="text-2xl font-bold text-orange-600">{selectedMatch.awayTeam.panelties}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Drop Goals</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedMatch.awayTeam.dropGoals}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Cards</p>
                    <div className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                        <span className="text-sm">{selectedMatch.awayTeam.yellowCards} Yellow</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm">{selectedMatch.awayTeam.redCards} Red</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Pack Weight</p>
                    <p className="text-lg font-semibold">{selectedMatch.awayTeam.packWeight} kg</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Officials */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Match Officials</h4>
                  <ul className="space-y-1">
                    {selectedMatch.matchOfficials.map((official, index) => (
                      <li key={index} className="text-gray-600">{official}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Commentators</h4>
                  <ul className="space-y-1">
                    {selectedMatch.matchCommentators.map((commentator, index) => (
                      <li key={index} className="text-gray-600">{commentator}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Match Logs Placeholder */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Match Logs</h3>
              <div className="text-center py-8 text-gray-500">
                <Trophy size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No match logs available yet.</p>
                <p className="text-sm">Logs will appear here when the match starts.</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-6 text-sm text-gray-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Match ID:</span> {selectedMatch.rugbyMatchID}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {formatDate(selectedMatch.createdAt!)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(selectedMatch.updatedAt!)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rugby Match Dashboard</h1>
              <p className="text-gray-600">Manage your rugby matches and tournaments</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm"
            >
              <Plus size={20} />
              <span>Create New Match</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <div className="flex space-x-2">
              {['all', 'scheduled', 'live', 'ended', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="ml-auto text-sm text-gray-500">
              {filteredMatches.length} matches found
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't created any matches yet."
                : `No ${filter} matches found.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Your First Match</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default RugbyDashboard;
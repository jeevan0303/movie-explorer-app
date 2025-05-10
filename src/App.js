import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import styled, { ThemeProvider } from 'styled-components';
import { PuffLoader } from 'react-spinners';
import { FaMoon, FaSun, FaHeart, FaRegHeart, FaPlay, FaStar, FaTimes, FaArrowLeft } from 'react-icons/fa';
import backgroundImage from './assets/BG.jpg';

// Themes
const lightTheme = {
  body: '#ffffff',
  text: '#121212',
  navbar: '#1a1a1a',
  cardBg: '#ffffff',
  cardText: '#121212',
  inputBg: '#f5f5f5',
};

const darkTheme = {
  body: '#121212',
  text: '#ffffff',
  navbar: '#000000',
  cardBg: '#1a1a2a',
  cardText: '#ffffff',
  inputBg: '#2a2a2a',
};

// Styled Components
const AppContainer = styled.div`
  background-color: ${props => props.theme.body};
  color: ${props => props.theme.text};
  min-height: 100vh;
`;

const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: ${props => props.theme.navbar};
  color: white;
  position: relative;
  z-index: 100;
`;

const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
`;

const MovieCard = styled.div`
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  cursor: pointer;
  background-color: ${props => props.theme.cardBg};
  color: ${props => props.theme.cardText};

  &:hover {
    transform: scale(1.03);
  }
`;

const MovieDetailContainer = styled.div`
  padding: 2rem;
  color: ${props => props.theme.text};
  background-color: ${props => props.theme.body};
  min-height: 100vh;
`;

const AuthModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const AuthModalContent = styled.div`
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2rem;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  position: relative;
  color: white;
  backdrop-filter: blur(5px);
`;

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const AuthInput = styled.input`
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  background-color: ${props => props.theme.inputBg};
`;

const AuthSubmitButton = styled.button`
  padding: 0.8rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  
  &:hover {
    background-color: #45a049;
  }
`;

const WelcomeContainer = styled.div`
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 2rem;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url(${backgroundImage}) center/cover no-repeat;
    opacity: 0.7;
    z-index: -1;
  }
`;

// Contexts
const AuthContext = createContext();
const MovieContext = createContext();
const ThemeContext = createContext();

// Providers
function ThemeProviderWrapper({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const login = useCallback(async (username, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(username);
        localStorage.setItem('user', username);
        setShowAuthModal(false);
        resolve();
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  const openAuthModal = useCallback((mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(storedUser);
  }, []);

  const value = {
    user, 
    login, 
    logout, 
    showAuthModal, 
    setShowAuthModal,
    openAuthModal,
    authMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function MovieProvider({ children }) {
  const API_KEY = '9e6e7812ee37eef13da0d895864f2170';
  const BASE_URL = 'https://api.themoviedb.org/3';

  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const fetchTrendingMovies = useCallback(async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`
      );
      return response.data.results;
    } catch (err) {
      throw new Error('Failed to fetch trending movies');
    }
  }, [API_KEY]);

  const fetchMovieDetails = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=videos,credits`
      );
      return response.data;
    } catch (err) {
      throw new Error('Failed to fetch movie details');
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY]);

  const searchMovies = useCallback(async (query) => {
    try {
      setIsLoading(true);
      setSearchQuery(query);
      const response = await axios.get(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`
      );
      setMovies(response.data.results);
      setSearchHistory(prev => [...new Set([...prev, query])]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [API_KEY]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setMovies([]);
  }, []);

  const toggleFavorite = useCallback((movie) => {
    setFavorites(prev => {
      const isFavorite = prev.some(fav => fav.id === movie.id);
      if (isFavorite) {
        return prev.filter(fav => fav.id !== movie.id);
      } else {
        return [...prev, movie];
      }
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTrendingMovies();
        setTrendingMovies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchTrendingMovies]);

  const value = {
    movies,
    trendingMovies,
    searchQuery,
    isLoading,
    error,
    searchMovies,
    clearSearch,
    fetchMovieDetails,
    favorites,
    toggleFavorite,
    searchHistory
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
}

// Components
function AuthModal() {
  const { login, showAuthModal, setShowAuthModal, authMode } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    await login(username, password);
  }, [login, username, password]);

  if (!showAuthModal) return null;

  return (
    <AuthModalOverlay>
      <AuthModalContent>
        <button 
          onClick={() => setShowAuthModal(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          <FaTimes />
        </button>
        <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
        <AuthForm onSubmit={handleSubmit}>
          <AuthInput
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <AuthInput
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <AuthSubmitButton type="submit">
            {authMode === 'login' ? 'Login' : 'Sign Up'}
          </AuthSubmitButton>
        </AuthForm>
      </AuthModalContent>
    </AuthModalOverlay>
  );
}

function WelcomePage() {
  const { openAuthModal } = useContext(AuthContext);

  return (
    <WelcomeContainer>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome to Movie Explorer</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Discover your next favorite movie</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          onClick={() => openAuthModal('login')}
          style={{
            padding: '0.8rem 1.5rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Login
        </button>
        <button 
          onClick={() => openAuthModal('signup')}
          style={{
            padding: '0.8rem 1.5rem',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Sign Up
        </button>
      </div>
    </WelcomeContainer>
  );
}

function MovieList({ movies }) {
  const { toggleFavorite, favorites } = useContext(MovieContext);
  
  return (
    <MovieGrid>
      {movies.map((movie) => {
        const trailer = movie.videos?.results?.find(video => video.type === 'Trailer');
        
        return (
          <div key={movie.id}>
            <Link to={`/movie/${movie.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <MovieCard>
                <img
                  src={movie.poster_path 
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : backgroundImage}
                  alt={movie.title}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    aspectRatio: '2/3',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1rem' }}>
                  <h3>{movie.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaStar color="#FFD700" />
                    <span>{movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </MovieCard>
            </Link>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '0.5rem'
            }}>
              <button 
                onClick={() => toggleFavorite(movie)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                {favorites.some(fav => fav.id === movie.id) 
                  ? <><FaHeart color="red" size={20} /> Added</>
                  : <><FaRegHeart color="red" size={20} /> Add</>}
              </button>
              
              {trailer && (
                <a 
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: '#FF0000',
                    color: 'white',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <FaPlay size={14} /> Trailer
                </a>
              )}
            </div>
          </div>
        );
      })}
    </MovieGrid>
  );
}

function MovieDetail() {
  const { id } = useParams();
  const { fetchMovieDetails, toggleFavorite, favorites } = useContext(MovieContext);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMovie = async () => {
      try {
        const data = await fetchMovieDetails(id);
        setMovie(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadMovie();
  }, [id, fetchMovieDetails]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <PuffLoader color="#36d7b7" size={100} />
    </div>
  );
  
  if (!movie) return <div>Movie not found</div>;

  const isFavorite = favorites.some(fav => fav.id === movie.id);
  const trailer = movie.videos?.results?.find(video => video.type === 'Trailer');

  return (
    <MovieDetailContainer>
      <button 
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          marginBottom: '1rem',
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          color: 'inherit'
        }}
      >
        <FaArrowLeft /> Back
      </button>
      
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <img
          src={movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : backgroundImage}
          alt={movie.title}
          style={{ width: '300px', borderRadius: '8px', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>{movie.title} ({new Date(movie.release_date).getFullYear()})</h1>
            <button 
              onClick={() => toggleFavorite(movie)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isFavorite ? <FaHeart color="red" size={24} /> : <FaRegHeart color="red" size={24} />}
              {isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FaStar color="#FFD700" />
              <span>{movie.vote_average?.toFixed(1)}/10</span>
            </div>
            <span>•</span>
            <span>{movie.runtime} min</span>
            <span>•</span>
            <span>{movie.release_date}</span>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3>Genres</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {movie.genres?.map(genre => (
                <span key={genre.id} style={{ 
                  padding: '0.3rem 0.8rem', 
                  backgroundColor: '#4CAF50', 
                  borderRadius: '20px',
                  color: 'white'
                }}>
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <h3>Overview</h3>
            <p>{movie.overview}</p>
          </div>
          
          {trailer && (
            <a 
              href={`https://www.youtube.com/watch?v=${trailer.key}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.5rem',
                backgroundColor: '#FF0000',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
                marginTop: '1rem'
              }}
            >
              <FaPlay /> Watch Trailer
            </a>
          )}
        </div>
      </div>
      
      <div>
        <h2>Cast</h2>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
          {movie.credits?.cast?.slice(0, 10).map(actor => (
            <div key={actor.id} style={{ minWidth: '120px', textAlign: 'center' }}>
              <img
                src={actor.profile_path 
                  ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                  : 'https://via.placeholder.com/200x300?text=No+Image'}
                alt={actor.name}
                style={{ width: '100px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <p style={{ marginTop: '0.5rem' }}>{actor.name}</p>
              <p style={{ fontSize: '0.8rem', color: '#888' }}>{actor.character}</p>
            </div>
          ))}
        </div>
      </div>
    </MovieDetailContainer>
  );
}

function FavoritesPage() {
  const { favorites } = useContext(MovieContext);
  const navigate = useNavigate();
  
  return (
    <div style={{ padding: '2rem' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          marginBottom: '1rem',
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          color: 'inherit'
        }}
      >
        <FaArrowLeft /> Back
      </button>
      
      <h1>My Favorite Movies</h1>
      {favorites.length > 0 ? (
        <MovieList movies={favorites} />
      ) : (
        <p>You haven't added any favorites yet.</p>
      )}
    </div>
  );
}

function Home() {
  const { movies, trendingMovies, isLoading, error, searchQuery, searchMovies, clearSearch } = useContext(MovieContext);
  const { user } = useContext(AuthContext);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      searchMovies(searchInput);
    }
  }, [searchInput, searchMovies]);

  return (
    <div style={{ padding: '2rem' }}>
      {user ? (
        <>
          {searchQuery && (
            <button 
              onClick={() => {
                clearSearch();
                setSearchInput('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                marginBottom: '1rem',
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'inherit'
              }}
            >
              <FaArrowLeft /> Back to Trending Movies
            </button>
          )}
          
          <form onSubmit={handleSearch} style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for movies..."
              style={{ 
                padding: '0.8rem', 
                flex: 1, 
                maxWidth: '500px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.8rem 1.5rem',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => {
                  clearSearch();
                  setSearchInput('');
                }}
                style={{
                  padding: '0.8rem 1.5rem',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
          </form>

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <PuffLoader color="#36d7b7" size={100} />
            </div>
          )}

          {error && (
            <div style={{ color: 'red', padding: '1rem', textAlign: 'center' }}>
              <p>⚠️ {error}</p>
            </div>
          )}

          {searchQuery ? (
            <>
              <h2>Search Results for "{searchQuery}"</h2>
              {movies.length > 0 ? (
                <MovieList movies={movies} />
              ) : (
                <p>No movies found. Try a different search term.</p>
              )}
            </>
          ) : (
            <>
              <h2>Trending Movies</h2>
              <MovieList movies={trendingMovies} />
            </>
          )}
        </>
      ) : (
        <WelcomePage />
      )}
    </div>
  );
}

// App Component
function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <AppContainer>
      <Router>
        <AuthProvider>
          <MovieProvider>
            <Navbar>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Movie Explorer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AuthContext.Consumer>
                  {({ user, logout, openAuthModal }) => (
                    user ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Link to="/favorites" style={{ 
                          padding: '0.5rem 1rem', 
                          color: 'white',
                          textDecoration: 'none'
                        }}>
                          My Favorites
                        </Link>
                        <button 
                          onClick={toggleTheme}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                          {theme === 'light' ? <FaMoon /> : <FaSun />}
                        </button>
                        <button 
                          onClick={logout} 
                          style={{ 
                            padding: '0.5rem 1rem', 
                            background: '#4CAF50', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px' 
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => openAuthModal('login')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                        >
                          Login
                        </button>
                        <button 
                          onClick={() => openAuthModal('signup')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                        >
                          Sign Up
                        </button>
                      </div>
                    )
                  )}
                </AuthContext.Consumer>
              </div>
            </Navbar>
            
            <AuthModal />
            
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/favorites" element={<FavoritesPage />} />
            </Routes>
          </MovieProvider>
        </AuthProvider>
      </Router>
    </AppContainer>
  );
}

// Wrap the app with ThemeProviderWrapper
export default function AppWrapper() {
  return (
    <ThemeProviderWrapper>
      <App />
    </ThemeProviderWrapper>
  );
}
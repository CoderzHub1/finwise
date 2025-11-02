import React, { useState, useEffect } from 'react';
import { Search, User, TrendingUp, BookOpen, PiggyBank, Target, Award, Filter, MessageSquare, ThumbsUp, Share2, Bookmark, MoreVertical, Plus, Home, Users, Trophy, Settings, ChevronDown, Tag, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Community.module.css';

const FinanceCommunityPlatform = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('recent');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPost, setExpandedPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [userBadges, setUserBadges] = useState(['Active Member', 'First Post']);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/get-post');
        
        // Transform backend posts to match frontend format
        const transformedPosts = response.data.map(post => {
          const initials = post.username
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          // Calculate time ago from dateEntered and timeEntered
          const postDate = new Date(`${post.dateEntered}T${post.timeEntered}`);
          const now = new Date();
          const diffMs = now - postDate;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          let timeAgo;
          if (diffMins < 60) {
            timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
          } else if (diffHours < 24) {
            timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
          } else {
            timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
          }

          return {
            id: post.post_id,
            author: post.username,
            avatar: initials,
            title: post.content.split('\n')[0].substring(0, 100), // First line as title
            content: post.content,
            category: post.keywords && post.keywords.length > 0 ? post.keywords[0] : 'general',
            tags: post.keywords || [],
            likes: 0, // Initialize with 0 likes
            comments: 0, // Initialize with 0 comments
            time: timeAgo,
            badges: []
          };
        });

        setPosts(transformedPosts);
        setError(null);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = [
    { id: 'all', name: 'All Posts', icon: Home },
    { id: 'budgeting', name: 'Budgeting', icon: BookOpen },
    { id: 'emergency-funds', name: 'Emergency Funds', icon: PiggyBank },
    { id: 'investments', name: 'Investments', icon: TrendingUp },
    { id: 'savings', name: 'Savings', icon: Target },
    { id: 'success-stories', name: 'Success Stories', icon: Award }
  ];

  const handleLike = async (postId) => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    try {
      // Send interaction to backend with positive weight for likes
      await axios.post('http://localhost:5000/handle-interaction', {
        username: user.username,
        post_id: postId,
        weight: 1.0
      });

      // Update local state
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    } catch (err) {
      console.error('Error handling like:', err);
      alert('Failed to like post. Please try again.');
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      alert('Please login to comment');
      return;
    }

    if (commentText[postId]?.trim()) {
      try {
        // Send interaction to backend with higher weight for comments
        await axios.post('http://localhost:5000/handle-interaction', {
          username: user.username,
          post_id: postId,
          weight: 2.0
        });

        // Update local state
        setPosts(posts.map(post => 
          post.id === postId ? { ...post, comments: post.comments + 1 } : post
        ));
        setCommentText({ ...commentText, [postId]: '' });
      } catch (err) {
        console.error('Error handling comment:', err);
        alert('Failed to post comment. Please try again.');
      }
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      alert('Please login to create a post');
      return;
    }

    if (!newPostContent.trim()) {
      alert('Please enter some content for your post');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/add-post', {
        username: user.username,
        password: user.password,
        content: newPostContent
      });

      // Refresh posts after creating
      const postsResponse = await axios.get('http://localhost:5000/get-post');
      const transformedPosts = postsResponse.data.map(post => {
        const initials = post.username
          .split(' ')
          .map(word => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const postDate = new Date(`${post.dateEntered}T${post.timeEntered}`);
        const now = new Date();
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timeAgo;
        if (diffMins < 60) {
          timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else {
          timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        }

        return {
          id: post.post_id,
          author: post.username,
          avatar: initials,
          reputation: 1000,
          title: post.content.split('\n')[0].substring(0, 100),
          content: post.content,
          category: post.keywords && post.keywords.length > 0 ? post.keywords[0] : 'general',
          tags: post.keywords || [],
          likes: 0,
          comments: 0,
          time: timeAgo,
          badges: []
        };
      });

      setPosts(transformedPosts);
      setNewPostContent('');
      setShowCreatePost(false);
      alert('Post created successfully!');
    } catch (err) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.error || 'Failed to create post. Please try again.');
    }
  };

  // For now, just show all posts without filtering (filtering to be developed later)
  const filteredPosts = posts;

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <div className={styles.loadingState}>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.logo}>FinanceHub</h1>
            <div className={styles.searchContainer}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search posts, topics, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          <div className={styles.headerRight}>
            
            {/* User Menu */}
            <div className={styles.userMenuContainer}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={styles.userMenuButton}
              >
                <User size={20} />
                {user && <span className={styles.userMenuText}>{user.username}</span>}
                <ChevronDown size={16} />
              </button>
              {showUserMenu && (
                <div className={styles.userMenuDropdown}>
                  {user ? (
                    <>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>{user.name}</p>
                        <p className={styles.userHandle}>@{user.username}</p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                      <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className={styles.menuButton}
                      >
                        Dashboard
                      </button>
                      <button 
                        onClick={() => window.location.href = '/suggestions'}
                        className={styles.menuButton}
                      >
                        Suggestions
                      </button>
                      <button 
                        onClick={() => window.location.href = '/news'}
                        className={styles.menuButton}
                      >
                        News
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.removeItem('user');
                          localStorage.removeItem('password');
                          window.location.href = '/login';
                        }}
                        className={`${styles.menuButton} ${styles.signOutButton}`}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => window.location.href = '/login'}
                        className={styles.menuButton}
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => window.location.href = '/signup'}
                        className={styles.menuButton}
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3>Categories</h3>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.active : ''}`}
                >
                  <Icon size={18} />
                  {cat.name}
                </button>
              );
            })}
          </div>

          <div className={styles.sidebarCard}>
            <h3>Your Badges</h3>
            <div className={styles.badgeContainer}>
              {userBadges.map((badge, idx) => (
                <span key={idx} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setShowCreatePost(true)}
            className={styles.createPostButton}
          >
            <Plus size={20} />
            Create Post
          </button>
        </aside>

        {/* Main Content */}
        <main className={styles.mainArea}>
          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <span className={styles.filterLabel}>Sort by:</span>
            {['recent', 'popular', 'discussed'].map(filter => (
              <button
                key={filter}
                onClick={() => setFilterBy(filter)}
                className={`${styles.filterButton} ${filterBy === filter ? styles.active : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Posts Feed */}
          <div className={styles.postsFeed}>
            {loading && (
              <div className={styles.loadingCard}>
                <p className={styles.loadingText}>Loading posts...</p>
              </div>
            )}
            
            {error && (
              <div className={styles.errorCard}>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}
            
            {!loading && !error && filteredPosts.length === 0 && (
              <div className={styles.emptyCard}>
                <p className={styles.emptyText}>No posts yet. Be the first to share!</p>
              </div>
            )}
            
            {!loading && !error && filteredPosts.map(post => (
              <article key={post.id} className={styles.postCard}>
                {/* Post Header */}
                <div className={styles.postHeader}>
                  <div className={styles.postAuthorInfo}>
                    <div className={styles.avatar}>
                      {post.avatar}
                    </div>
                    <div className={styles.authorDetails}>
                      <h3>{post.author}</h3>
                      <div className={styles.authorBadges}>
                        {post.badges.map((badge, idx) => (
                          <span key={idx} className={styles.authorBadge}>
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.postMeta}>
                    <span className={styles.postTime}>{post.time}</span>
                    <button className={styles.moreButton}>
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <h2 className={styles.postTitle}>{post.title}</h2>
                <p className={styles.postContent}>{post.content}</p>

                {/* Tags */}
                <div className={styles.tagsContainer}>
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Post Actions */}
                <div className={styles.postActions}>
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={styles.actionButton}
                  >
                    <ThumbsUp size={18} />
                    {post.likes}
                  </button>
                  <button 
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className={styles.actionButton}
                  >
                    <MessageSquare size={18} />
                    {post.comments}
                  </button>
                  <button className={styles.actionButton}>
                    <Share2 size={18} />
                    Share
                  </button>
                  <button className={`${styles.actionButton} ${styles.bookmarkButton}`}>
                    <Bookmark size={18} />
                  </button>
                </div>

                {/* Comment Section */}
                {expandedPost === post.id && (
                  <div className={styles.commentSection}>
                    <div className={styles.commentInputContainer}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[post.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        className={styles.commentInput}
                      />
                      <button 
                        onClick={() => handleComment(post.id)}
                        className={`${styles.actionButton} ${styles.primary}`}
                      >
                        <Send size={18} />
                        Post
                      </button>
                    </div>
                    <div className={styles.commentPlaceholder}>
                      Comments section - Your comment will appear here
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </main>

        {/* Right Sidebar */}
        {/* <aside className={styles.rightSidebar}>
          <div className={styles.challengeCard}>
            <h3>Community Challenges</h3>
            <div className={styles.challengeItem}>
              <h4 className={styles.challengeTitle}>30-Day Savings Challenge</h4>
              <p className={styles.challengeDescription}>Save $50 every day for 30 days</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '65%' }}></div>
              </div>
              <span className={styles.participantsCount}>245 participants</span>
            </div>
            <div className={styles.challengeItem}>
              <h4 className={styles.challengeTitle}>Budget Tracking Week</h4>
              <p className={styles.challengeDescription}>Track every expense for 7 days</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '40%' }}></div>
              </div>
              <span className={styles.participantsCount}>189 participants</span>
            </div>
          </div>
        </aside> */}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Create New Post</h2>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Share your financial wisdom, ask questions, or tell your success story..."
              className={styles.modalTextarea}
            />
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowCreatePost(false);
                  setNewPostContent('');
                }}
                className={styles.modalButton}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                className={`${styles.modalButton} ${styles.primary}`}
              >
                <Send size={18} />
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceCommunityPlatform;
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, TrendingUp, BookOpen, PiggyBank, Target, Award, Filter, MessageSquare, ThumbsUp, Share2, Bookmark, MoreVertical, Plus, Home, Users, Trophy, Settings, ChevronDown, Tag, Send, Bold, Italic, Link2, List, Code, Heading1, Heading2, Heading3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { marked } from 'marked';
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
  const textareaRef = useRef(null);

  // Configure marked options for better security and formatting
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
    headerIds: false, // Don't add IDs to headers
    mangle: false, // Don't escape autolinked email addresses
  });

  // Function to convert markdown to HTML safely
  const convertMarkdownToHtml = (markdownText) => {
    if (!markdownText) return '';
    try {
      return marked.parse(markdownText);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return markdownText; // Return original text if parsing fails
    }
  };

  // Formatting functions for the editor
  const insertFormatting = (before, after = '', placeholder = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newPostContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      newPostContent.substring(0, start) + 
      before + textToInsert + after + 
      newPostContent.substring(end);
    
    setNewPostContent(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const applyBold = () => insertFormatting('**', '**', 'bold text');
  const applyItalic = () => insertFormatting('*', '*', 'italic text');
  const applyHeading1 = () => insertFormatting('# ', '', 'Heading 1');
  const applyHeading2 = () => insertFormatting('## ', '', 'Heading 2');
  const applyHeading3 = () => insertFormatting('### ', '', 'Heading 3');
  const applyInlineCode = () => insertFormatting('`', '`', 'code');
  const applyCodeBlock = () => insertFormatting('```\n', '\n```', 'code block');
  const applyBulletList = () => insertFormatting('- ', '', 'list item');
  const applyLink = () => insertFormatting('[', '](url)', 'link text');

  // Fetch posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-post`);
        
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
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/handle-interaction`, {
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
        await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/handle-interaction`, {
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
      // Convert actual newlines to \n string for single-line transmission
      const singleLineContent = newPostContent.replace(/\n/g, '\\n');
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/add-post`, {
        username: user.username,
        password: user.password,
        content: singleLineContent
      });

      // Refresh posts after creating
      const postsResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/get-post`);
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
          {/* <div className={styles.sidebarCard}>
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
          </div> */}

          {/* <div className={styles.sidebarCard}>
            <h3>Your Badges</h3>
            <div className={styles.badgeContainer}>
              {userBadges.map((badge, idx) => (
                <span key={idx} className={styles.badge}>
                  {badge}
                </span>
              ))}
            </div>
          </div> */}

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
                {/* <div 
                  className={styles.postTitle}
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(post.title) }}
                /> */}
                <div 
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(post.content) }}
                />

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
            
            {/* Formatting Toolbar */}
            <div className={styles.formattingToolbar}>
              <button 
                onClick={applyBold} 
                className={styles.toolbarButton}
                title="Bold"
                type="button"
              >
                <Bold size={18} />
              </button>
              <button 
                onClick={applyItalic} 
                className={styles.toolbarButton}
                title="Italic"
                type="button"
              >
                <Italic size={18} />
              </button>
              <div className={styles.toolbarDivider}></div>
              <button 
                onClick={applyHeading1} 
                className={styles.toolbarButton}
                title="Heading 1"
                type="button"
              >
                <Heading1 size={18} />
              </button>
              <button 
                onClick={applyHeading2} 
                className={styles.toolbarButton}
                title="Heading 2"
                type="button"
              >
                <Heading2 size={18} />
              </button>
              <button 
                onClick={applyHeading3} 
                className={styles.toolbarButton}
                title="Heading 3"
                type="button"
              >
                <Heading3 size={18} />
              </button>
              <div className={styles.toolbarDivider}></div>
              <button 
                onClick={applyLink} 
                className={styles.toolbarButton}
                title="Link"
                type="button"
              >
                <Link2 size={18} />
              </button>
              <button 
                onClick={applyBulletList} 
                className={styles.toolbarButton}
                title="Bullet List"
                type="button"
              >
                <List size={18} />
              </button>
              <div className={styles.toolbarDivider}></div>
              <button 
                onClick={applyInlineCode} 
                className={styles.toolbarButton}
                title="Inline Code"
                type="button"
              >
                <Code size={18} />
              </button>
              <button 
                onClick={applyCodeBlock} 
                className={styles.toolbarButton}
                title="Code Block"
                type="button"
              >
                <Code size={18} />
                <span style={{ fontSize: '10px', marginLeft: '2px' }}>{ }</span>
              </button>
            </div>

            {/* Editor and Preview */}
            <div className={styles.editorContainer}>
              <div className={styles.editorSection}>
                <label className={styles.editorLabel}>Write (Markdown)</label>
                <textarea
                  ref={textareaRef}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your financial wisdom, ask questions, or tell your success story..."
                  className={styles.modalTextarea}
                />
              </div>
              <div className={styles.previewSection}>
                <label className={styles.editorLabel}>Preview</label>
                <div 
                  className={styles.previewContent}
                  dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(newPostContent) || '<p style="color: #9ca3af;">Preview will appear here...</p>' }}
                />
              </div>
            </div>

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
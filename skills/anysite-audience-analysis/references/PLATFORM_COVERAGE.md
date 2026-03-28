# Platform-Specific Audience Analysis

## Instagram Capabilities

**Available Endpoints** (source: `"instagram"`):

| Category | Endpoint | Call |
|----------|----------|------|
| user | `user` | `execute("instagram", "user", "user", {"user": "..."})` |
| user | `user_friendships` | `execute("instagram", "user", "user_friendships", {"user": "...", "count": N, "type": "followers"})` |
| user | `user_posts` | `execute("instagram", "user", "user_posts", {"user": "...", "count": N})` |
| user | `user_reels` | `execute("instagram", "user", "user_reels", {"user": "...", "count": N})` |
| post | `post` | `execute("instagram", "post", "post", {"post": "{id}"})` |
| post | `post_likes` | `execute("instagram", "post", "post_likes", {"post": "{id}", "count": N})` |
| post | `post_comments` | `execute("instagram", "post", "post_comments", {"post": "{id}", "count": N})` |

**Analysis Techniques**:
- Follower quality assessment via `user_friendships`
- Engagement pattern tracking via `user_posts` + `post_likes` + `post_comments`
- Content preference analysis via `query_cache()` with `sort_by`
- Audience segmentation via `query_cache()` with `group_by`

**Pagination**: Use `get_page(cache_key, offset, limit)` to load more followers/posts/comments.

**Limitations**:
- Can't access full follower list (privacy)
- Limited demographic data
- Engagement sample-based

## YouTube Capabilities

**Available Endpoints** (source: `"youtube"`):

| Category | Endpoint | Call |
|----------|----------|------|
| channel | `channel_videos` | `execute("youtube", "channel", "channel_videos", {"channel": "...", "count": N})` |
| video | `video` | `execute("youtube", "video", "video", {"video": "..."})` |
| video | `video_comments` | `execute("youtube", "video", "video_comments", {"video": "...", "count": N})` |
| video | `video_subtitles` | `execute("youtube", "video", "video_subtitles", {"video": "...", "lang": "en"})` |

**Analysis Techniques**:
- Viewer interest profiling from comments
- Content performance analysis via `query_cache()` with `sort_by`
- Community engagement assessment

**Pagination**: Use `get_page(cache_key, offset, limit)` to load more comments (max 2000 per request).

**Limitations**:
- No direct subscriber access
- Demographics inferred from comments
- Limited geographic data

## LinkedIn Capabilities

**Available Endpoints** (source: `"linkedin"`):

| Category | Endpoint | Call |
|----------|----------|------|
| post | `get_user_posts` | `execute("linkedin", "post", "get_user_posts", {"user": "..."})` |
| user | `get` | `execute("linkedin", "user", "get", {"user": "..."})` |

**Analysis Techniques**:
- Professional demographic profiling
- Industry and seniority analysis via `query_cache()` with `group_by`
- Content-audience matching

**Aggregation**: Use `query_cache(cache_key, aggregate={"field": "reactions", "op": "avg"}, group_by="post_type")` for performance analysis.

**Limitations**:
- Privacy settings limit visibility
- Sample-based analysis
- Connections vs. followers distinction

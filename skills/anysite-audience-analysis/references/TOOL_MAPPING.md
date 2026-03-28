# Audience Analysis Tool Mapping (v2)

## Analysis Need → MCP v2 Calls

**Follower Demographics**:
- Instagram: `execute("instagram", "user", "user_friendships", {"user": "...", "count": 100, "type": "followers"})` → sample analysis
- LinkedIn: `execute("linkedin", "user", "get", {"user": "..."})` → professional data

**Engagement Patterns**:
- Instagram: `execute("instagram", "user", "user_posts", {"user": "...", "count": 50})` + `execute("instagram", "post", "post_likes", {"post": "{id}", "count": 100})` + `execute("instagram", "post", "post_comments", {"post": "{id}", "count": 50})`
- YouTube: `execute("youtube", "video", "video", {"video": "..."})` + `execute("youtube", "video", "video_comments", {"video": "...", "count": 200})`
- LinkedIn: `execute("linkedin", "post", "get_user_posts", {"user": "..."})`

**Audience Growth**:
- Track follower counts over time
- Monitor engagement velocity
- Analyze new vs. existing engagement

**Content Preferences**:
- Correlate content types with engagement
- Use `query_cache(cache_key, sort_by={"field": "like_count", "order": "desc"})` to rank top-performing posts
- Track topic performance with `query_cache(cache_key, aggregate=..., group_by=...)`

**Audience Quality**:
- Analyze follower profiles via `execute("instagram", "user", "user", {"user": "..."})`
- Check engagement authenticity
- Assess comment quality via `execute("instagram", "post", "post_comments", {"post": "{id}", "count": 50})`
- Use `query_cache()` to filter suspicious patterns

**Data Export**:
- Use `export_data(cache_key, "csv")` for spreadsheet analysis
- Use `export_data(cache_key, "json")` for programmatic processing

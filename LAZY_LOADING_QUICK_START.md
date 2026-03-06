# Lazy Loading Quick Start Guide

## Quick Reference

### 1. Lazy Load a Modal
```tsx
import { LazyEditProfileModal } from "@/utils/lazyComponents";

{showModal && <LazyEditProfileModal isOpen onClose={handleClose} />}
```

### 2. Lazy Load on Scroll
```tsx
import LazyComponent from "@/components/LazyComponent";

<LazyComponent rootMargin="200px">
  <HeavyComponent />
</LazyComponent>
```

### 3. Lazy Load with Suspense
```tsx
import LazyLoadWrapper from "@/components/LazyLoadWrapper";

<LazyLoadWrapper minHeight="400px">
  <ExpensiveComponent />
</LazyLoadWrapper>
```

### 4. Virtual Scrolling for Long Lists
```tsx
import VirtualList from "@/components/VirtualList";

<VirtualList
  items={items}
  renderItem={(item) => <ItemCard item={item} />}
  itemHeight={400}
  containerHeight={800}
/>
```

### 5. Custom Dynamic Import
```tsx
import dynamic from "next/dynamic";

const LazyChart = dynamic(() => import("./Chart"), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});
```

## When to Use What

| Scenario | Solution | Example |
|----------|----------|---------|
| Modal/Dialog | Pre-configured lazy component | `LazyEditProfileModal` |
| Below fold content | LazyComponent | `<LazyComponent><Footer /></LazyComponent>` |
| Tab content | LazyComponent + conditional | `{activeTab === 'x' && <LazyComponent>...` |
| Long list (100+ items) | VirtualList | `<VirtualList items={posts} .../>` |
| Heavy computation | LazyLoadWrapper | `<LazyLoadWrapper><Chart /></LazyLoadWrapper>` |
| Route-level | Next.js dynamic | `dynamic(() => import('./Page'))` |

## Available Lazy Components

Import from `@/utils/lazyComponents`:

### Modals
- `LazyEditProfileModal`
- `LazyCreateStoryModal`
- `LazyCreateDeSnapModal`
- `LazyAddPostModal`
- `LazyCommentModal`
- `LazyEditPostModal`
- `LazyPhotoUploadModal`

### Viewers
- `LazyDeSnapsViewer`
- `LazyMediaEditor`

### Lists
- `LazyStoriesList`
- `LazyFollowersList`
- `LazyFollowersModal`

### Features
- `LazyProfileAnalytics`
- `LazyProfileCustomization`
- `LazyMoodFilter`
- `LazyLiveSpaces`
- `LazyTimeCapsules`
- `LazyEmotionTracker`
- `LazyAISuggestions`
- `LazyAnonymousInsights`

### Content
- `LazyPosts`
- `LazyStoryCard`
- `LazyPremiumUserIndicator`

## Common Patterns

### Pattern: Modal on Button Click
```tsx
import { LazyEditProfileModal } from "@/utils/lazyComponents";

const [show, setShow] = useState(false);

<button onClick={() => setShow(true)}>Edit</button>
{show && <LazyEditProfileModal isOpen onClose={() => setShow(false)} />}
```

### Pattern: Tab Content
```tsx
import LazyComponent from "@/components/LazyComponent";

{activeTab === "posts" && (
  <LazyComponent>
    <PostsList />
  </LazyComponent>
)}
```

### Pattern: Infinite Scroll
```tsx
import LazyComponent from "@/components/LazyComponent";

{posts.map((post, index) => (
  <LazyComponent key={post.id} rootMargin="300px">
    <PostCard post={post} />
  </LazyComponent>
))}
```

### Pattern: Accordion/Collapse
```tsx
import LazyComponent from "@/components/LazyComponent";

{isExpanded && (
  <LazyComponent>
    <DetailedContent />
  </LazyComponent>
)}
```

## Performance Tips

1. **Preload Important Content**
   ```tsx
   <LazyComponent rootMargin="500px"> // Loads earlier
   ```

2. **Batch Related Components**
   ```tsx
   <LazyComponent>
     <Header />
     <Content />
     <Footer />
   </LazyComponent>
   ```

3. **Use Virtual Lists for 50+ Items**
   ```tsx
   {items.length > 50 ? (
     <VirtualList items={items} ... />
   ) : (
     items.map(item => <Item />)
   )}
   ```

4. **Provide Accurate Skeletons**
   ```tsx
   <LazyComponent 
     minHeight="400px" // Match actual height
     fallback={<CustomSkeleton />}
   >
   ```

5. **Don't Lazy Load Critical Content**
   ```tsx
   // ❌ Bad
   <LazyComponent><Header /></LazyComponent>
   
   // ✅ Good
   <Header />
   <LazyComponent><BelowFold /></LazyComponent>
   ```

## Debugging

### Check What's Loaded
```tsx
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('chunk'))
  .forEach(r => console.log(r.name));
```

### Measure Component Load Time
```tsx
import { Profiler } from 'react';

<Profiler id="MyComponent" onRender={(id, phase, actualDuration) => {
  console.log(`${id} took ${actualDuration}ms`);
}}>
  <MyComponent />
</Profiler>
```

### Check Bundle Size
```bash
npm run build
# Check .next/static/chunks/
```

## Migration Checklist

- [ ] Update layout.tsx with dynamic imports
- [ ] Wrap modals with lazy components
- [ ] Add LazyComponent to below-fold content
- [ ] Use VirtualList for long feeds
- [ ] Add LazyComponent to tab content
- [ ] Lazy load analytics/charts
- [ ] Lazy load media editors
- [ ] Test on slow 3G connection
- [ ] Verify no layout shifts
- [ ] Check bundle size reduction

## Need Help?

See full documentation: `LAZY_LOADING_IMPLEMENTATION.md`

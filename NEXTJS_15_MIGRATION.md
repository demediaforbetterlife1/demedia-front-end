# Next.js 15+ Migration - Params as Promise

## Overview
In Next.js 15+, route handler `params` are now Promises and must be awaited.

## Changes Made

### Updated Route Handlers

All dynamic route handlers have been updated to use `Promise<{ id: string }>` instead of `{ id: string }`.

#### Pattern Change

**Before (Next.js 14):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  // ...
}
```

**After (Next.js 15+):**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ...
}
```

### Files Updated

#### DeSnaps API
- ✅ `/api/desnaps/[id]/route.ts` - GET, DELETE
- ✅ `/api/desnaps/[id]/bookmark/route.ts` - POST
- ✅ `/api/desnaps/[id]/like/route.ts` - POST
- ✅ `/api/desnaps/[id]/comments/route.ts` - GET, POST
- ✅ `/api/desnaps/user/[userId]/route.ts` - GET

#### Posts API
- ✅ `/api/posts/[id]/route.ts` - GET, PUT, DELETE
- ✅ `/api/posts/[id]/bookmark/route.ts` - POST
- ✅ `/api/posts/[id]/like/route.ts` - POST (if exists)
- ✅ `/api/posts/[id]/comments/route.ts` - GET, POST
- ✅ `/api/posts/user/[userId]/route.ts` - GET

#### Stories API
- ✅ `/api/stories/[id]/route.ts` - DELETE
- ✅ `/api/stories/user/[userId]/route.ts` - GET

#### User API
- ✅ `/api/user/[id]/route.ts` - PUT
- ✅ `/api/user/[id]/follow/route.ts` - POST
- ✅ `/api/user/[id]/unfollow/route.ts` - POST
- ✅ `/api/user/[id]/followers/route.ts` - GET
- ✅ `/api/user/[id]/following/route.ts` - GET
- ✅ `/api/users/[id]/profile/route.ts` - GET, PUT
- ✅ `/api/users/[id]/followers/route.ts` - GET
- ✅ `/api/users/[id]/following/route.ts` - GET

#### Chat/Messages API
- ✅ `/api/chat/[chatId]/route.ts` - GET, DELETE
- ✅ `/api/messages/[chatId]/route.ts` - GET
- ✅ `/api/conversations/[conversationId]/messages/route.ts` - GET, POST

#### Comments API
- ✅ `/api/comments/[id]/route.ts` - PUT, DELETE

## Migration Checklist

When creating new dynamic routes:

- [ ] Use `Promise<{ paramName: string }>` for params type
- [ ] Await params before accessing: `const { id } = await params;`
- [ ] Update all HTTP methods (GET, POST, PUT, DELETE, PATCH)
- [ ] Test the route to ensure it works

## Common Patterns

### Single Parameter
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Use id
}
```

### Multiple Parameters
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; postId: string }> }
) {
  const { userId, postId } = await params;
  // Use userId and postId
}
```

### With Try-Catch
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Your logic here
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Why This Change?

Next.js 15 made params async to support:
1. **Streaming**: Better support for streaming responses
2. **Parallel Data Fetching**: Improved performance
3. **Type Safety**: Better TypeScript support
4. **Future Features**: Preparation for upcoming features

## Troubleshooting

### Error: "Type 'Promise<{ id: string }>' is not assignable to type '{ id: string }'"

**Solution**: Update the params type to `Promise<{ id: string }>` and await it:
```typescript
const { id } = await params;
```

### Error: "Property 'id' is missing in type 'Promise<{ id: string }>'"

**Solution**: You forgot to await the params:
```typescript
// ❌ Wrong
const id = params.id;

// ✅ Correct
const { id } = await params;
```

### Error: "Cannot use 'ssr: false' with dynamic in Server Components"

**Solution**: Remove dynamic imports from layout.tsx or move to client components. Server Components can't use `dynamic()` with `ssr: false`.

## Testing

After migration, test all dynamic routes:

```bash
# Build the project
npm run build

# Run in production mode
npm start

# Test each route
curl http://localhost:3000/api/posts/123
curl http://localhost:3000/api/users/456/profile
curl http://localhost:3000/api/desnaps/789
```

## References

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

# Testing the Robust Auth Pattern

## ✅ Test Checklist

### 1. Hard Refresh Tests
- [ ] Visit `/discover` → Hard refresh (F5) → Should show loading skeleton then content
- [ ] Visit `/events` → Hard refresh (F5) → Should show loading skeleton then content (or redirect to login)
- [ ] Visit any page → Hard refresh → No 404 errors in console

### 2. Direct URL Access Tests
- [ ] Open new tab → Navigate directly to `/discover` → Should work
- [ ] Open new tab → Navigate directly to `/events` → Should work or redirect to login
- [ ] Copy/paste URLs → Should work without errors

### 3. Auth State Tests
- [ ] **Logged out state**: Visit `/discover` → Should show public content
- [ ] **Logged out state**: Visit `/events` → Should redirect to login
- [ ] **Logged in state**: Visit `/discover` → Should show personalized content
- [ ] **Logged in state**: Visit `/events` → Should show user's events

### 4. Loading State Tests
- [ ] Slow network → Should show `FullPageSkeleton` while loading
- [ ] Auth initialization → Should show skeleton until auth is ready
- [ ] Data fetching → Should show skeleton until data loads

### 5. Error Handling Tests
- [ ] Network error → Should show `ErrorFallback` with retry button
- [ ] Auth error → Should show auth error message
- [ ] 404/null data → Should show empty state gracefully

## 🔧 How to Test

### Test 1: Hard Refresh (Most Important)
1. Open browser to `http://localhost:5182/discover`
2. Wait for page to fully load
3. Press F5 or Ctrl+R to hard refresh
4. **Expected**: Page should show loading skeleton briefly, then load content
5. **Failure**: If you see 404 errors in console or blank page

### Test 2: Direct URL Access
1. Open new browser tab
2. Type `http://localhost:5182/events` directly in address bar
3. Press Enter
4. **Expected**: Page loads correctly or redirects to login
5. **Failure**: If you see 404 errors or blank page

### Test 3: Auth Flow
1. Visit `/events` while logged out
2. **Expected**: Redirects to `/login`
3. Log in
4. **Expected**: Redirects back to `/events` and shows content

## 🐛 Common Issues & Solutions

### Issue: "404: NOT_FOUND" in console
**Cause**: Data fetching before auth is ready
**Solution**: Ensure `useAuthDependentData` is used correctly

### Issue: Blank page on refresh
**Cause**: Component renders before auth state is determined
**Solution**: Check `shouldRender` logic in `useOptionalAuth`/`useRequireAuth`

### Issue: Infinite loading
**Cause**: Auth state never resolves
**Solution**: Check `supabase.auth.getSession()` in auth context

### Issue: Data fetching errors
**Cause**: API calls made without proper auth headers
**Solution**: Ensure user object is passed to data loading functions

## 📊 Success Criteria

✅ **All pages work on hard refresh**
✅ **No 404 errors in browser console**
✅ **Proper loading states shown**
✅ **Auth redirects work correctly**
✅ **Error states are handled gracefully**

## 🚀 Performance Checks

- [ ] Auth state initializes quickly (< 1 second)
- [ ] Loading skeletons appear immediately
- [ ] No unnecessary API requests in console
- [ ] Smooth transitions between loading and content states

## 📝 Browser Console Logs

When testing, you should see logs like:
```
🔍 Loading events data for user: [user-id or anonymous]
✅ Events loaded successfully: [number] events
```

**Red flags** (should NOT see):
```
❌ Failed to load events: 404: NOT_FOUND
❌ Error: Cannot read properties of null
❌ Uncaught TypeError: user is undefined
```

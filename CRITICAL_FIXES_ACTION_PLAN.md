# Critical Fixes Action Plan

## Issues to Fix

### 1. Super Dark Mode Space Theme Not Applied ❌
**Problem**: Space effects not visible
**Root Cause**: ThemeEffects component may not be rendering or CSS not loading
**Solution**: 
- Verify ThemeEffects is properly imported
- Ensure CSS is loaded in correct order
- Add inline styles as fallback
- Test theme switching

### 2. Avatar Issues ❌
**Problem**: Profile pictures not updating/displaying correctly
**Root Cause**: Components not using new Avatar component
**Solution**:
- Replace all img tags with Avatar component in:
  - Posts component
  - DeSnaps viewer
  - Stories
  - Comments
  - Profile page
- Ensure userId prop is passed
- Test real-time updates

### 3. DeSnaps Issues ❌
**Problem**: DeSnaps not displaying correctly
**Root Cause**: Avatar not updated, possibly other display issues
**Solution**:
- Update DeSnapsViewer to use Avatar component
- Fix any video display issues
- Ensure proper data fetching
- Test creation and viewing

## Implementation Order

1. Fix Super Dark Mode (Quick Win)
2. Fix Avatar in Posts (High Impact)
3. Fix Avatar in DeSnaps (High Impact)
4. Fix Avatar in other components (Complete)
5. Test everything (Verify)

## Success Criteria

- ✅ Super Dark Mode shows space effects
- ✅ Gold Mode shows shine effects
- ✅ Avatars update in real-time everywhere
- ✅ DeSnaps display correctly with proper avatars
- ✅ No console errors
- ✅ Smooth performance

Let's fix these now!

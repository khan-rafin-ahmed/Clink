# 🔐 Security Guide - API Key Management

## 🚨 Critical Security Practices

### Never Commit API Keys to Version Control

**❌ NEVER DO THIS:**
```env
# DON'T commit actual API keys in documentation or config files
VITE_GOOGLE_MAPS_API_KEY=AIzaSyEXAMPLE_FAKE_KEY_NEVER_COMMIT_REAL_KEYS
```

**✅ ALWAYS DO THIS:**
```env
# Use placeholders in documentation and examples
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

## 🛡️ Secure API Key Management

### 1. Environment Variables Only
- Store all API keys in `.env.local` files (already in `.gitignore`)
- Use environment variables in your application code
- Never hardcode API keys in source code

### 2. Use Placeholders in Documentation
- Replace actual keys with descriptive placeholders
- Include instructions on where to get the actual keys
- Add security warnings in setup documentation

### 3. Restrict API Keys
Configure API key restrictions in Google Cloud Console:
- **HTTP referrers**: Limit to your domains only
- **IP addresses**: Restrict to your server IPs if applicable
- **API restrictions**: Enable only the APIs you need

## 🔧 Implementation in Thirstee App

### Environment File Structure
```
frontend/
├── .env.example          # Template with placeholders
├── .env.local           # Your actual keys (gitignored)
└── .gitignore           # Excludes all .env* files
```

### Application Code Pattern
```typescript
// ✅ Good: Read from environment variables
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ✅ Good: Validate API key before use
if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
  throw new Error('Google Maps API key is not configured');
}
```

## 📋 Security Checklist

### Before Committing Code
- [ ] No actual API keys in any files
- [ ] All sensitive data uses environment variables
- [ ] Documentation uses placeholder values
- [ ] `.env.local` is in `.gitignore`

### Setting Up New Environment
- [ ] Copy `.env.example` to `.env.local`
- [ ] Replace all placeholder values with actual credentials
- [ ] Verify API key restrictions are configured
- [ ] Test that application works with new keys

### Regular Security Maintenance
- [ ] Rotate API keys periodically
- [ ] Review API usage and billing
- [ ] Monitor for unauthorized access
- [ ] Keep API key restrictions up to date

## 🚨 If API Keys Are Exposed

### Immediate Actions
1. **Regenerate the compromised API key** immediately
2. **Review API usage logs** for unauthorized activity
3. **Check billing** for unexpected charges
4. **Update all environments** with the new key

### Repository Cleanup
1. **Remove exposed keys** from all files
2. **Replace with placeholders** and security instructions
3. **Update documentation** with proper security practices
4. **Commit the security fixes** immediately

### Prevention
1. **Add pre-commit hooks** to scan for API keys
2. **Regular security audits** of the codebase
3. **Team training** on security best practices
4. **Use secret scanning tools** in CI/CD

## 🔗 Useful Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Maps API Key Restrictions](https://developers.google.com/maps/api-security-best-practices)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)

## 📞 Emergency Response

If you discover exposed API keys:
1. **Act immediately** - don't wait
2. **Follow the "If API Keys Are Exposed" section** above
3. **Document the incident** for future prevention
4. **Review and improve** security practices

---

**Remember: Security is everyone's responsibility. When in doubt, err on the side of caution.**

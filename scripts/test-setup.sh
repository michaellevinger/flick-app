#!/bin/bash
echo "🔍 Running full setup verification..."
echo ""
node verify-supabase.js
echo ""
echo "📦 Managing storage..."
node manage-storage.js
echo ""
echo "✅ If all checks pass, you're ready to test the app!"
echo ""
echo "Run: npx expo start"

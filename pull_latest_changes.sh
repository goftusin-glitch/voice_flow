#!/bin/bash
# Commands to pull latest changes on the server

# First, check what local changes exist
echo "=== Checking local changes ==="
git status

echo ""
echo "=== Checking local commits not on remote ==="
git log origin/master..HEAD --oneline

echo ""
echo "=== To pull latest changes, run ONE of these commands: ==="
echo ""
echo "Option 1 (Recommended for deployment server):"
echo "  git reset --hard origin/master"
echo "  git pull origin master"
echo "  (This discards local changes and matches remote exactly)"
echo ""
echo "Option 2 (If you want to keep local changes):"
echo "  git pull --rebase origin master"
echo "  (This rebases your local commits on top of remote)"
echo ""
echo "Option 3 (Merge strategy):"
echo "  git pull --no-rebase origin master"
echo "  (This creates a merge commit)"

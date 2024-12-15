#!/bin/bash

# Display Git user information
echo "Git User Information:"
git config --get user.name
git config --get user.email
echo ""

# Display current repository information
echo "Current Repository Information:"
if [ -d .git ]; then
    echo "Repository Path: $(git rev-parse --show-toplevel)"
    echo "Current Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "Latest Commit: $(git log -1 --oneline)"
else
    echo "Not in a Git repository."
fi
echo ""

# Display remote repository information
echo "Remote Repository Information:"
git remote -v
echo ""

# Display SSH keys (if any)
echo "SSH Keys:"
if [ -f ~/.ssh/id_rsa ]; then
    echo "Default SSH Key: ~/.ssh/id_rsa"
else
    echo "No default SSH key found."
fi

if [ -f ~/.ssh/id_ed25519 ]; then
    echo "Ed25519 SSH Key: ~/.ssh/id_ed25519"
fi

# List all SSH keys in the .ssh directory
echo "All SSH Keys in ~/.ssh:"
ls ~/.ssh/*.pub 2>/dev/null || echo "No SSH keys found."

# Display current user account
echo ""
echo "Current User Account:"
whoami

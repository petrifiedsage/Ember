# Git Commit & Push Guide 📤

Ready to push Week 1 to GitHub? Follow this guide.

---

## Prerequisites

Before committing, ensure:

- [ ] All code changes are complete
- [ ] No syntax errors
- [ ] Backend tested locally
- [ ] Frontend tested locally
- [ ] Full registration → login → dashboard flow works
- [ ] Documentation reviewed
- [ ] .gitignore properly configured

---

## Step 1: Review Changes

See what files will be committed:

```bash
git status
```

Should show:
- Backend files added
- Frontend files added
- Documentation files added
- Config files added
- ❌ NOT showing: `venv/`, `node_modules/`, `.env`, `.git/`

---

## Step 2: Add All Changes

```bash
git add .
```

Verify staging:

```bash
git status
```

---

## Step 3: Commit with Message

```bash
git commit -m "Week 1: Complete email warmup platform foundation with auth"
```

Or for more detail:

```bash
git commit -m "Week 1: Complete email warmup platform foundation

- Backend: FastAPI with JWT auth and PostgreSQL
- Frontend: React with TypeScript and Tailwind CSS
- Auth: User registration and login with bcrypt
- Database: User and InboxConnection models with migrations
- Documentation: Comprehensive setup and development guides
- Configuration: Environment setup, .gitignore, build configs
- Status: Production-ready foundation, ready for Week 2"
```

---

## Step 4: Create GitHub Repository

If you haven't already:

1. Go to https://github.com/new
2. Repository name: `email-warmup`
3. Description: `Email warmup automation system with intelligent campaigns`
4. Public or Private (your choice)
5. ❌ DO NOT initialize with README/gitignore/license
6. Click "Create repository"

---

## Step 5: Add Remote & Push

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/email-warmup.git
git branch -M main
git push -u origin main
```

Run them in your terminal at project root.

---

## Step 6: Verify on GitHub

1. Go to your GitHub repository
2. Refresh the page
3. You should see all your files
4. Check the commit history

---

## Step 7: Set Up Branch Protection (Optional)

For team collaboration:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Require pull request reviews
4. Require status checks

---

## Common Issues

### "fatal: not a git repository"

```bash
# Make sure you're in the project root
cd d:\BlueRose\Ember
git status
```

### "fatal: refusing to merge unrelated histories"

```bash
# If you have local history and remote history
git pull --allow-unrelated-histories
git push
```

### "Permission denied (publickey)"

You need to set up SSH:
```bash
# Use HTTPS instead of SSH
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/email-warmup.git
git push -u origin main
```

---

## Complete Commit Workflow

```bash
# 1. Check what changed
git status

# 2. Add everything
git add .

# 3. Commit with message
git commit -m "Week 1: Foundation complete"

# 4. Add remote (first time only)
git remote add origin https://github.com/YOUR_USERNAME/email-warmup.git

# 5. Push to GitHub
git push -u origin main

# 6. Verify
git log
```

---

## After Pushing

### For Team Members Cloning

They can now clone with:

```bash
git clone https://github.com/YOUR_USERNAME/email-warmup.git
cd email-warmup
```

Then follow SETUP_GUIDE.md to get running.

### For Future Development

When working on Week 2:

```bash
# Create feature branch
git checkout -b feature/gmail-oauth

# Make changes, test locally

# Commit
git commit -m "feat: add gmail oauth integration"

# Push feature branch
git push origin feature/gmail-oauth

# Create pull request on GitHub

# After review, merge to main
git checkout main
git pull
```

---

## Git Workflow Tips

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat: add gmail oauth integration

Implement OAuth 2.0 flow for Gmail accounts.
Store refresh tokens securely in database.
Add connection management endpoints.

Closes #123
```

### Commit Best Practices

- ✅ Small, focused commits
- ✅ Clear commit messages
- ✅ Test before committing
- ✅ Commit frequently
- ❌ Don't commit broken code
- ❌ Don't commit node_modules or venv

### Push Best Practices

- ✅ Pull before pushing
- ✅ Resolve conflicts locally
- ✅ Use feature branches
- ✅ Keep main stable
- ❌ Don't force push to main

---

## GitHub Repository Settings

### Recommended Settings

1. **Branch Protection** (Settings → Branches)
   - Require pull request reviews
   - Require status checks
   - Dismiss stale reviews
   - Require branches to be up to date

2. **Collaborators** (Settings → Collaborators)
   - Add team members
   - Set permissions

3. **Actions** (if using CI/CD)
   - Setup workflows for tests
   - Setup deployment

---

## Monitoring Commits

### View Commit History

```bash
# See recent commits
git log --oneline

# See specific file history
git log --oneline app/main.py

# See detailed commit info
git show <commit-hash>
```

### See What Changed

```bash
# See changes in last commit
git diff HEAD~1

# See changes in specific file
git diff app/main.py

# See staged changes
git diff --cached
```

---

## Emergency Undo

### Undo Last Commit (not pushed)

```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

### Undo Pushed Commit

```bash
# Create new commit that undoes changes
git revert <commit-hash>
git push
```

---

## Tagging Releases

After Week 1 is solid, tag it:

```bash
# Create tag
git tag -a v1.0 -m "Week 1: Foundation complete"

# Push tag
git push origin v1.0

# List tags
git tag -l
```

---

## Summary

### First Time Push

```bash
git add .
git commit -m "Week 1: Foundation complete"
git remote add origin <url>
git push -u origin main
```

### Ongoing Development

```bash
git checkout -b feature/new-feature
# Make changes
git add .
git commit -m "feat: description"
git push origin feature/new-feature
# Create pull request
# Merge after review
```

---

## Next Steps

Once pushed to GitHub:

1. ✅ Share repository link with team
2. ✅ Team clones and sets up locally
3. ✅ Create project board for tasks
4. ✅ Start Week 2 development
5. ✅ Use feature branches for new work

---

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Commit Message Best Practices](https://cbea.ms/git-commit/)
- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)

---

**Week 1 is ready to be pushed! 🚀**

After you push, it'll be official - share the link!

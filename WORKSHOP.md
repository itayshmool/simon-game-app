# 🎮 Simon Game Workshop

Welcome to the Simon Game workshop! Follow these steps to get the multiplayer Simon Says game running locally and deployed to the cloud.

> 💡 **Tip:** Hover over any gray code block to see the copy button, or triple-click inside to select all text.

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ **Cursor IDE** installed → [Download here](https://cursor.com)
- ✅ **Node.js 18+** installed → [Download here](https://nodejs.org)
- ✅ **Git** installed → [Download here](https://git-scm.com)
- ✅ **GitHub account** → [Sign up](https://github.com)
- ✅ **Render.com account** (free tier) → [Sign up](https://render.com)

---

## Step 1: Clone and Open in Cursor

### 1.1 Open Terminal

- **Mac:** Press `Cmd + Space`, type "Terminal", press Enter
- **Windows:** Press `Win + R`, type "cmd", press Enter

### 1.2 Clone the Code

Copy and paste this command:

```bash
git clone https://github.com/itayshmool/simon-game-app-cday.git
```

### 1.3 Open in Cursor

1. Open **Cursor IDE**
2. Click **File** → **Open Folder**
3. Navigate to the `simon-game-app-cday` folder
4. Click **Open**

---

## Step 2: Setup and Test

In Cursor, open the terminal: Press **Ctrl + `** (backtick key)

### Run this command:

```bash
npm run go
```

This will:
1. ✅ Install all dependencies
2. ✅ Start the servers
3. ✅ Test that everything works
4. ✅ Stop the servers
5. ✅ Show success message

You should see:
```
═══════════════════════════════════════════════════
   ✅ SETUP COMPLETE - ALL TESTS PASSED!
═══════════════════════════════════════════════════
```

### Now Start the App

Run this command to start the servers:

```bash
npm run dev
```

### Open in Browser

Go to: **http://localhost:5173**

🎉 **The game is running!**

> 💡 Leave the terminal running. Press `Ctrl + C` to stop the servers when done.

---

## Step 3: Test the Game Locally

1. Click **"Create Game"**
2. Enter your name, pick an avatar
3. Click **"Create Game"**
4. Copy the **game code** (e.g., `ABC123`)
5. Open a **new browser tab**
6. Go to **http://localhost:5173**
7. Click **"Join Game"**
8. Paste the game code, enter a different name
9. Go back to first tab → Click **"Start Game"**
10. Play! 🎮

---

## Step 4: Deploy to Render

Now let's put your game online so anyone can play!

### 4.1 Create Your Own GitHub Repository

First, you need the code in YOUR GitHub account (not the workshop account).

**Run this command:**

```bash
npm run publish
```

This will:
1. ✅ Create a new repository in your GitHub account
2. ✅ Push all the code to it

When done, you'll see your repository URL: `https://github.com/YOUR_USERNAME/simon-game-app`

> ⚠️ **First time?** If you see "GitHub CLI not installed", ask Cursor:

```
Help me install GitHub CLI and login
```

---

### 4.2 Deploy on Render (Using Cursor)

**In Cursor chat (Cmd+L or Ctrl+L), copy and paste:**

```
Deploy my simon-game-app to Render. Create a backend web service and a frontend static site using the render.yaml configuration
```

Cursor will:
1. ✅ Create the backend service on Render
2. ✅ Create the frontend static site on Render
3. ✅ Configure the build commands
4. ✅ Give you the URLs when done

⏳ **Wait 5-10 minutes** for the first deployment to complete.

---

### 4.2 Alternative: Deploy Manually

If Cursor can't deploy, do it manually:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub account (if prompted)
4. Select your `simon-game-app` repository
5. Click **Apply**

---

### 4.3 Configure Environment Variables

**In Cursor chat, copy and paste:**

```
Get my Render services URLs and configure the environment variables: set FRONTEND_URL on simon-game-backend to the frontend URL, and set VITE_API_URL and VITE_SOCKET_URL on simon-game-frontend to the backend URL
```

Cursor will:
1. ✅ Find your services on Render
2. ✅ Get the URLs automatically
3. ✅ Configure all environment variables
4. ✅ Trigger a redeploy

⏳ Wait for redeploy to complete (1-2 minutes).

---

### 4.3 Alternative: Configure Manually

If Cursor can't configure, do it manually:

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **simon-game-backend** → **Environment**
   - Set `FRONTEND_URL` = your frontend URL (e.g., `https://simon-game-frontend-xxx.onrender.com`)
   - Click **Save Changes**
3. Click **simon-game-frontend** → **Environment**
   - Set `VITE_API_URL` = your backend URL
   - Set `VITE_SOCKET_URL` = your backend URL
   - Click **Save Changes**

---

### 4.4 Save Your Deployment Configuration

Let's save your deployment details so you can reference them later.

**In Cursor chat, copy and paste:**

```
Create a .cursorrules-deployment file that documents my Render deployment: include the service names, URLs, and environment variables configuration. Get the actual values from Render.
```

Cursor will create a file with your deployment details like:
- Backend URL
- Frontend URL
- Environment variables
- Service IDs

This is useful if you need to update or redeploy later!

---

### 4.5 Test Online

1. Open your **frontend URL** in browser
2. Create a game
3. Share the link with a friend
4. Play together! 🎉

---

## 🎉 Congratulations!

You've successfully:
- ✅ Set up a full-stack TypeScript project
- ✅ Run a React + WebSocket app locally
- ✅ Deployed to the cloud

**Your game is live!** Share the link with friends and family.

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run go` fails | Make sure Node.js is installed: `node --version` should show v18+ |
| App won't start | Close other terminals, try again |
| Can't connect on Render | Check environment variables are set correctly |
| WebSocket issues | Make sure URLs use `https://` not `http://` |

---

## ❓ Need Help?

Ask Cursor! Open chat (Cmd+L) and describe your problem:

```
I'm getting this error: [paste error message]
```

---

**Happy coding! 🚀**

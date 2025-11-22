# Trellify

Hey! This is Trellify - my take on a task management app. Built it with Next.js cause I wanted to learn it, and ended up adding some recomendations stuff that I thought was pretty cool.

## What's this about?

So basically it's a kanban board app. You know, like Trello but simpler. You create boards, add lists to them, throw in some cards. Pretty standard stuff. But I added this recomendations feature that suggests stuff like which cards need attention, when to move things around, etc. It's not super smart but it works.


## What can it do?

- **Boards & Lists**: Make boards, add lists. Default ones are "To Do", "In Progress", and "Done" but you can add more or rename them
- **Cards**: Add cards with titles, descriptions, and due dates. Click on them to edit
- **Drag & Drop**: Just drag cards between lists. Pretty smooth if I say so myself
- **Team stuff**: Invite people to boards via email. They need to sign up first though
- **Smart Recomendations**: This is the fun part. It suggests:
  - Cards with due dates (shows which one's coming up first)
  - Cards that should move (like if you write "started" in description, it suggests moving from To Do to Progress)
  - Cards that might be related (for grouping)
- **Auth**: JWT tokens, password hashing with bcrypt. Standard stuff.

## Tech I used

- Next.js 16 - The framework. App Router is pretty nice once you get used to it
- TypeScript - Tried to use it everywhere but some places are still `any` 
- Prisma - ORM for database. Makes things easier
- PostgreSQL - Database. Using Supabase for hosting
- TailwindCSS - Styling. Love it, makes things quick
- Framer Motion - Added some animations to make it feel less static
- JWT - For auth tokens
- Nodemailer - Sending those invite emails

## How to run it

### What you need

- Node.js (I use v20, but should work with others)
- A PostgreSQL database somewhere
- npm (or yarn if you prefer)

### Setup

1. Clone it:
```bash
git clone https://github.com/garg-lakshay/trellify.git
cd trellify
```

2. Install stuff:
```bash
npm install
```

3. Environment variables. Make a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trellify"
JWT_SECRET="make-something-random-here"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For the SMTP stuff, if you're using Gmail you'll need an app password. Google it if you don't know how.

4. Database setup:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run it:
```bash
npm run dev
```

Should be running on http://localhost:3000 now.

## Project structure

It's a Next.js app so structure is pretty standard:

```
src/
├── app/
│   ├── api/          # All the API routes
│   ├── boards/       # Board pages
│   ├── login/        # Login page
│   └── register/     # Register page
├── components/       # React components (Nav, RecommendationsPanel)
├── context/          # Auth context
└── lib/              # Helper stuff (prisma client, auth middleware, etc)
```

API routes handle the backend. Frontend is mostly client components. Nothing too fancy.

## How it works

1. **Auth**: Register/login, get a JWT token. Stored in localStorage (I know, not ideal but works for now)
2. **Boards**: Create boards, invite people. Owner can do everything, members can add/edit cards
3. **Lists & Cards**: Standard kanban. Lists contain cards, cards have positions
4. **Recomendations**: Runs some logic to analyze cards:
   - Checks due dates, finds the nearest one
   - Looks for keywords like "started" in descriptions
   - Calculates similarity between cards using word overlap (Jaccard similarity if you care)
   - Stores suggestions in the database

The recomendations panel shows up on the right side of boards. You can refresh it to regenerate.

## Database

Pretty simple schema:
- Users - email, password (hashed), name
- Boards - title, owner
- BoardMembers - many-to-many between users and boards
- Lists - title, position, belongs to board
- Cards - title, description, dueDate, position, belongs to list and board
- Recomendations - stores the suggestions with type, score, payload

Check `prisma/schema.prisma` if you want the details.

## Deploying

I deployed this on Vercel. Here's what you need to do:

1. Push to GitHub
2. Connect to Vercel
3. Add all the environment variables in Vercel dashboard
4. Make sure your database is accessible (I used Supabase, works great)
5. Update `NEXT_PUBLIC_APP_URL` to your actual domain

Build command is just `npm run build`, should work fine.

## Things that could be better

- Email invites might fail silently if SMTP isn't set up right (user still gets added though)
- Recomendations are pretty basic. Could use ML or something but that's overkill for now
- No real-time updates. Would need websockets for that
- Mobile view could be improved. Works but not perfect
- localStorage for tokens isn't the most secure but it's fine for this project

## Contributing

This is my personal project but feel free to fork it, use it, whatever. If you find bugs or have ideas, feel free to open an issue. Can't promise I'll fix everything quickly though.

## License

MIT? I don't really care, do what you want with it.

## About

Made by Lakshay Garg. Built this to learn Next.js and ended up with a working app. Pretty happy with how it turned out!

---

P.S. - If something doesn't work, check the console logs. I added some error logging that might help debug things. Also, make sure all your env variables are set correctly, that's usually the issue.

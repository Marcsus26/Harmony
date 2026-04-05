# Harmony

Harmony is a social platform for Steam players built with Django and a React frontend.

It is designed to help users link a Steam account, manage friends, chat in servers and channels, and receive game suggestions based on Steam library data.

## What this project does

Harmony brings together user profiles, social connections and Steam game data in one place.

The backend supports:

- user registration and authentication
- Steam account linking through `steam_id`
- friends and friend requests
- simple server/channel chat structures
- game recommendation endpoints using Steam data and a local genre dataset

The frontend supports:

- login and registration flows
- profile editing and Steam settings
- viewing recommended games
- a chat interface for servers and channels
- a game detail view powered by Steam data

## Main features

- standard Django user model extended with Steam profile data
- Steam-owned games are fetched through the Steam API when a Steam ID is linked
- friend request handling and friends management
- channel-based chat servers with message history
- recommendation engine using a local Steam dataset and KNN-style scoring
- ability to mark games as rejected so they are not suggested again

## How to run locally

1. Install backend requirements and create the database:

   ```bash
   cd Harmony
   python manage.py migrate
   ```

2. Start the Django backend:

   ```bash
   python manage.py runserver
   ```

3. Install frontend dependencies and build the React bundle:

   ```bash
   cd Harmony/frontend
   npm install
   npm run build
   ```

4. Open the app in your browser at the Django development server address.

## Notes

- `Harmony/HarmonyBack/` contains the backend models, serializers, views, and recommendation logic.
- `Harmony/frontend/` contains the React application and Webpack configuration.
- `Harmony/HarmonyBack/steamspy_details_cleaned.csv` is used for genre and recommendation data.
- Recommendations depend on a linked Steam account and Steam API responses.

## Project structure

- `Harmony/`: Django project configuration and management files
- `Harmony/HarmonyBack/`: backend app with models, views, serializers, and recommendation code
- `Harmony/frontend/`: frontend source files, build setup, and static assets
- `Harmony/db.sqlite3`: local development database file

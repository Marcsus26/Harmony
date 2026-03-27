import os
import requests
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def get_recently_played_games(steam_id):
    """
    Recupere les jeux joues les 2 dernieres semaines via l'API Steam.
    Retourne un dictionnaire {appid: playtime_2weeks}.
    """
    api_key = os.getenv("STEAM_API_KEY", "")
    if not api_key or not steam_id:
        return {}

    url = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/"
    params = {
        'key': api_key,
        'steamid': steam_id,
        'format': 'json'
    }

    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        games = data.get('response', {}).get('games', [])
        return {str(g['appid']): g['playtime_2weeks'] for g in games}
    except Exception:
        return {}

def calculate_player_similarity(user_games, other_user_games):
    """
    Calcule la similarite de cosinus entre deux profils de jeux recents.
    """
    if not user_games or not other_user_games:
        return 0.0

    # Creation d'un set unique de tous les appids des deux joueurs
    all_appids = list(set(user_games.keys()) | set(other_user_games.keys()))
    
    # Creation des vecteurs de temps de jeu
    v1 = np.array([user_games.get(appid, 0) for appid in all_appids]).reshape(1, -1)
    v2 = np.array([other_user_games.get(appid, 0) for appid in all_appids]).reshape(1, -1)
    
    # Evite la division par zero si un vecteur est vide
    if np.all(v1 == 0) or np.all(v2 == 0):
        return 0.0
        
    return float(cosine_similarity(v1, v2)[0][0])
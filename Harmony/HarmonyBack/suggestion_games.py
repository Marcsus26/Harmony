import os
from collections import defaultdict
from math import log

import pandas as pd
import requests

def get_steam_owned_games_df(steam_id):
    """
    Récupère les jeux d'un utilisateur, nettoie les données et retourne un DataFrame Pandas.
    """
    api_key = os.getenv("STEAM_API_KEY", "")
    if not api_key:
        return pd.DataFrame(columns=['playtime_forever', 'playtime_2weeks'])

    url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"
    
    params = {
        'key': api_key,
        'steamid': steam_id,
        'format': 'json'
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if 'response' in data and 'games' in data['response']:
            games_list = data['response']['games']
            
            df = pd.DataFrame(games_list)
            
            if df.empty:
                return pd.DataFrame(columns=['playtime_forever', 'playtime_2weeks'])
            
            if 'playtime_2weeks' not in df.columns:
                df['playtime_2weeks'] = 0
            else:
                df['playtime_2weeks'] = df['playtime_2weeks'].fillna(0)
            
            df = df[['appid', 'playtime_forever', 'playtime_2weeks']]
            
            df = df[df['playtime_forever'] > 0]
            
            df = df.set_index('appid')
            
            return df
            
        return pd.DataFrame(columns=['playtime_forever', 'playtime_2weeks'])
            
    except (requests.exceptions.RequestException, ValueError):
        return pd.DataFrame(columns=['playtime_forever', 'playtime_2weeks'])

def create_pandas_steam_games(steam_games_csv):
    steam_games = pd.read_csv(steam_games_csv, index_col="appid")
    return steam_games

def create_user_pref_dict(steam_id, steam_games_csv):
    user_games = get_steam_owned_games_df(steam_id)
    if user_games.empty:
        return {}

    steam_games = create_pandas_steam_games(steam_games_csv)
    merged_games = user_games.join(steam_games, how='inner')

    user_pref = defaultdict(float)

    for _, row in merged_games.iterrows():
        playtime = row['playtime_forever']
        genres_str = row.get('genre')
        if pd.isna(genres_str):
            continue

        genres = str(genres_str).split(", ")

        for genre in genres:
            user_pref[genre] += log(1 + playtime)

    sorted_pref = dict(sorted(user_pref.items(), key=lambda item: item[1], reverse=True))
    
    return sorted_pref
    
def get_top_5_recommendations(steam_id, steam_games_csv, rejected_appids=None):
    user_pref_dict = create_user_pref_dict(steam_id, steam_games_csv)
    if rejected_appids is None:
        rejected_appids = []

    user_games = get_steam_owned_games_df(steam_id)
    if not user_games.empty:
        owned_appids = list(user_games.index)
    else:
        owned_appids = []

    appids_to_exclude = owned_appids + rejected_appids
    steam_games = create_pandas_steam_games(steam_games_csv)
    
    candidates = steam_games[~steam_games.index.isin(appids_to_exclude)].copy()

    max_user_pref = max(user_pref_dict.values()) if user_pref_dict else 1.0

    def calculate_composite_score(row):

        genre_string = row['genre']
        genre_score = 0.0
        
        if not pd.isna(genre_string):
            genres = str(genre_string).split(", ")
            for genre in genres:
                genre_score += user_pref_dict.get(genre, 0.0)
            
            genre_score = genre_score / (len(genres) ** 0.5)

        normalized_genre_score = (genre_score / max_user_pref) * 100 if max_user_pref > 0 else 0

        try:
            pos = int(row.get('positive', 0) or 0)
            neg = int(row.get('negative', 0) or 0)
        except (TypeError, ValueError):
            pos, neg = 0, 0
        total_reviews = pos + neg
        
        if total_reviews > 50:  # On ignore les jeux avec trop peu d'avis
            quality_score = (pos / total_reviews) * 100
        else:
            quality_score = 0.0

        pop_log = min(log(total_reviews + 1, 10), 6.0)
        popularity_score = (pop_log / 6.0) * 100 

        final_score = (normalized_genre_score * 0.5) + (quality_score * 0.3) + (popularity_score * 0.2)
        return final_score

    candidates['match_score'] = candidates.apply(calculate_composite_score, axis=1)

    top_5 = candidates.sort_values(by='match_score', ascending=False).head(5).copy()
    top_5['positive'] = top_5['positive'].fillna(0).astype(int)
    top_5['match_score'] = top_5['match_score'].round(2)

    return top_5[['name', 'genre', 'positive', 'match_score']]
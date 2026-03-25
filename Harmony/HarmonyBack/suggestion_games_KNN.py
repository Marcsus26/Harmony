import os
from math import log1p

import numpy as np
import pandas as pd
import requests
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MaxAbsScaler


def get_steam_owned_games_df(steam_id):
    """
    Fetch user owned games from Steam API and return:
    index=appid, columns=[playtime_forever]
    """
    api_key = os.getenv("STEAM_API_KEY", "")
    if not api_key:
        return pd.DataFrame(columns=["playtime_forever"])

    url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/"
    params = {
        "key": api_key,
        "steamid": steam_id,
        "format": "json",
        "include_appinfo": False,
        "include_played_free_games": True,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        games_list = data.get("response", {}).get("games", [])
        if not games_list:
            return pd.DataFrame(columns=["playtime_forever"])

        df = pd.DataFrame(games_list)
        if "appid" not in df.columns or "playtime_forever" not in df.columns:
            return pd.DataFrame(columns=["playtime_forever"])

        df = df[["appid", "playtime_forever"]].copy()
        df["playtime_forever"] = pd.to_numeric(df["playtime_forever"], errors="coerce").fillna(0)
        df = df[df["playtime_forever"] > 0]
        return df.set_index("appid")

    except requests.RequestException:
        return pd.DataFrame(columns=["playtime_forever"])
    except ValueError:
        return pd.DataFrame(columns=["playtime_forever"])


def _load_catalog(steam_games_csv):
    """
    Load and clean catalog dataframe (indexed by appid).
    """
    catalog = pd.read_csv(steam_games_csv, index_col="appid")
    if catalog.empty:
        return catalog

    for col in ["positive", "negative", "price"]:
        if col in catalog.columns:
            catalog[col] = pd.to_numeric(catalog[col], errors="coerce").fillna(0)

    if "genre" not in catalog.columns:
        catalog["genre"] = ""

    catalog["genre"] = catalog["genre"].fillna("").astype(str)
    return catalog


def _prepare_feature_matrix(catalog):
    """
    Build feature matrix for KNN:
    - Multi-hot genre
    - Quality ratio (positive / total)
    - Popularity log(total_reviews)
    """
    genres = catalog["genre"].str.get_dummies(sep=", ")
    pos = catalog.get("positive", pd.Series(0, index=catalog.index)).fillna(0)
    neg = catalog.get("negative", pd.Series(0, index=catalog.index)).fillna(0)

    total_reviews = pos + neg
    quality_ratio = np.where(total_reviews > 0, pos / total_reviews, 0.0)
    popularity_log = np.log1p(total_reviews)

    extra = pd.DataFrame(
        {
            "quality_ratio": quality_ratio,
            "popularity_log": popularity_log,
        },
        index=catalog.index,
    )

    features = pd.concat([genres, extra], axis=1).fillna(0)
    scaler = MaxAbsScaler()
    features_scaled = scaler.fit_transform(features)
    return features_scaled


def _build_user_profile_vector(user_games, catalog, features_scaled):
    """
    Build a weighted user taste vector from ALL owned games in catalog.
    Weights = log(1 + playtime).
    """
    common_appids = user_games.index.intersection(catalog.index)
    if common_appids.empty:
        return None

    appid_to_idx = {appid: i for i, appid in enumerate(catalog.index)}
    valid_rows = [appid_to_idx[a] for a in common_appids]

    playtimes = user_games.loc[common_appids, "playtime_forever"].astype(float).values
    weights = np.log1p(playtimes)
    if weights.sum() <= 0:
        return None
    weights = weights / weights.sum()

    user_matrix = features_scaled[valid_rows]
    user_profile = np.asarray(user_matrix.T.dot(weights)).reshape(1, -1)
    return user_profile


def _popularity_fallback(catalog, top_n=5):
    """
    Fallback when user profile can't be built (private Steam profile, etc).
    """
    pos = catalog.get("positive", pd.Series(0, index=catalog.index)).fillna(0)
    neg = catalog.get("negative", pd.Series(0, index=catalog.index)).fillna(0)
    total = pos + neg

    quality = np.where(total > 0, pos / total, 0.0)
    pop = np.log1p(total)
    pop_norm = pop / pop.max() if pop.max() > 0 else 0.0

    score = 0.75 * quality + 0.25 * pop_norm
    out = catalog.copy()
    out["score"] = score

    cols = [c for c in ["name", "genre", "positive", "negative", "score"] if c in out.columns]
    return out.sort_values("score", ascending=False).head(top_n)[cols]


def get_knn_recommendations(steam_id, steam_games_csv, rejected_appids=None, top_n=50, min_reviews=50):
    """
    kNN recommender based on user profile vector from owned games.
    Returns top_n rows indexed by appid.
    """
    if rejected_appids is None:
        rejected_appids = []

    user_games = get_steam_owned_games_df(steam_id)
    catalog = _load_catalog(steam_games_csv)

    if catalog.empty:
        return pd.DataFrame(columns=["name", "genre", "positive", "negative", "score"])

    # Optional quality filter for more relevant outputs
    if "positive" in catalog.columns and "negative" in catalog.columns:
        total_reviews = catalog["positive"] + catalog["negative"]
        catalog = catalog[total_reviews >= min_reviews].copy()

    if catalog.empty:
        return pd.DataFrame(columns=["name", "genre", "positive", "negative", "score"])

    features_scaled = _prepare_feature_matrix(catalog)
    user_profile = _build_user_profile_vector(user_games, catalog, features_scaled)

    # If Steam profile is private or no overlap with catalog -> robust fallback
    if user_profile is None:
        return _popularity_fallback(catalog, top_n=top_n)

    # Use cosine for similarity in sparse/high-dim space
    n_neighbors = min(len(catalog), max(top_n * 20, 100))
    model = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine", algorithm="brute")
    model.fit(features_scaled)

    distances, indices = model.kneighbors(user_profile)

    owned_appids = set(user_games.index.tolist())
    rejected_set = set(rejected_appids)
    blacklist = owned_appids.union(rejected_set)

    ranked_appids = []
    ranked_scores = []

    for dist, idx in zip(distances.flatten(), indices.flatten()):
        appid = catalog.index[idx]
        if appid in blacklist:
            continue
        similarity = 1.0 - float(dist)  # cosine distance -> similarity
        ranked_appids.append(appid)
        ranked_scores.append(similarity)
        if len(ranked_appids) >= top_n:
            break

    if not ranked_appids:
        return _popularity_fallback(catalog, top_n=top_n)

    result = catalog.loc[ranked_appids].copy()
    result["score"] = ranked_scores

    cols = [c for c in ["name", "genre", "positive", "negative", "score"] if c in result.columns]
    return result[cols].sort_values("score", ascending=False)


if __name__ == "__main__":
    # Local test only; avoids side effects on import by Django.
    df = get_knn_recommendations(
        steam_id=76561198833000709,
        steam_games_csv="./Harmony/HarmonyBack/steamspy_details_cleaned.csv",
        top_n=50,
    )
    print(df)
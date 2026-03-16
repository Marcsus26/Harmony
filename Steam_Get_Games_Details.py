import requests
import csv
import time
import os

def get_game_details(appid):
    """Interroge l'API Store pour un AppID précis."""
    url = "https://store.steampowered.com/api/appdetails"
    params = {"appids": appid, "l": "french"} # 'l' pour avoir les textes en français
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 429:
            print("⚠️ Rate limit atteint. Pause de 30 secondes...")
            time.sleep(30)
            return None
            
        data = response.json()
        if data and str(appid) in data and data[str(appid)]['success']:
            return data[str(appid)]['data']
    except Exception as e:
        print(f"Erreur pour {appid}: {e}")
    return None

def process_details(input_file="steam_games.csv", output_file="steam_details.csv"):
    # On définit les colonnes qu'on veut extraire
    fieldnames = ['appid', 'name', 'type', 'is_free', 'price', 'genres', 'developers']
    
    # Vérifier si on doit reprendre un travail en cours
    existing_ids = set()
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            existing_ids = {row['appid'] for row in reader}

    with open(input_file, 'r', encoding='utf-8') as f_in, \
         open(output_file, 'a', newline='', encoding='utf-8') as f_out:
        
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        
        # Si le fichier est vide, on écrit l'en-tête
        if os.stat(output_file).st_size == 0:
            writer.writeheader()

        print("Début de la récupération des détails...")
        
        for count, row in enumerate(reader):
            appid = row['appid']
            
            # On saute si déjà traité
            if appid in existing_ids:
                continue

            print(f"[{count}] Récupération de : {row['name']} (ID: {appid})...")
            
            details = get_game_details(appid)
            
            if details:
                # Extraction propre des données
                price = details.get('price_overview', {}).get('final_formatted', 'N/A')
                if details.get('is_free'): price = "Gratuit"
                
                genres = ", ".join([g['description'] for g in details.get('genres', [])])
                devs = ", ".join(details.get('developers', []))
                
                writer.writerow({
                    'appid': appid,
                    'name': details.get('name'),
                    'type': details.get('type'),
                    'is_free': details.get('is_free'),
                    'price': price,
                    'genres': genres,
                    'developers': devs
                })
                
                # PAUSE CRITIQUE : Steam autorise environ 1 requête par seconde
                # Plus tu es lent, moins tu as de chances d'être banni.
                time.sleep(0.2) 
            else:
                # Petite pause même si échec
                time.sleep(0.5)

# Lancer le processus
process_details()
import requests
import csv
import time
import os

def get_details_from_existing_csv(input_file="steam_games.csv", output_file="steamspy_details.csv"):
    """
    Lit les appids depuis steam_games.csv et récupère les détails via SteamSpy.
    """
    url = "https://steamspy.com/api.php"
    
    # Définition des colonnes souhaitées
    fieldnames = [
        'appid', 'name', 'developer', 'publisher', 'score_rank', 
        'positive', 'negative', 'userscore', 'owners', 
        'average_forever', 'median_forever', 'price', 'initialprice', 'discount', 'genre'
    ]

    # 1. On vérifie quels jeux ont déjà été traités pour pouvoir reprendre en cas de coupure
    processed_ids = set()
    if os.path.exists(output_file):
        with open(output_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                processed_ids.add(row['appid'])

    # 2. Ouverture du fichier source et du fichier destination
    with open(input_file, mode='r', encoding='utf-8') as f_in, \
         open(output_file, mode='a', newline='', encoding='utf-8') as f_out:
        
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        
        # Si le fichier est nouveau, on écrit l'en-tête
        if os.stat(output_file).st_size == 0:
            writer.writeheader()

        print(f"Début de la récupération des détails depuis {input_file}...")

        for row in reader:
            appid = row['appid']
            
            # On saute si déjà fait
            if appid in processed_ids:
                continue

            params = {'request': 'appdetails', 'appid': appid}
            
            try:
                response = requests.get(url, params=params)
                
                if response.status_code == 429:
                    print("⚠️ Trop de requêtes. Pause de 30s...")
                    time.sleep(30)
                    continue
                
                data = response.json()

                if data and 'name' in data:
                    # Préparation de la ligne
                    # .get(field, "N/A") permet d'éviter les erreurs si une clé manque
                    output_row = {field: data.get(field, "N/A") for field in fieldnames}
                    
                    writer.writerow(output_row)
                    print(f"Récupéré : {data['name']} (ID: {appid})")
                else:
                    print(f"Données invalides pour l'ID {appid}")

            except Exception as e:
                print(f"Erreur pour l'ID {appid}: {e}")
                # En cas d'erreur réseau, on attend un peu
                time.sleep(0.5)
                continue

    print(f"\nTerminé ! Les détails sont dans {output_file}")

# --- LANCEMENT ---
# Assure-toi que "steam_games.csv" existe dans le même dossier
if __name__ == "__main__":
    get_details_from_existing_csv()
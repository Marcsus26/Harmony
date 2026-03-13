import requests
import csv

def save_steam_apps_to_csv(api_key, filename="steam_games.csv"):
    url = "https://api.steampowered.com/IStoreService/GetAppList/v1/"
    last_appid = 0
    total_count = 0
    
    # On ouvre le fichier en mode écriture ('w') avec l'encodage utf-8
    with open(filename, mode='w', newline='', encoding='utf-8') as csv_file:
        fieldnames = ['appid', 'name', 'price_change_number', 'last_modified']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        
        # Écriture de l'en-tête (la première ligne du CSV)
        writer.writeheader()
        
        print(f"Début de l'extraction vers {filename}...")
        
        while True:
            params = {
                'key': api_key,
                'last_appid': last_appid,
                'max_results': 50000,
                'include_dlc': False,
                'include_software': False,
                'include_videos': False,
                'include_hardware': False
            }
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json().get('response', {})
                
                apps = data.get('apps', [])
                if not apps:
                    break
                
                # On écrit les jeux par blocs de 10 000
                writer.writerows(apps)
                
                total_count += len(apps)
                last_appid = apps[-1]['appid']
                print(f"Progression : {total_count} jeux enregistrés...")
                
                if not data.get('have_more_results', False):
                    break
                    
            except Exception as e:
                print(f"Erreur lors de la récupération : {e}")
                break

    print(f"\nTerminé ! {total_count} jeux ont été sauvegardés dans '{filename}'.")

# --- CONFIGURATION ---
# Remplace par ta clé API Steam (https://steamcommunity.com/dev/apikey)
MY_API_KEY = "7F442F9CE1BC3DC535493B80B02F69A9" 

# Lancement
save_steam_apps_to_csv(MY_API_KEY)
#!/usr/bin/env python3
"""Add settings.hover_preview.{title,description} to all locale files."""
import json
import os
from collections import OrderedDict

LOCALES_DIR = "/home/z/my-project/liner-app/src/languages/locales"

# title / description per locale
TRANSLATIONS = {
    "en": {
        "title": "Preview songs on hover",
        "description": "Hover a song to hear a short preview. Only plays while nothing else is playing.",
    },
    "de": {
        "title": "Songs beim Hover vorhören",
        "description": "Bewege den Mauszeiger über einen Song, um eine kurze Vorschau zu hören. Spielt nur, wenn gerade nichts anderes abgespielt wird.",
    },
    "es": {
        "title": "Previsualizar canciones al pasar el cursor",
        "description": "Pasa el cursor sobre una canción para escuchar una vista previa breve. Solo suena mientras no se esté reproduciendo nada más.",
    },
    "fr": {
        "title": "Aperçu des titres au survol",
        "description": "Survolez un titre pour écouter un court extrait. Ne fonctionne que lorsque rien d'autre n'est en lecture.",
    },
    "id": {
        "title": "Pratinjau lagungan saat diarahkan",
        "description": "Arahkan kursor ke lagu untuk mendengar cuplikan singkat. Hanya diputar saat tidak ada lagu lain yang sedang diputar.",
    },
    "it": {
        "title": "Anteprima dei brani al passaggio del mouse",
        "description": "Passa il mouse sopra un brano per ascoltare una breve anteprima. Riproduce solo quando non c'è altro in riproduzione.",
    },
    "pl": {
        "title": "Podgląd utworów po najechaniu",
        "description": "Najedź kursorem na utwór, aby usłyszeć krótki fragment. Działa tylko wtedy, gdy nic innego nie jest odtwarzane.",
    },
    "pt": {
        "title": "Pré-visualizar músicas ao passar o mouse",
        "description": "Passe o mouse sobre uma música para ouvir uma prévia curta. Toca apenas quando nada mais está sendo reproduzido.",
    },
    "ru": {
        "title": "Прослушивание при наведении",
        "description": "Наведите курсор на песню, чтобы услышать короткий фрагмент. Работает только когда ничего не воспроизводится.",
    },
    "tl": {
        "title": "I-preview ang kanta sa hover",
        "description": "I-hover ang isang kanta para makinig ng maikling preview. Tumatugtog lang kapag walang ibang tumutugtog.",
    },
    "tr": {
        "title": "Üzerine gelince şarkı önizleme",
        "description": "Kısa bir önizleme duymak için imleci bir şarkının üzerinde tut. Başka bir şey çalarken yalnızca çalar.",
    },
    "uk": {
        "title": "Прослуховування пісень при наведенні",
        "description": "Наведіть курсор на пісню, щоб почути короткий фрагмент. Працює лише коли нічого інше не відтворюється.",
    },
}

added = []
for locale, texts in TRANSLATIONS.items():
    path = os.path.join(LOCALES_DIR, f"{locale}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)
    settings = data.setdefault("settings", OrderedDict())
    settings["hover_preview"] = OrderedDict(
        [("title", texts["title"]), ("description", texts["description"])]
    )
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    added.append(locale)

# cross-locale parity assertion
for locale in TRANSLATIONS:
    path = os.path.join(LOCALES_DIR, f"{locale}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    hp = data["settings"]["hover_preview"]
    assert set(hp.keys()) == {"title", "description"}, locale
    assert hp["title"] and hp["description"], locale

print("added settings.hover_preview to:", ", ".join(added))

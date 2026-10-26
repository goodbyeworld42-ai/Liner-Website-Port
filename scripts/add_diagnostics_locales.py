#!/usr/bin/env python3
"""Add soundcloud_fallback + playback_diagnostics keys to all 12 locales."""
import json
import os

LOCALES_DIR = "/home/z/my-project/liner-app/src/languages/locales"

TRANSLATIONS = {
    "en": {
        "sf_title": "Find the track on SoundCloud",
        "sf_desc": "If a track can't be played, search SoundCloud for the same song and play that version instead.",
        "pd_title": "Playback diagnostics",
        "pd_desc": "Recent playback attempts and failures. Copy this list when reporting a song that won't play.",
        "pd_empty": "Nothing recorded yet.",
        "pd_copy": "Copy",
        "pd_clear": "Clear",
    },
    "de": {
        "sf_title": "Titel auf SoundCloud finden",
        "sf_desc": "Wenn ein Titel nicht abgespielt werden kann, wird dasselbe L\u00fcck auf SoundCloud gesucht und stattdessen abgespielt.",
        "pd_title": "Wiedergabe-Diagnose",
        "pd_desc": "Letzte Wiedergabeversuche und Fehler. Kopiere diese Liste, wenn du einen Titel meldest, der nicht abgespielt wird.",
        "pd_empty": "Noch nichts aufgezeichnet.",
        "pd_copy": "Kopieren",
        "pd_clear": "L\u00f6schen",
    },
    "es": {
        "sf_title": "Buscar la canci\u00f3n en SoundCloud",
        "sf_desc": "Si una canci\u00f3n no se puede reproducir, se busca la misma canci\u00f3n en SoundCloud y se reproduce esa versi\u00f3n.",
        "pd_title": "Diagn\u00f3stico de reproducci\u00f3n",
        "pd_desc": "Intentos y errores de reproducci\u00f3n recientes. Copia esta lista al informar de una canci\u00f3n que no se reproduce.",
        "pd_empty": "Todav\u00eda no hay nada registrado.",
        "pd_copy": "Copiar",
        "pd_clear": "Borrar",
    },
    "fr": {
        "sf_title": "Trouver le titre sur SoundCloud",
        "sf_desc": "Si un titre ne peut pas \u00eatre lu, la m\u00eame chanson est recherch\u00e9e sur SoundCloud et cette version est lue \u00e0 la place.",
        "pd_title": "Diagnostic de lecture",
        "pd_desc": "Tentatives et \u00e9checs de lecture r\u00e9cents. Copiez cette liste lorsque vous signalez un titre qui ne se lance pas.",
        "pd_empty": "Rien d'enregistr\u00e9 pour l'instant.",
        "pd_copy": "Copier",
        "pd_clear": "Effacer",
    },
    "id": {
        "sf_title": "Cari lagu di SoundCloud",
        "sf_desc": "Jika sebuah lagu tidak dapat diputar, lagu yang sama dicari di SoundCloud dan versi itulah yang diputar.",
        "pd_title": "Diagnostik pemutaran",
        "pd_desc": "Percobaan dan kegagalan pemutaran terbaru. Salin daftar ini saat melaporkan lagu yang tidak bisa diputar.",
        "pd_empty": "Belum ada catatan.",
        "pd_copy": "Salin",
        "pd_clear": "Hapus",
    },
    "it": {
        "sf_title": "Trova il brano su SoundCloud",
        "sf_desc": "Se un brano non pu\u00f2 essere riprodotto, viene cercata la stessa canzone su SoundCloud e viene riprodotta quella versione.",
        "pd_title": "Diagnostica riproduzione",
        "pd_desc": "Tentativi ed errori di riproduzione recenti. Copia questo elenco quando segnali un brano che non si avvia.",
        "pd_empty": "Niente registrato per ora.",
        "pd_copy": "Copia",
        "pd_clear": "Cancella",
    },
    "pl": {
        "sf_title": "Znajd\u017a utw\u00f3r na SoundCloud",
        "sf_desc": "Je\u015bli utw\u00f3r nie mo\u017ce by\u0107 odtworzony, ta sama piosenka jest wyszukiwana na SoundCloud i odtwarzana zamiast niej.",
        "pd_title": "Diagnostyka odtwarzania",
        "pd_desc": "Ostatnie pr\u00f3by i b\u0142\u0119dy odtwarzania. Skopiuj t\u0119 list\u0119, zg\u0142aszaj\u0105c utw\u00f3r, kt\u00f3ry si\u0119 nie odtwarza.",
        "pd_empty": "Na razie nic nie zapisano.",
        "pd_copy": "Kopiuj",
        "pd_clear": "Wyczy\u015b\u0107",
    },
    "pt": {
        "sf_title": "Encontrar a m\u00fasica no SoundCloud",
        "sf_desc": "Se uma m\u00fasica n\u00e3o puder ser reproduzida, a mesma m\u00fasica \u00e9 procurada no SoundCloud e essa vers\u00e3o \u00e9 reproduzida.",
        "pd_title": "Diagn\u00f3stico de reprodu\u00e7\u00e3o",
        "pd_desc": "Tentativas e falhas de reprodu\u00e7\u00e3o recentes. Copie esta lista ao relatar uma m\u00fasica que n\u00e3o toca.",
        "pd_empty": "Nada registrado ainda.",
        "pd_copy": "Copiar",
        "pd_clear": "Limpar",
    },
    "ru": {
        "sf_title": "\u041d\u0430\u0439\u0442\u0438 \u0442\u0440\u0435\u043a \u043d\u0430 SoundCloud",
        "sf_desc": "\u0415\u0441\u043b\u0438 \u0442\u0440\u0435\u043a \u043d\u0435 \u0443\u0434\u0430\u0451\u0442\u0441\u044f \u0432\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0441\u0442\u0438, \u0442\u0430 \u0436\u0435 \u043f\u0435\u0441\u043d\u044f \u0438\u0449\u0435\u0442\u0441\u044f \u043d\u0430 SoundCloud \u0438 \u0438\u0433\u0440\u0430\u0435\u0442 \u044d\u0442\u0430 \u0432\u0435\u0440\u0441\u0438\u044f.",
        "pd_title": "\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430 \u0432\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0434\u0435\u043d\u0438\u044f",
        "pd_desc": "\u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435 \u043f\u043e\u043f\u044b\u0442\u043a\u0438 \u0438 \u043e\u0448\u0438\u0431\u043a\u0438 \u0432\u043e\u0441\u043f\u0440\u043e\u0438\u0437\u0432\u0435\u0434\u0435\u043d\u0438\u044f. \u0421\u043a\u043e\u043f\u0438\u0440\u0443\u0439\u0442\u0435 \u044d\u0442\u043e\u0442 \u0441\u043f\u0438\u0441\u043e\u043a \u043f\u0440\u0438 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0438 \u043e \u0442\u0440\u0435\u043a\u0435, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043d\u0435 \u0438\u0433\u0440\u0430\u0435\u0442.",
        "pd_empty": "\u041f\u043e\u043a\u0430 \u043d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u043e.",
        "pd_copy": "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c",
        "pd_clear": "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c",
    },
    "tl": {
        "sf_title": "Hanapin ang kanta sa SoundCloud",
        "sf_desc": "Kung hindi ma-play ang isang kanta, hahanapin ang parehong kanta sa SoundCloud at iyon ang ipapatakbo.",
        "pd_title": "Diagnostic ng pag-play",
        "pd_desc": "Mga kamakailang tangkang pag-play at pagkabigo. Kopyahin ang listahang ito kapag nag-ulat ng kantang hindi tumutugtog.",
        "pd_empty": "Wala pang naitala.",
        "pd_copy": "Kopyahin",
        "pd_clear": "Burahin",
    },
    "tr": {
        "sf_title": "Par\u00e7ay\u0131 SoundCloud'da bul",
        "sf_desc": "Bir par\u00e7a oynatılamıyorsa ayn\u0131 \u015fark\u0131 SoundCloud'da aranır ve o s\u00fcr\u00fcm \u00e7alınır.",
        "pd_title": "Oynatma tanılama",
        "pd_desc": "Son oynatma denemeleri ve hataları. \u00c7almayan bir \u015fark\u0131y\u0131 bildirirken bu listeyi kopyalayın.",
        "pd_empty": "Hen\u00fcz kay\u0131t yok.",
        "pd_copy": "Kopyala",
        "pd_clear": "Temizle",
    },
    "uk": {
        "sf_title": "\u0417\u043d\u0430\u0439\u0442\u0438 \u0442\u0440\u0435\u043a \u043d\u0430 SoundCloud",
        "sf_desc": "\u042f\u043a\u0449\u043e \u0442\u0440\u0435\u043a \u043d\u0435 \u0432\u0434\u0430\u0454\u0442\u044c\u0441\u044f \u0432\u0456\u0434\u0442\u0432\u043e\u0440\u0438\u0442\u0438, \u0442\u0430 \u0441\u0430\u043c\u0430 \u043f\u0456\u0441\u043d\u044f \u0448\u0443\u043a\u0430\u0454\u0442\u044c\u0441\u044f \u043d\u0430 SoundCloud \u0442\u0430 \u0433\u0440\u0430\u0454 \u0446\u044f \u0432\u0435\u0440\u0441\u0456\u044f.",
        "pd_title": "\u0414\u0456\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430 \u0432\u0456\u0434\u0442\u0432\u043e\u0440\u0435\u043d\u043d\u044f",
        "pd_desc": "\u041d\u0435\u0434\u0430\u0432\u043d\u0456 \u0441\u043f\u0440\u043e\u0431\u0438 \u0442\u0430 \u043f\u043e\u043c\u0438\u043b\u043a\u0438 \u0432\u0456\u0434\u0442\u0432\u043e\u0440\u0435\u043d\u043d\u044f. \u0421\u043a\u043e\u043f\u0456\u044e\u0439\u0442\u0435 \u0446\u0435\u0439 \u0441\u043f\u0438\u0441\u043e\u043a, \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u044e\u044e\u0447\u0438 \u043f\u0440\u043e \u0442\u0440\u0435\u043a, \u044f\u043a\u0438\u0439 \u043d\u0435 \u0433\u0440\u0430\u0454.",
        "pd_empty": "\u041f\u043e\u043a\u0438 \u043d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u043e.",
        "pd_copy": "\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438",
        "pd_clear": "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438",
    },
}


def main():
    missing = [code for code in TRANSLATIONS if not os.path.exists(os.path.join(LOCALES_DIR, f"{code}.json"))]
    if missing:
        raise SystemExit(f"missing locale files: {missing}")

    for code, strings in TRANSLATIONS.items():
        path = os.path.join(LOCALES_DIR, f"{code}.json")
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        settings = data.setdefault("settings", {})
        settings["soundcloud_fallback"] = {"title": strings["sf_title"], "description": strings["sf_desc"]}
        settings["playback_diagnostics"] = {
            "title": strings["pd_title"],
            "description": strings["pd_desc"],
            "empty": strings["pd_empty"],
            "copy": strings["pd_copy"],
            "clear": strings["pd_clear"],
        }
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"{code}: +soundcloud_fallback +playback_diagnostics")

    # parity assertion: every locale must carry identical key sets
    key_sets = []
    for code in TRANSLATIONS:
        with open(os.path.join(LOCALES_DIR, f"{code}.json"), encoding="utf-8") as fh:
            data = json.load(fh)
        key_sets.append((
            code,
            sorted(data["settings"]["soundcloud_fallback"].keys()),
            sorted(data["settings"]["playback_diagnostics"].keys()),
        ))
    base = key_sets[0]
    for code, sf, pd in key_sets[1:]:
        assert sf == base[1], f"{code} soundcloud_fallback key mismatch: {sf}"
        assert pd == base[2], f"{code} playback_diagnostics key mismatch: {pd}"
    print(f"parity OK across {len(key_sets)} locales: {base[1]} + {base[2]}")


if __name__ == "__main__":
    main()

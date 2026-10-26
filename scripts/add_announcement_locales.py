#!/usr/bin/env python3
"""Add announcement strings to all locale files.

Keys added:
  settings.tabs.announcement
  settings.groups.website
  settings.announcement.*   (settings tab copy)
  announcement.*            (global popup copy)
"""
import json
import os
from collections import OrderedDict

LOCALES_DIR = "/home/z/my-project/liner-app/src/languages/locales"

T = {
    "en": {
        "tab": "Announcement", "group": "Website",
        "description": "Broadcast a message to everyone on the website.",
        "section_title": "Global announcement",
        "section_subtitle": "Website port only — everyone currently on the website will see your announcement popup within 10 seconds. It disappears after 1 minute.",
        "message_label": "Message",
        "message_placeholder": "the website will be updating soon with bug fixes, etc.\nsee you soon liners!",
        "send": "Send announcement",
        "sending": "Sending…",
        "shortcut_hint": "Tip: press Ctrl+Enter to send.",
        "confirm_title": "Announcement sent",
        "confirm_body": "The message will send globally within 10 seconds.",
        "okay": "Okay",
        "error_empty": "Write a message first.",
        "error_unauthorized": "Your session expired — sign in again and try again.",
        "error_forbidden": "Only JayJoice can send announcements.",
        "error_rate_limited": "Easy! Wait a few seconds between announcements.",
        "error_generic": "Couldn't send the announcement. Please try again.",
        "title_prefix": "Announcement From",
        "expires_note": "this message will be gone within 1 minute",
    },
    "de": {
        "tab": "Ankündigung", "group": "Webseite",
        "description": "Alle Nutzer der Webseite mit einer Nachricht erreichen.",
        "section_title": "Globale Ankündigung",
        "section_subtitle": "Nur Web-Port — alle, die gerade auf der Webseite sind, sehen dein Ankündigungs-Popup innerhalb von 10 Sekunden. Es verschwindet nach 1 Minute.",
        "message_label": "Nachricht",
        "message_placeholder": "die Webseite wird bald mit Fehlerbehebungen usw. aktualisiert.\nbis bald, liners!",
        "send": "Ankündigung senden",
        "sending": "Wird gesendet…",
        "shortcut_hint": "Tipp: Mit Strg+Eingabe senden.",
        "confirm_title": "Ankündigung gesendet",
        "confirm_body": "Die Nachricht wird innerhalb von 10 Sekunden global gesendet.",
        "okay": "Okay",
        "error_empty": "Schreibe zuerst eine Nachricht.",
        "error_unauthorized": "Deine Sitzung ist abgelaufen — melde dich erneut an und versuche es nochmal.",
        "error_forbidden": "Nur JayJoice kann Ankündigungen senden.",
        "error_rate_limited": "Ganz ruhig! Warte ein paar Sekunden zwischen Ankündigungen.",
        "error_generic": "Ankündigung konnte nicht gesendet werden. Bitte versuche es erneut.",
        "title_prefix": "Ankündigung von",
        "expires_note": "diese Nachricht verschwindet innerhalb von 1 Minute",
    },
    "es": {
        "tab": "Anuncio", "group": "Sitio web",
        "description": "Envía un mensaje a todos los usuarios del sitio web.",
        "section_title": "Anuncio global",
        "section_subtitle": "Solo en la versión web — todos los que estén en el sitio verán tu anuncio en un máximo de 10 segundos. Desaparece después de 1 minuto.",
        "message_label": "Mensaje",
        "message_placeholder": "el sitio web se actualizará pronto con correcciones de errores, etc.\n¡nos vemos pronto, liners!",
        "send": "Enviar anuncio",
        "sending": "Enviando…",
        "shortcut_hint": "Consejo: pulsa Ctrl+Enter para enviar.",
        "confirm_title": "Anuncio enviado",
        "confirm_body": "El mensaje se enviará globalmente en un plazo de 10 segundos.",
        "okay": "Vale",
        "error_empty": "Escribe primero un mensaje.",
        "error_unauthorized": "Tu sesión caducó — inicia sesión de nuevo e inténtalo otra vez.",
        "error_forbidden": "Solo JayJoice puede enviar anuncios.",
        "error_rate_limited": "¡Tranquilo! Espera unos segundos entre anuncios.",
        "error_generic": "No se pudo enviar el anuncio. Inténtalo de nuevo.",
        "title_prefix": "Anuncio de",
        "expires_note": "este mensaje desaparecerá en 1 minuto",
    },
    "fr": {
        "tab": "Annonce", "group": "Site web",
        "description": "Diffusez un message à tous les utilisateurs du site web.",
        "section_title": "Annonce globale",
        "section_subtitle": "Portail web uniquement — toutes les personnes présentes sur le site verront votre annonce sous 10 secondes. Elle disparaît après 1 minute.",
        "message_label": "Message",
        "message_placeholder": "le site web sera bientôt mis à jour avec des corrections de bugs, etc.\nà bientôt, liners !",
        "send": "Envoyer l'annonce",
        "sending": "Envoi…",
        "shortcut_hint": "Astuce : appuyez sur Ctrl+Entrée pour envoyer.",
        "confirm_title": "Annonce envoyée",
        "confirm_body": "Le message sera diffusé globalement sous 10 secondes.",
        "okay": "Ok",
        "error_empty": "Écrivez d'abord un message.",
        "error_unauthorized": "Votre session a expiré — reconnectez-vous et réessayez.",
        "error_forbidden": "Seul JayJoice peut envoyer des annonces.",
        "error_rate_limited": "Doucement ! Attendez quelques secondes entre les annonces.",
        "error_generic": "Impossible d'envoyer l'annonce. Veuillez réessayer.",
        "title_prefix": "Annonce de",
        "expires_note": "ce message disparaîtra dans 1 minute",
    },
    "id": {
        "tab": "Pengumuman", "group": "Situs web",
        "description": "Kirim pesan ke semua pengguna situs web.",
        "section_title": "Pengumuman global",
        "section_subtitle": "Khusus port web — semua yang sedang ada di situs web akan melihat popup pengumumanmu dalam 10 detik. Hilang setelah 1 menit.",
        "message_label": "Pesan",
        "message_placeholder": "situs web akan segera diperbarui dengan perbaikan bug, dll.\nsampai jumpa, liners!",
        "send": "Kirim pengumuman",
        "sending": "Mengirim…",
        "shortcut_hint": "Tips: tekan Ctrl+Enter untuk mengirim.",
        "confirm_title": "Pengumuman terkirim",
        "confirm_body": "Pesan akan terkirim secara global dalam 10 detik.",
        "okay": "Oke",
        "error_empty": "Tulis pesan dulu.",
        "error_unauthorized": "Sesimu sudah kedaluwarsa — masuk lagi lalu coba lagi.",
        "error_forbidden": "Hanya JayJoice yang bisa mengirim pengumuman.",
        "error_rate_limited": "Perlahan! Tunggu beberapa detik antar pengumuman.",
        "error_generic": "Gagal mengirim pengumuman. Coba lagi.",
        "title_prefix": "Pengumuman dari",
        "expires_note": "pesan ini akan hilang dalam 1 menit",
    },
    "it": {
        "tab": "Annuncio", "group": "Sito web",
        "description": "Invia un messaggio a tutti gli utenti del sito web.",
        "section_title": "Annuncio globale",
        "section_subtitle": "Solo porta web — tutti coloro che sono sul sito vedranno il tuo annuncio entro 10 secondi. Scompare dopo 1 minuto.",
        "message_label": "Messaggio",
        "message_placeholder": "il sito web verrà presto aggiornato con correzioni di bug, ecc.\na presto, liners!",
        "send": "Invia annuncio",
        "sending": "Invio…",
        "shortcut_hint": "Suggerimento: premi Ctrl+Invio per inviare.",
        "confirm_title": "Annuncio inviato",
        "confirm_body": "Il messaggio verrà inviato globalmente entro 10 secondi.",
        "okay": "Ok",
        "error_empty": "Scrivi prima un messaggio.",
        "error_unauthorized": "Sessione scaduta — accedi di nuovo e riprova.",
        "error_forbidden": "Solo JayJoice può inviare annunci.",
        "error_rate_limited": "Piano! Aspetta qualche secondo tra gli annunci.",
        "error_generic": "Impossibile inviare l'annuncio. Riprova.",
        "title_prefix": "Annuncio di",
        "expires_note": "questo messaggio sparirà entro 1 minuto",
    },
    "pl": {
        "tab": "Ogłoszenie", "group": "Strona internetowa",
        "description": "Wyślij wiadomość do wszystkich osób na stronie.",
        "section_title": "Ogłoszenie globalne",
        "section_subtitle": "Tylko wersja przeglądarkowa — wszyscy na stronie zobaczą twoje ogłoszenie w ciągu 10 sekund. Znika po 1 minucie.",
        "message_label": "Wiadomość",
        "message_placeholder": "strona zostanie wkrótce zaktualizowana o poprawki błędów itp.\ndo zobaczenia, linersi!",
        "send": "Wyślij ogłoszenie",
        "sending": "Wysyłanie…",
        "shortcut_hint": "Wskazówka: naciśnij Ctrl+Enter, aby wysłać.",
        "confirm_title": "Ogłoszenie wysłane",
        "confirm_body": "Wiadomość zostanie wysłana globalnie w ciągu 10 sekund.",
        "okay": "Okej",
        "error_empty": "Najpierw napisz wiadomość.",
        "error_unauthorized": "Sesja wygasła — zaloguj się ponownie i spróbuj jeszcze raz.",
        "error_forbidden": "Tylko JayJoice może wysyłać ogłoszenia.",
        "error_rate_limited": "Spokojnie! Odczekaj kilka sekund między ogłoszeniami.",
        "error_generic": "Nie udało się wysłać ogłoszenia. Spróbuj ponownie.",
        "title_prefix": "Ogłoszenie od",
        "expires_note": "ta wiadomość zniknie w ciągu 1 minuty",
    },
    "pt": {
        "tab": "Anúncio", "group": "Site",
        "description": "Envie uma mensagem para todos no site.",
        "section_title": "Anúncio global",
        "section_subtitle": "Apenas na versão web — todos que estiverem no site verão seu anúncio em até 10 segundos. Ele desaparece após 1 minuto.",
        "message_label": "Mensagem",
        "message_placeholder": "o site será atualizado em breve com correções de bugs, etc.\naté logo, liners!",
        "send": "Enviar anúncio",
        "sending": "Enviando…",
        "shortcut_hint": "Dica: pressione Ctrl+Enter para enviar.",
        "confirm_title": "Anúncio enviado",
        "confirm_body": "A mensagem será enviada globalmente em até 10 segundos.",
        "okay": "Ok",
        "error_empty": "Escreva uma mensagem primeiro.",
        "error_unauthorized": "Sua sessão expirou — entre novamente e tente de novo.",
        "error_forbidden": "Apenas JayJoice pode enviar anúncios.",
        "error_rate_limited": "Calma! Espere alguns segundos entre anúncios.",
        "error_generic": "Não foi possível enviar o anúncio. Tente novamente.",
        "title_prefix": "Anúncio de",
        "expires_note": "esta mensagem vai desaparecer em 1 minuto",
    },
    "ru": {
        "tab": "Объявление", "group": "Веб-сайт",
        "description": "Отправьте сообщение всем пользователям сайта.",
        "section_title": "Глобальное объявление",
        "section_subtitle": "Только для веб-версии — все, кто сейчас на сайте, увидят ваше объявление в течение 10 секунд. Оно исчезнет через 1 минуту.",
        "message_label": "Сообщение",
        "message_placeholder": "сайт скоро обновится с исправлениями ошибок и т.д.\nдо встречи, лайнеры!",
        "send": "Отправить объявление",
        "sending": "Отправка…",
        "shortcut_hint": "Совет: нажмите Ctrl+Enter для отправки.",
        "confirm_title": "Объявление отправлено",
        "confirm_body": "Сообщение будет отправлено всем в течение 10 секунд.",
        "okay": "Ок",
        "error_empty": "Сначала напишите сообщение.",
        "error_unauthorized": "Ваша сессия истекла — войдите снова и повторите попытку.",
        "error_forbidden": "Объявления может отправлять только JayJoice.",
        "error_rate_limited": "Легче! Подождите несколько секунд между объявлениями.",
        "error_generic": "Не удалось отправить объявление. Попробуйте ещё раз.",
        "title_prefix": "Объявление от",
        "expires_note": "это сообщение исчезнет в течение 1 минуты",
    },
    "tl": {
        "tab": "Anunsiyo", "group": "Website",
        "description": "Magpadala ng mensahe sa lahat ng user ng website.",
        "section_title": "Pandaigdigang anunsiyo",
        "section_subtitle": "Web port lang — makikita ng lahat ng nasa website ang anunsiyo mo within 10 seconds. Mawawala ito pagkatapos ng 1 minuto.",
        "message_label": "Mensahe",
        "message_placeholder": "maa-update na soon ang website na may mga bug fix, atbp.\nsee you soon, liners!",
        "send": "Ipadala ang anunsiyo",
        "sending": "Ipinapadala…",
        "shortcut_hint": "Tip: pindutin ang Ctrl+Enter para magpadala.",
        "confirm_title": "Naipadala ang anunsiyo",
        "confirm_body": "Ang mensahe ay ipapadala globally within 10 seconds.",
        "okay": "Sige",
        "error_empty": "Magsulat muna ng mensahe.",
        "error_unauthorized": "Nag-expire ang session mo — mag-sign in ulit at subukan muli.",
        "error_forbidden": "Si JayJoice lang ang maaaring magpadala ng mga anunsiyo.",
        "error_rate_limited": "Dahan-dahan! Maghintay ng ilang segundo bago muli.",
        "error_generic": "Hindi naipadala ang anunsiyo. Subukan muli.",
        "title_prefix": "Anunsiyo mula kay",
        "expires_note": "mawawala ang mensaheng ito within 1 minute",
    },
    "tr": {
        "tab": "Duyuru", "group": "Web sitesi",
        "description": "Web sitesindeki herkese bir mesaj gönder.",
        "section_title": "Global duyuru",
        "section_subtitle": "Sadece web portası — sitedeki herkes duyurunu 10 saniye içinde görecek. 1 dakika sonra kaybolur.",
        "message_label": "Mesaj",
        "message_placeholder": "web sitesi yakında hata düzeltmeleri vb. ile güncellenecek.\nyakında görüşürüz liners!",
        "send": "Duyuruyu gönder",
        "sending": "Gönderiliyor…",
        "shortcut_hint": "İpucu: göndermek için Ctrl+Enter'a bas.",
        "confirm_title": "Duyuru gönderildi",
        "confirm_body": "Mesaj 10 saniye içinde global olarak gönderilecek.",
        "okay": "Tamam",
        "error_empty": "Önce bir mesaj yaz.",
        "error_unauthorized": "Oturumun süresi doldu — tekrar giriş yap ve yeniden dene.",
        "error_forbidden": "Sadece JayJoice duyuru gönderebilir.",
        "error_rate_limited": "Sakin! Duyurular arasında birkaç saniye bekle.",
        "error_generic": "Duyuru gönderilemedi. Lütfen tekrar dene.",
        "title_prefix": "Duyuru yapan:",
        "expires_note": "bu mesaj 1 dakika içinde kaybolacak",
    },
    "uk": {
        "tab": "Оголошення", "group": "Веб-сайт",
        "description": "Надішліть повідомлення всім користувачам сайту.",
        "section_title": "Глобальне оголошення",
        "section_subtitle": "Лише для веб-версії — усі, хто зараз на сайті, побачать ваше оголошення протягом 10 секунд. Воно зникне через 1 хвилину.",
        "message_label": "Повідомлення",
        "message_placeholder": "сайт скоро оновиться з виправленнями помилок тощо.\nдо зустрічі, лайнери!",
        "send": "Надіслати оголошення",
        "sending": "Надсилання…",
        "shortcut_hint": "Порада: натисніть Ctrl+Enter, щоб надіслати.",
        "confirm_title": "Оголошення надіслано",
        "confirm_body": "Повідомлення буде надіслано всім протягом 10 секунд.",
        "okay": "Ок",
        "error_empty": "Спочатку напишіть повідомлення.",
        "error_unauthorized": "Ваша сесія завершилася — увійдіть знову та повторіть спробу.",
        "error_forbidden": "Оголошення може надсилати лише JayJoice.",
        "error_rate_limited": "Спокійно! Зачекайте кілька секунд між оголошеннями.",
        "error_generic": "Не вдалося надіслати оголошення. Спробуйте ще раз.",
        "title_prefix": "Оголошення від",
        "expires_note": "це повідомлення зникне протягом 1 хвилини",
    },
}

SETTINGS_ANNOUNCEMENT_KEYS = [
    "description", "section_title", "section_subtitle", "message_label",
    "message_placeholder", "send", "sending", "shortcut_hint",
    "confirm_title", "confirm_body", "okay", "error_empty",
    "error_unauthorized", "error_forbidden", "error_rate_limited", "error_generic",
]

POPUP_KEYS = ["title_prefix", "expires_note", "okay"]

added = []
for locale, texts in T.items():
    path = os.path.join(LOCALES_DIR, f"{locale}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f, object_pairs_hook=OrderedDict)

    settings = data.setdefault("settings", OrderedDict())
    tabs = settings.setdefault("tabs", OrderedDict())
    tabs["announcement"] = texts["tab"]
    groups = settings.setdefault("groups", OrderedDict())
    groups["website"] = texts["group"]
    settings["announcement"] = OrderedDict(
        [(k, texts[k]) for k in SETTINGS_ANNOUNCEMENT_KEYS]
    )

    data["announcement"] = OrderedDict([(k, texts[k]) for k in POPUP_KEYS])

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    added.append(locale)

# cross-locale parity assertion
for locale in T:
    path = os.path.join(LOCALES_DIR, f"{locale}.json")
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    assert "announcement" in data["settings"]["tabs"], locale
    assert "website" in data["settings"]["groups"], locale
    assert set(data["settings"]["announcement"].keys()) == set(SETTINGS_ANNOUNCEMENT_KEYS), locale
    assert set(data["announcement"].keys()) == set(POPUP_KEYS), locale

print("added announcement keys to:", ", ".join(added))

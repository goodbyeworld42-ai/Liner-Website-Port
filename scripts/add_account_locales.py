#!/usr/bin/env python3
"""Add AccountTab locale keys (settings.profile.* + settings.groups.account) to all locales.

Key ordering mirrors en.json layout: description right after title, avatar keys
after avatar_url_placeholder, security keys at the end of settings.profile.
"""
import json
import sys
from pathlib import Path

LOCALES_DIR = Path("/home/z/my-project/liner-app/src/languages/locales")

# new keys under settings.profile, per locale
PROFILE_KEYS = {
    "en": {
        "description": "Update your public profile, avatar and privacy preferences.",
        "avatar_change": "Upload photo",
        "avatar_remove": "Remove photo",
        "avatar_updated": "Profile photo updated",
        "avatar_removed": "Profile photo removed",
        "avatar_invalid": "Please choose a PNG, JPEG, WebP or GIF image.",
        "avatar_too_large": "That image is too large. Please choose one under 10 MB.",
        "avatar_failed": "Couldn't process this image. Please try another one.",
        "security_section": "Security",
        "change_password": "Change password",
        "password_note": "Liner accounts are managed by the Liner service, which doesn't offer in-app password changes yet. Contact support if you need to change yours.",
        "contact_support": "Contact support",
    },
    "ru": {
        "description": "Обновите публичный профиль, аватар и настройки конфиденциальности.",
        "avatar_change": "Загрузить фото",
        "avatar_remove": "Удалить фото",
        "avatar_updated": "Фото профиля обновлено",
        "avatar_removed": "Фото профиля удалено",
        "avatar_invalid": "Выберите изображение PNG, JPEG, WebP или GIF.",
        "avatar_too_large": "Изображение слишком большое. Выберите файл до 10 МБ.",
        "avatar_failed": "Не удалось обработать это изображение. Попробуйте другое.",
        "security_section": "Безопасность",
        "change_password": "Смена пароля",
        "password_note": "Аккаунтами Liner управляет сервис Liner, который пока не поддерживает смену пароля в приложении. Если нужно изменить пароль, обратитесь в поддержку.",
        "contact_support": "Связаться с поддержкой",
    },
    "uk": {
        "description": "Оновіть публічний профіль, аватар і налаштування приватності.",
        "avatar_change": "Завантажити фото",
        "avatar_remove": "Видалити фото",
        "avatar_updated": "Фото профілю оновлено",
        "avatar_removed": "Фото профілю видалено",
        "avatar_invalid": "Виберіть зображення PNG, JPEG, WebP або GIF.",
        "avatar_too_large": "Зображення задоступно велике. Виберіть файл до 10 МБ.",
        "avatar_failed": "Не вдалося обробити це зображення. Спробуйте інше.",
        "security_section": "Безпека",
        "change_password": "Зміна пароля",
        "password_note": "Обліковими записами Liner керує сервіс Liner, який поки не підтримує зміну пароля в застосунку. Якщо потрібно змінити пароль, зверніться до підтримки.",
        "contact_support": "Звернутися до підтримки",
    },
    "de": {
        "description": "Aktualisiere dein öffentliches Profil, deinen Avatar und deine Privatsphäre-Einstellungen.",
        "avatar_change": "Foto hochladen",
        "avatar_remove": "Foto entfernen",
        "avatar_updated": "Profilfoto aktualisiert",
        "avatar_removed": "Profilfoto entfernt",
        "avatar_invalid": "Bitte wähle ein PNG-, JPEG-, WebP- oder GIF-Bild.",
        "avatar_too_large": "Das Bild ist zu groß. Bitte wähle eines unter 10 MB.",
        "avatar_failed": "Dieses Bild konnte nicht verarbeitet werden. Versuche ein anderes.",
        "security_section": "Sicherheit",
        "change_password": "Passwort ändern",
        "password_note": "Liner-Konten werden vom Liner-Dienst verwaltet, der derzeit keine Passwortänderung in der App anbietet. Wende dich an den Support, wenn du dein Passwort ändern möchtest.",
        "contact_support": "Support kontaktieren",
    },
    "es": {
        "description": "Actualiza tu perfil público, tu avatar y tus preferencias de privacidad.",
        "avatar_change": "Subir foto",
        "avatar_remove": "Eliminar foto",
        "avatar_updated": "Foto de perfil actualizada",
        "avatar_removed": "Foto de perfil eliminada",
        "avatar_invalid": "Elige una imagen PNG, JPEG, WebP o GIF.",
        "avatar_too_large": "La imagen es demasiado grande. Elige una de menos de 10 MB.",
        "avatar_failed": "No se pudo procesar esta imagen. Prueba con otra.",
        "security_section": "Seguridad",
        "change_password": "Cambiar contraseña",
        "password_note": "Las cuentas de Liner las gestiona el servicio de Liner, que todavía no ofrece cambios de contraseña en la app. Contacta con el soporte si necesitas cambiarla.",
        "contact_support": "Contactar con soporte",
    },
    "fr": {
        "description": "Mettez à jour votre profil public, votre avatar et vos préférences de confidentialité.",
        "avatar_change": "Importer une photo",
        "avatar_remove": "Supprimer la photo",
        "avatar_updated": "Photo de profil mise à jour",
        "avatar_removed": "Photo de profil supprimée",
        "avatar_invalid": "Choisissez une image PNG, JPEG, WebP ou GIF.",
        "avatar_too_large": "Cette image est trop grande. Choisissez-en une de moins de 10 Mo.",
        "avatar_failed": "Impossible de traiter cette image. Essayez-en une autre.",
        "security_section": "Sécurité",
        "change_password": "Changer le mot de passe",
        "password_note": "Les comptes Liner sont gérés par le service Liner, qui ne propose pas encore de changement de mot de passe dans l'application. Contactez le support si vous devez changer le vôtre.",
        "contact_support": "Contacter le support",
    },
    "it": {
        "description": "Aggiorna il tuo profilo pubblico, l'avatar e le preferenze sulla privacy.",
        "avatar_change": "Carica foto",
        "avatar_remove": "Rimuovi foto",
        "avatar_updated": "Foto del profilo aggiornata",
        "avatar_removed": "Foto del profilo rimossa",
        "avatar_invalid": "Scegli un'immagine PNG, JPEG, WebP o GIF.",
        "avatar_too_large": "L'immagine è troppo grande. Scegline una sotto i 10 MB.",
        "avatar_failed": "Impossibile elaborare questa immagine. Provatene un'altra.",
        "security_section": "Sicurezza",
        "change_password": "Cambia password",
        "password_note": "Gli account Liner sono gestiti dal servizio Liner, che non offre ancora il cambio password in-app. Contatta l'assistenza se devi cambiarlo.",
        "contact_support": "Contatta l'assistenza",
    },
    "pl": {
        "description": "Zaktualizuj profil publiczny, avatar i preferencje prywatności.",
        "avatar_change": "Prześlij zdjęcie",
        "avatar_remove": "Usuń zdjęcie",
        "avatar_updated": "Zdjęcie profilowe zaktualizowane",
        "avatar_removed": "Zdjęcie profilowe usunięte",
        "avatar_invalid": "Wybierz obraz PNG, JPEG, WebP lub GIF.",
        "avatar_too_large": "Obraz jest za duży. Wybierz plik poniżej 10 MB.",
        "avatar_failed": "Nie udało się przetworzyć tego obrazu. Spróbuj innego.",
        "security_section": "Bezpieczeństwo",
        "change_password": "Zmień hasło",
        "password_note": "Kontami Liner zarządza serwis Liner, który nie obsługuje jeszcze zmiany hasła w aplikacji. Skontaktuj się z pomocą techniczną, jeśli chcesz je zmienić.",
        "contact_support": "Skontaktuj się z pomocą",
    },
    "pt": {
        "description": "Atualize o seu perfil público, o avatar e as preferências de privacidade.",
        "avatar_change": "Carregar foto",
        "avatar_remove": "Remover foto",
        "avatar_updated": "Foto de perfil atualizada",
        "avatar_removed": "Foto de perfil removida",
        "avatar_invalid": "Escolha uma imagem PNG, JPEG, WebP ou GIF.",
        "avatar_too_large": "A imagem é demasiado grande. Escolha uma com menos de 10 MB.",
        "avatar_failed": "Não foi possível processar esta imagem. Tente outra.",
        "security_section": "Segurança",
        "change_password": "Alterar palavra-passe",
        "password_note": "As contas Liner são geridas pelo serviço Liner, que ainda não oferece alteração de palavra-passe na app. Contacte o suporte se precisar de a alterar.",
        "contact_support": "Contactar o suporte",
    },
    "tr": {
        "description": "Herkese açık profilini, avatarını ve gizlilik tercihlerini güncelle.",
        "avatar_change": "Fotoğraf yükle",
        "avatar_remove": "Fotoğrafı kaldır",
        "avatar_updated": "Profil fotoğrafı güncellendi",
        "avatar_removed": "Profil fotoğrafı kaldırıldı",
        "avatar_invalid": "Lütfen PNG, JPEG, WebP veya GIF bir görsel seç.",
        "avatar_too_large": "Görsel çok büyük. Lütfen 10 MB altında bir dosya seç.",
        "avatar_failed": "Bu görsel işlenemedi. Lütfen başka bir tane dene.",
        "security_section": "Güvenlik",
        "change_password": "Şifre değiştir",
        "password_note": "Liner hesapları Liner hizmeti tarafından yönetilir ve hizmet henüz uygulama içi şifre değişikliği sunmuyor. Şifreni değiştirmen gerekiyorsa desteğe ulaş.",
        "contact_support": "Desteğe ulaş",
    },
    "tl": {
        "description": "I-update ang iyong pampublikong profile, avatar, at mga preference sa privacy.",
        "avatar_change": "Mag-upload ng photo",
        "avatar_remove": "Alisin ang photo",
        "avatar_updated": "Na-update ang profile photo",
        "avatar_removed": "Natanggal ang profile photo",
        "avatar_invalid": "Pumili ng PNG, JPEG, WebP o GIF na imahe.",
        "avatar_too_large": "Masyadong malaki ang imahe. Pumili ng mas maliit sa 10 MB.",
        "avatar_failed": "Hindi ma-process ang imaheng ito. Subukan ang iba.",
        "security_section": "Seguridad",
        "change_password": "Palitan ang password",
        "password_note": "Ang mga Liner account ay pinangangasiwaan ng Liner service, na hindi pa offer ang pagpalit ng password sa app. Makipag-ugnayan sa support kung kailangan mong palitan ito.",
        "contact_support": "Makipag-ugnayan sa support",
    },
    "id": {
        "description": "Perbarui profil publik, avatar, dan preferensi privasi Anda.",
        "avatar_change": "Unggah foto",
        "avatar_remove": "Hapus foto",
        "avatar_updated": "Foto profil diperbarui",
        "avatar_removed": "Foto profil dihapus",
        "avatar_invalid": "Pilih gambar PNG, JPEG, WebP, atau GIF.",
        "avatar_too_large": "Gambar terlalu besar. Pilih yang di bawah 10 MB.",
        "avatar_failed": "Tidak dapat memproses gambar ini. Coba gambar lain.",
        "security_section": "Keamanan",
        "change_password": "Ubah kata sandi",
        "password_note": "Akun Liner dikelola oleh layanan Liner, yang belum menyediakan perubahan kata sandi di dalam aplikasi. Hubungi dukungan jika Anda perlu mengubahnya.",
        "contact_support": "Hubungi dukungan",
    },
}

GROUPS_ACCOUNT = {
    "en": "Account", "ru": "Аккаунт", "uk": "Акаунт", "de": "Konto",
    "es": "Cuenta", "fr": "Compte", "it": "Account", "pl": "Konto",
    "pt": "Conta", "tr": "Hesap", "tl": "Account", "id": "Akun",
}


def insert_profile_keys(profile: dict, keys: dict) -> dict:
    """Insert new keys keeping en.json-like ordering."""
    out: dict = {}
    for k, v in profile.items():
        out[k] = v
        if k == "title":
            out["description"] = keys["description"]
        if k == "avatar_url_placeholder":
            for name in ("avatar_change", "avatar_remove", "avatar_updated",
                         "avatar_removed", "avatar_invalid", "avatar_too_large",
                         "avatar_failed"):
                out[name] = keys[name]
    missing = [k for k in keys if k not in out]
    if missing:
        # security keys appended at the end in a stable order
        for name in ("security_section", "change_password", "password_note",
                     "contact_support"):
            out[name] = keys[name]
        remaining = [k for k in missing if k not in out]
        if remaining:
            raise SystemExit(f"unplaced keys: {remaining}")
    # verify all present
    for k in keys:
        if k not in out:
            raise SystemExit(f"missing {k}")
    return out


def main() -> None:
    for locale, keys in PROFILE_KEYS.items():
        path = LOCALES_DIR / f"{locale}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        settings = data["settings"]
        before = len(json.dumps(settings, ensure_ascii=False))

        profile = settings.get("profile", {})
        if "change_password" in profile:
            print(f"{locale}: already has keys, refreshing values")
        settings["profile"] = insert_profile_keys(profile, keys)

        groups = settings.setdefault("groups", {})
        groups["account"] = GROUPS_ACCOUNT[locale]

        text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        path.write_text(text, encoding="utf-8")
        print(f"{locale}: profile keys now {len(flatten_keys(settings['profile']))}, groups.account={groups['account']}")

    # parity check across all locale files
    base = None
    for path in sorted(LOCALES_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        keys = frozenset(flatten_keys(data["settings"]["profile"]))
        if base is None:
            base = keys
        elif keys != base:
            only_here = keys - base
            only_base = base - keys
            raise SystemExit(
                f"parity break in {path.name}: +{sorted(only_here)} -{sorted(only_base)}"
            )
    print("parity OK: settings.profile identical across all locales")


def flatten_keys(obj, prefix=""):
    keys = set()
    for k, v in obj.items():
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys |= flatten_keys(v, path)
        else:
            keys.add(path)
    return keys


if __name__ == "__main__":
    main()
